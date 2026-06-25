const db = require('../db');

exports.getProducts = async (req, res) => {
  try {
    const { query } = req.query;
    if (query && query.trim().length >= 2) {
      const normalizedQuery = query.toLowerCase().trim();
      const tokens = normalizedQuery.split(/\s+/);
      
      // Build full text search or simple multi-word like queries in Postgres
      let sql = 'SELECT * FROM products WHERE ';
      const conditions = [];
      const params = [];
      
      tokens.forEach((token, idx) => {
        params.push(`%${token}%`);
        conditions.push(`(LOWER(name) LIKE $${idx + 1} OR LOWER(category) LIKE $${idx + 1} OR LOWER(quantity) LIKE $${idx + 1})`);
      });
      
      sql += conditions.join(' AND ') + ' LIMIT 10';
      const result = await db.query(sql, params);
      
      // Transform keys to match frontend Record format: prices: { Magunas }
      const formatted = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        prices: {
          Magunas: parseFloat(row.price_magunas)
        }
      }));
      return res.json(formatted);
    }

    // Default to return all products
    const result = await db.query('SELECT * FROM products ORDER BY name ASC');
    const formatted = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      quantity: row.quantity,
      prices: {
        Magunas: parseFloat(row.price_magunas)
      }
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching products.' });
  }
};
