const db = require('../db');

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Get all orders for the logged-in user
exports.getOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      'SELECT id, list_id AS "listId", supermarket, total_amount AS "totalAmount", payment_status AS "paymentStatus", payment_method AS "paymentMethod", created_at AS "createdAt", updated_at AS "updatedAt" FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('getOrders error:', error);
    return res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
};

// Create a new order
exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { listId, supermarket, totalAmount } = req.body;

  if (!listId || !supermarket || totalAmount === undefined) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const orderId = generateId();

  try {
    // Optional: check if list belongs to user
    const check = await db.query('SELECT id FROM shopping_lists WHERE id = $1 AND user_id = $2', [listId, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Shopping list not found.' });
    }

    const result = await db.query(
      `INSERT INTO orders (id, list_id, user_id, supermarket, total_amount, payment_status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, list_id AS "listId", supermarket, total_amount AS "totalAmount", payment_status AS "paymentStatus", created_at AS "createdAt"`,
      [orderId, listId, userId, supermarket, totalAmount]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ error: 'Failed to create order.' });
  }
};

// Pay an order
exports.payOrder = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { paymentMethod } = req.body;

  if (!paymentMethod) {
    return res.status(400).json({ error: 'Payment method is required.' });
  }

  try {
    const check = await db.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const result = await db.query(
      `UPDATE orders SET payment_status = 'paid', payment_method = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING id, list_id AS "listId", supermarket, total_amount AS "totalAmount", payment_status AS "paymentStatus", payment_method AS "paymentMethod", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [paymentMethod, id]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('payOrder error:', error);
    return res.status(500).json({ error: 'Failed to pay order.' });
  }
};
