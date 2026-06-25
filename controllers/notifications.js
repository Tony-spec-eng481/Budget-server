const db = require('../db');

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      'SELECT id, title, body, type, is_read AS "isRead", created_at AS "createdAt" FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    // Format to match SQLite model (e.g. timestamp as number, isRead as boolean)
    const formatted = result.rows.map(n => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      timestamp: new Date(n.createdAt).getTime(),
      isRead: n.isRead
    }));
    return res.json(formatted);
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
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
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
