const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

module.exports = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token format is Bearer <token>' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_budgettrack_key_2026');
    
    // Query database to verify is_admin status in real time
    const userRes = await db.query(
      'SELECT id, email, is_admin AS "isAdmin" FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    const user = userRes.rows[0];
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    req.user = { id: user.id, email: user.email, isAdmin: true };
    next();
  } catch (err) {
    console.error('adminAuth error:', err);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
