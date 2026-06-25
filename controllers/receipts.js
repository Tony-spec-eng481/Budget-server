const db = require('../db');

// Get all receipts for the logged-in user
exports.getReceipts = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT r.id, r.order_id AS "orderId", r.list_id AS "listId", r.company_name AS "companyName", 
              r.list_title AS "listTitle", r.items, r.total_amount AS "totalAmount", 
              r.payment_method AS "paymentMethod", r.created_at AS "createdAt",
              o.supermarket_location AS "supermarketLocation", o.pickup_name AS "pickupName", 
              o.pickup_phone AS "pickupPhone", o.pickup_time AS "pickupTime" 
       FROM receipts r
       LEFT JOIN orders o ON r.order_id = o.id
       WHERE r.user_id = $1 
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('getReceipts error:', error);
    return res.status(500).json({ error: 'Failed to retrieve receipts.' });
  }
};
