const db = require('../db');

// 1. User/Public: Get global settings as a key-value object
exports.getSettings = async (req, res) => {
  try {
    const result = await db.query('SELECT key, value FROM global_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return res.json(settings);
  } catch (error) {
    console.error('getSettings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve global settings.' });
  }
};

// 2. Admin: Get all settings (identical, but can contain admin-specific info if added later)
exports.getGlobalSettings = async (req, res) => {
  try {
    const result = await db.query('SELECT key, value FROM global_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return res.json(settings);
  } catch (error) {
    console.error('getGlobalSettings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve global settings.' });
  }
};

// 3. Admin: Update global settings
exports.updateGlobalSettings = async (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings payload.' });
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        `INSERT INTO global_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key)
         DO UPDATE SET value = $2`,
        [key, String(value)]
      );
    }
    return res.json({ success: true, message: 'Global settings updated successfully.' });
  } catch (error) {
    console.error('updateGlobalSettings error:', error);
    return res.status(500).json({ error: 'Failed to update global settings.' });
  }
};
