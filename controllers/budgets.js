const db = require('../db');

// Category Budgets
exports.getBudgets = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      'SELECT id, category, monthly_limit AS "monthlyLimit", currency, created_at AS "createdAt" FROM budgets WHERE user_id = $1 ORDER BY category',
      [userId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('getBudgets error:', error);
    return res.status(500).json({ error: 'Failed to retrieve budgets.' });
  }
};

exports.setBudget = async (req, res) => {
  const userId = req.user.id;
  const { id, category, monthlyLimit, currency } = req.body;

  if (!category || monthlyLimit === undefined) {
    return res.status(400).json({ error: 'Category and monthlyLimit are required.' });
  }

  const budgetId = id || (Date.now().toString(36) + Math.random().toString(36).substr(2, 9));
  const finalCurrency = currency || 'KES';

  try {
    await db.query(
      `INSERT INTO budgets (id, user_id, category, monthly_limit, currency, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, category) DO UPDATE
       SET monthly_limit = EXCLUDED.monthly_limit, currency = EXCLUDED.currency, updated_at = CURRENT_TIMESTAMP`,
      [budgetId, userId, category, monthlyLimit, finalCurrency]
    );
    return res.json({ success: true, message: 'Budget set successfully.' });
  } catch (error) {
    console.error('setBudget error:', error);
    return res.status(500).json({ error: 'Failed to set budget.' });
  }
};

// Global Budgets
exports.getGlobalBudgets = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      'SELECT period, amount, currency, updated_at AS "updatedAt" FROM global_budgets WHERE user_id = $1',
      [userId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('getGlobalBudgets error:', error);
    return res.status(500).json({ error: 'Failed to retrieve global budgets.' });
  }
};

exports.setGlobalBudget = async (req, res) => {
  const userId = req.user.id;
  const { period, amount, currency } = req.body;

  if (!period || amount === undefined) {
    return res.status(400).json({ error: 'Period and amount are required.' });
  }

  const finalCurrency = currency || 'KES';

  try {
    await db.query(
      `INSERT INTO global_budgets (user_id, period, amount, currency, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, period) DO UPDATE
       SET amount = EXCLUDED.amount, currency = EXCLUDED.currency, updated_at = CURRENT_TIMESTAMP`,
      [userId, period, amount, finalCurrency]
    );
    return res.json({ success: true, message: 'Global budget set successfully.' });
  } catch (error) {
    console.error('setGlobalBudget error:', error);
    return res.status(500).json({ error: 'Failed to set global budget.' });
  }
};
