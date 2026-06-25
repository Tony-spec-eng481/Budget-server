const db = require('../db');

// Helper to generate IDs
function generateId(prefix = 'promo_') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 1. User: Get active unread promotions
exports.getActivePromotions = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT p.id, p.title, p.body, p.image_url AS "imageUrl", p.created_at AS "createdAt"
       FROM promotions p
       LEFT JOIN read_promotions rp ON p.id = rp.promotion_id AND rp.user_id = $1
       WHERE rp.user_id IS NULL
       ORDER BY p.created_at DESC`,
      [userId]
    );
    
    // Format timestamp as number for mobile app compatibility
    const formatted = result.rows.map(p => ({
      id: p.id,
      title: p.title,
      body: p.body,
      imageUrl: p.imageUrl,
      timestamp: new Date(p.createdAt).getTime(),
      isRead: false
    }));
    
    return res.json(formatted);
  } catch (error) {
    console.error('getActivePromotions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve active promotions.' });
  }
};

// 2. Admin: Get all promotions
exports.getPromotions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, body, image_url AS "imageUrl", created_at AS "createdAt"
       FROM promotions
       ORDER BY created_at DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('getPromotions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve promotions.' });
  }
};

// 3. Admin: Add new promotion
exports.addPromotion = async (req, res) => {
  const { title, body, imageUrl } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  const id = generateId();
  try {
    await db.query(
      `INSERT INTO promotions (id, title, body, image_url)
       VALUES ($1, $2, $3, $4)`,
      [id, title, body, imageUrl || null]
    );
    return res.status(201).json({ success: true, message: 'Promotion created and broadcasted.', id });
  } catch (error) {
    console.error('addPromotion error:', error);
    return res.status(500).json({ error: 'Failed to create promotion.' });
  }
};

// 4. Admin: Update promotion
exports.updatePromotion = async (req, res) => {
  const { id } = req.params;
  const { title, body, imageUrl } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  try {
    const check = await db.query('SELECT id FROM promotions WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Promotion not found.' });
    }

    await db.query(
      `UPDATE promotions
       SET title = $1, body = $2, image_url = $3
       WHERE id = $4`,
      [title, body, imageUrl || null, id]
    );
    return res.json({ success: true, message: 'Promotion updated successfully.' });
  } catch (error) {
    console.error('updatePromotion error:', error);
    return res.status(500).json({ error: 'Failed to update promotion.' });
  }
};

// 5. Admin: Delete promotion
exports.deletePromotion = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await db.query('SELECT id FROM promotions WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Promotion not found.' });
    }

    await db.query('DELETE FROM promotions WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Promotion deleted successfully.' });
  } catch (error) {
    console.error('deletePromotion error:', error);
    return res.status(500).json({ error: 'Failed to delete promotion.' });
  }
};
