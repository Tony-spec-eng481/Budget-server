const db = require('../db');

const groupProducts = (rows) => {
  const grouped = {};
  for (const row of rows) {
    const key = `${row.name.toLowerCase()}_${row.category.toLowerCase()}_${row.quantity.toLowerCase()}`;
    if (!grouped[key]) {
      grouped[key] = {
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        prices: {}
      };
    }
    grouped[key].prices[row.supermarket_name || 'Default'] = parseFloat(row.price);
  }
  return Object.values(grouped);
};

exports.getProducts = async (req, res) => {
  try {
    const { query } = req.query;

    const baseSelect = `
      SELECT p.id, p.name, p.category, p.quantity, p.price,
             s.name AS supermarket_name
      FROM products p
      LEFT JOIN supermarkets s ON p.supermarket_id = s.id
    `;

    if (query && query.trim().length >= 1) {
      const normalizedQuery = query.toLowerCase().trim();
      const tokens = normalizedQuery.split(/\s+/);

      let sql = baseSelect + ' WHERE ';
      const conditions = [];
      const params = [];

      tokens.forEach((token, idx) => {
        params.push(`%${token}%`);
        conditions.push(
          `(LOWER(p.name) LIKE $${idx + 1} OR LOWER(p.category) LIKE $${idx + 1} OR LOWER(p.quantity) LIKE $${idx + 1})`
        );
      });

      sql += conditions.join(' AND ') + ' ORDER BY p.name ASC LIMIT 100';
      const result = await db.query(sql, params);
      const grouped = groupProducts(result.rows);
      return res.json(grouped.slice(0, 10));
    }

    // Default: return all products
    const result = await db.query(baseSelect + ' ORDER BY p.name ASC');
    const grouped = groupProducts(result.rows);
    return res.json(grouped);
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching products.' });
  }
};

exports.getSupermarkets = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, created_at AS "createdAt"
       FROM supermarkets
       ORDER BY name ASC`
    );

    const locsResult = await db.query(
      `SELECT id, supermarket_id AS "supermarketId", name, county, town
       FROM supermarket_locations
       ORDER BY name ASC`
    );

    const locationsMap = {};
    for (const loc of locsResult.rows) {
      if (!locationsMap[loc.supermarketId]) {
        locationsMap[loc.supermarketId] = [];
      }
      locationsMap[loc.supermarketId].push({
        id: loc.id,
        name: loc.name,
        county: loc.county || '',
        town: loc.town || ''
      });
    }

    const supermarkets = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt,
      locations: locationsMap[r.id] || []
    }));

    return res.json(supermarkets);
  } catch (error) {
    console.error('getSupermarkets public error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching supermarkets.' });
  }
};

