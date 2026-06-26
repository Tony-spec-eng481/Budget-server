const db = require('../db');

function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fetch all locations for a given supermarket ID
 */
async function getLocationsForSupermarket(supermarketId) {
  const result = await db.query(
    `SELECT id, name, county, town, created_at AS "createdAt"
     FROM supermarket_locations
     WHERE supermarket_id = $1
     ORDER BY name ASC`,
    [supermarketId]
  );
  return result.rows;
}

/**
 * Fetch all locations for every supermarket (keyed by supermarket ID)
 */
async function getAllLocationsMap() {
  const result = await db.query(
    `SELECT id, supermarket_id AS "supermarketId", name, county, town, created_at AS "createdAt"
     FROM supermarket_locations
     ORDER BY name ASC`
  );
  const map = {};
  for (const loc of result.rows) {
    if (!map[loc.supermarketId]) map[loc.supermarketId] = [];
    map[loc.supermarketId].push(loc);
  }
  return map;
}

// ─── Supermarket CRUD ───────────────────────────────────────────────────────

// GET /api/admin/supermarkets
exports.getSupermarkets = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.name, s.created_at AS "createdAt",
              COUNT(p.id) AS "productCount"
       FROM supermarkets s
       LEFT JOIN products p ON p.supermarket_id = s.id
       GROUP BY s.id
       ORDER BY s.name ASC`
    );

    const locationsMap = await getAllLocationsMap();

    const supermarkets = result.rows.map(r => ({
      ...r,
      productCount: parseInt(r.productCount, 10),
      locations: locationsMap[r.id] || []
    }));

    return res.json(supermarkets);
  } catch (error) {
    console.error('getSupermarkets error:', error);
    return res.status(500).json({ error: 'Failed to retrieve supermarkets.' });
  }
};

// POST /api/admin/supermarkets
exports.addSupermarket = async (req, res) => {
  const { name, locations } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Supermarket name is required.' });
  }

  const id = generateId('sup_');
  try {
    const result = await db.query(
      `INSERT INTO supermarkets (id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at AS "createdAt"`,
      [id, name.trim()]
    );

    // Insert locations if provided
    const insertedLocations = [];
    if (Array.isArray(locations)) {
      for (const loc of locations) {
        if (!loc.name || !loc.name.trim()) continue;
        const locId = generateId('loc_');
        const locResult = await db.query(
          `INSERT INTO supermarket_locations (id, supermarket_id, name, county, town)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, county, town, created_at AS "createdAt"`,
          [locId, id, loc.name.trim(), loc.county?.trim() || null, loc.town?.trim() || null]
        );
        insertedLocations.push(locResult.rows[0]);
      }
    }

    return res.status(201).json({
      ...result.rows[0],
      productCount: 0,
      locations: insertedLocations
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: `A supermarket named "${name.trim()}" already exists.` });
    }
    console.error('addSupermarket error:', error);
    return res.status(500).json({ error: 'Failed to add supermarket.' });
  }
};

// PUT /api/admin/supermarkets/:id
exports.updateSupermarket = async (req, res) => {
  const { id } = req.params;
  const { name, locations } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Supermarket name is required.' });
  }

  try {
    const result = await db.query(
      `UPDATE supermarkets SET name = $1
       WHERE id = $2
       RETURNING id, name, created_at AS "createdAt"`,
      [name.trim(), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supermarket not found.' });
    }

    // Sync locations: delete removed ones, upsert existing/new ones
    if (Array.isArray(locations)) {
      // Get existing location IDs
      const existing = await db.query(
        'SELECT id FROM supermarket_locations WHERE supermarket_id = $1',
        [id]
      );
      const existingIds = new Set(existing.rows.map(r => r.id));
      const incomingIds = new Set(locations.filter(l => l.id).map(l => l.id));

      // Delete locations not in the incoming list
      for (const existingId of existingIds) {
        if (!incomingIds.has(existingId)) {
          await db.query('DELETE FROM supermarket_locations WHERE id = $1', [existingId]);
        }
      }

      // Upsert incoming locations
      for (const loc of locations) {
        if (!loc.name || !loc.name.trim()) continue;

        if (loc.id && existingIds.has(loc.id)) {
          // Update existing
          await db.query(
            `UPDATE supermarket_locations SET name = $1, county = $2, town = $3
             WHERE id = $4`,
            [loc.name.trim(), loc.county?.trim() || null, loc.town?.trim() || null, loc.id]
          );
        } else {
          // Insert new
          const locId = generateId('loc_');
          await db.query(
            `INSERT INTO supermarket_locations (id, supermarket_id, name, county, town)
             VALUES ($1, $2, $3, $4, $5)`,
            [locId, id, loc.name.trim(), loc.county?.trim() || null, loc.town?.trim() || null]
          );
        }
      }
    }

    // Fetch final locations
    const finalLocations = await getLocationsForSupermarket(id);

    return res.json({
      ...result.rows[0],
      locations: finalLocations
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: `A supermarket named "${name.trim()}" already exists.` });
    }
    console.error('updateSupermarket error:', error);
    return res.status(500).json({ error: 'Failed to update supermarket.' });
  }
};

// DELETE /api/admin/supermarkets/:id
exports.deleteSupermarket = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if supermarket has products
    const check = await db.query('SELECT COUNT(*) FROM products WHERE supermarket_id = $1', [id]);
    const count = parseInt(check.rows[0].count, 10);
    if (count > 0) {
      return res.status(400).json({
        error: `Cannot delete: ${count} product(s) are linked to this supermarket. Reassign or delete them first.`
      });
    }

    // Locations cascade-delete automatically via FK
    const result = await db.query('DELETE FROM supermarkets WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supermarket not found.' });
    }
    return res.json({ message: `Supermarket "${result.rows[0].name}" deleted successfully.`, id });
  } catch (error) {
    console.error('deleteSupermarket error:', error);
    return res.status(500).json({ error: 'Failed to delete supermarket.' });
  }
};
