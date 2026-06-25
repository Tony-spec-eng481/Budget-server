const db = require('../db');

// Get all notifications for the logged-in user, including global promotions!
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    // 1. Fetch user-specific notifications
    const userResult = await db.query(
      'SELECT id, title, body, type, is_read AS "isRead", created_at AS "createdAt" FROM notifications WHERE user_id = $1',
      [userId]
    );
    
    // 2. Fetch all global promotions and left join read_promotions to check if this user has read them
    const promoResult = await db.query(
      `SELECT p.id, p.title, p.body, p.created_at AS "createdAt",
              CASE WHEN rp.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS "isRead"
       FROM promotions p
       LEFT JOIN read_promotions rp ON p.id = rp.promotion_id AND rp.user_id = $1`,
      [userId]
    );

    // Format and combine
    const formattedUserNotifs = userResult.rows.map(n => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      timestamp: new Date(n.createdAt).getTime(),
      isRead: n.isRead
    }));

    const formattedPromos = promoResult.rows.map(p => ({
      id: p.id,
      title: p.title,
      body: p.body,
      type: 'promotional',
      timestamp: new Date(p.createdAt).getTime(),
      isRead: p.isRead
    }));

    const combined = [...formattedUserNotifs, ...formattedPromos].sort((a, b) => b.timestamp - a.timestamp);
    return res.json(combined);
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
};

// Add a notification (typically called when syncing offline/local notifications)
exports.addNotification = async (req, res) => {
  const userId = req.user.id;
  const { id, title, body, type } = req.body;
  if (!title || !body || !type) {
    return res.status(400).json({ error: 'Title, body and type are required.' });
  }
  const notifId = id || ('notif_' + Math.random().toString(36).substr(2, 9));
  try {
    await db.query(
      `INSERT INTO notifications (id, user_id, title, body, type, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO NOTHING`,
      [notifId, userId, title, body, type]
    );
    return res.status(201).json({ success: true, id: notifId });
  } catch (error) {
    console.error('addNotification error:', error);
    return res.status(500).json({ error: 'Failed to save notification.' });
  }
};

// Mark a specific notification as read
exports.markRead = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    if (id.startsWith('promo_')) {
      // It's a global promotion. Insert a read tracking record for this user.
      await db.query(
        `INSERT INTO read_promotions (user_id, promotion_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, id]
      );
    } else {
      // It's a standard user notification.
      await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('markRead error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
};

// Mark all notifications as read
exports.markAllRead = async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('markAllRead error:', error);
    return res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
};

// Delete a specific notification
exports.deleteNotification = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return res.status(500).json({ error: 'Failed to delete notification.' });
  }
};

// Delete all notifications for the user
exports.clearAllNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('clearAllNotifications error:', error);
    return res.status(500).json({ error: 'Failed to clear notifications.' });
  }
};
