const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const stocksController = require('./stocks');

// Helper to generate IDs
function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 1. Admin Login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    if (!user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate Admin JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: true },
      process.env.JWT_SECRET || 'super_secret_budgettrack_key_2026',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Admin login successful',
      token,
      user: { id: user.id, email: user.email, isAdmin: true }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal server error during admin login.' });
  }
};

// 2. Dashboard Statistics
exports.getStats = async (req, res) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const listsCount = await db.query('SELECT COUNT(*) FROM shopping_lists');
    const productsCount = await db.query('SELECT COUNT(*) FROM products');
    const receiptsCount = await db.query('SELECT COUNT(*) FROM receipts');
    const stocksCount = await db.query('SELECT COUNT(*) FROM stock_quotes');
    const salesSum = await db.query('SELECT SUM(total_amount) AS total FROM receipts');
    
    // Recent 5 receipts for activity feed
    const recentActivity = await db.query(
      `SELECT r.id, r.list_title AS "title", r.total_amount AS "amount", 
              r.created_at AS "createdAt", u.email AS "userEmail", r.status
       FROM receipts r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY r.created_at DESC LIMIT 5`
    );

    return res.json({
      usersCount: parseInt(usersCount.rows[0].count, 10),
      listsCount: parseInt(listsCount.rows[0].count, 10),
      productsCount: parseInt(productsCount.rows[0].count, 10),
      receiptsCount: parseInt(receiptsCount.rows[0].count, 10),
      stocksCount: parseInt(stocksCount.rows[0].count, 10),
      totalSales: parseFloat(salesSum.rows[0].total || 0),
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('getStats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
};

// 3. Users Management
exports.getUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, is_admin AS "isAdmin", created_at AS "createdAt",
              (SELECT COUNT(*) FROM shopping_lists WHERE user_id = users.id) AS "listsCount",
              (SELECT COUNT(*) FROM budgets WHERE user_id = users.id) AS "budgetsCount"
       FROM users
       ORDER BY created_at DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  if (parseInt(id, 10) === parseInt(adminId, 10)) {
    return res.status(400).json({ error: 'Cannot delete your own active administrator account.' });
  }

  try {
    // Check if user exists
    const check = await db.query('SELECT is_admin FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Do not delete other admins via standard user list
    if (check.rows[0].is_admin) {
      return res.status(403).json({ error: 'Cannot delete another administrator account.' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    return res.json({ message: 'User account and all associated data deleted successfully.' });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
};

// 4. Products Catalog Management
exports.getProducts = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, category, quantity, price_magunas AS "price" FROM products ORDER BY name ASC'
    );
    const formatted = result.rows.map(p => ({ ...p, price: parseFloat(p.price) }));
    return res.json(formatted);
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ error: 'Failed to retrieve products.' });
  }
};

exports.addProduct = async (req, res) => {
  const { name, category, quantity, price } = req.body;
  if (!name || !category || !quantity || price === undefined) {
    return res.status(400).json({ error: 'Missing required product fields.' });
  }

  const id = 'prod_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Math.random().toString(36).substr(2, 4);

  try {
    const result = await db.query(
      `INSERT INTO products (id, name, category, quantity, price_magunas)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, category, quantity, price_magunas AS "price"`,
      [id, name, category, quantity, price]
    );
    const p = result.rows[0];
    return res.status(201).json({ ...p, price: parseFloat(p.price) });
  } catch (error) {
    console.error('addProduct error:', error);
    return res.status(500).json({ error: 'Failed to add product to catalog.' });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, price } = req.body;

  if (!name || !category || !quantity || price === undefined) {
    return res.status(400).json({ error: 'Missing required product fields.' });
  }

  try {
    const result = await db.query(
      `UPDATE products 
       SET name = $1, category = $2, quantity = $3, price_magunas = $4
       WHERE id = $5
       RETURNING id, name, category, quantity, price_magunas AS "price"`,
      [name, category, quantity, price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const p = result.rows[0];
    return res.json({ ...p, price: parseFloat(p.price) });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json({ message: 'Product deleted from catalog successfully.', id });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
};

// 5. Receipts & Orders Management
exports.getReceipts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.id, r.order_id AS "orderId", r.user_id AS "userId", u.email AS "userEmail", 
              r.list_id AS "listId", r.company_name AS "companyName", r.list_title AS "listTitle", 
              r.items, r.total_amount AS "totalAmount", r.payment_method AS "paymentMethod", 
              r.status, r.created_at AS "createdAt",
              o.supermarket_location AS "supermarketLocation", o.pickup_name AS "pickupName", 
              o.pickup_phone AS "pickupPhone", o.pickup_time AS "pickupTime" 
       FROM receipts r 
       JOIN users u ON r.user_id = u.id 
       LEFT JOIN orders o ON r.order_id = o.id 
       ORDER BY r.created_at DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('getReceipts error:', error);
    return res.status(500).json({ error: 'Failed to retrieve receipts.' });
  }
};

exports.updateReceiptStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'pending' or 'picked'

  if (!status || (status !== 'pending' && status !== 'picked')) {
    return res.status(400).json({ error: 'Invalid status. Must be pending or picked.' });
  }

  try {
    const result = await db.query(
      `UPDATE receipts SET status = $1 WHERE id = $2 RETURNING id, status, user_id AS "userId", order_id AS "orderId", list_title AS "listTitle"`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found.' });
    }

    const updatedReceipt = result.rows[0];

    // If there is an associated order, also synchronize the pickup details
    if (updatedReceipt.orderId) {
      // We can update a tracking status in orders if needed, or update order_status
      // For now, syncing is done by keeping receipts status updated, which is queried by admin.
    }

    // Send a notification if the receipt status is updated to 'picked'
    if (status === 'picked') {
      const notifId = 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const title = 'Order Picked';
      const body = `Your order for "${updatedReceipt.listTitle}" has been picked. Thank you for shopping with us! Please continue shopping with us.`;
      try {
        await db.query(
          `INSERT INTO notifications (id, user_id, title, body, type, is_read, created_at)
           VALUES ($1, $2, $3, $4, 'shopping', FALSE, CURRENT_TIMESTAMP)`,
          [notifId, updatedReceipt.userId, title, body]
        );
      } catch (notifErr) {
        console.error('Failed to insert picked notification:', notifErr);
      }
    }

    return res.json(updatedReceipt);
  } catch (error) {
    console.error('updateReceiptStatus error:', error);
    return res.status(500).json({ error: 'Failed to update receipt status.' });
  }
};

exports.deleteReceipt = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM receipts WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found.' });
    }
    return res.json({ message: 'Receipt deleted successfully.', id });
  } catch (error) {
    console.error('deleteReceipt error:', error);
    return res.status(500).json({ error: 'Failed to delete receipt.' });
  }
};

// 6. Stock Quotes Management
exports.getStockQuotes = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT symbol, name, price, change, change_percent AS "changePercent", volume, updated_at AS "updatedAt" FROM stock_quotes ORDER BY symbol ASC'
    );
    const formatted = result.rows.map(q => ({
      symbol: q.symbol,
      name: q.name,
      price: parseFloat(q.price),
      change: parseFloat(q.change),
      changePercent: parseFloat(q.changePercent),
      volume: q.volume,
      updatedAt: q.updatedAt
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('getStockQuotes error:', error);
    return res.status(500).json({ error: 'Failed to retrieve stock quotes.' });
  }
};

exports.addStockQuote = async (req, res) => {
  const { symbol, name, price, change, changePercent, volume } = req.body;
  if (!symbol || !name || price === undefined || change === undefined || changePercent === undefined) {
    return res.status(400).json({ error: 'Missing required stock quote fields.' });
  }

  const upperSymbol = symbol.toUpperCase().trim();

  try {
    const check = await db.query('SELECT symbol FROM stock_quotes WHERE symbol = $1', [upperSymbol]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: `Stock quote with symbol ${upperSymbol} already exists.` });
    }

    const result = await db.query(
      `INSERT INTO stock_quotes (symbol, name, price, change, change_percent, volume)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING symbol, name, price, change, change_percent AS "changePercent", volume`,
      [upperSymbol, name, price, change, changePercent, volume || '0']
    );
    const q = result.rows[0];
    return res.status(201).json({
      symbol: q.symbol,
      name: q.name,
      price: parseFloat(q.price),
      change: parseFloat(q.change),
      changePercent: parseFloat(q.changePercent),
      volume: q.volume
    });
  } catch (error) {
    console.error('addStockQuote error:', error);
    return res.status(500).json({ error: 'Failed to add stock quote.' });
  }
};

exports.updateStockQuote = async (req, res) => {
  const { symbol } = req.params;
  const { name, price, change, changePercent, volume } = req.body;

  if (!name || price === undefined || change === undefined || changePercent === undefined) {
    return res.status(400).json({ error: 'Missing required stock quote fields.' });
  }

  const upperSymbol = symbol.toUpperCase().trim();

  try {
    const result = await db.query(
      `UPDATE stock_quotes 
       SET name = $1, price = $2, change = $3, change_percent = $4, volume = $5, updated_at = CURRENT_TIMESTAMP
       WHERE symbol = $6
       RETURNING symbol, name, price, change, change_percent AS "changePercent", volume`,
      [name, price, change, changePercent, volume, upperSymbol]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock quote not found.' });
    }

    const q = result.rows[0];
    return res.json({
      symbol: q.symbol,
      name: q.name,
      price: parseFloat(q.price),
      change: parseFloat(q.change),
      changePercent: parseFloat(q.changePercent),
      volume: q.volume
    });
  } catch (error) {
    console.error('updateStockQuote error:', error);
    return res.status(500).json({ error: 'Failed to update stock quote.' });
  }
};

exports.deleteStockQuote = async (req, res) => {
  const { symbol } = req.params;
  const upperSymbol = symbol.toUpperCase().trim();
  try {
    const result = await db.query('DELETE FROM stock_quotes WHERE symbol = $1 RETURNING symbol', [upperSymbol]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock quote not found.' });
    }
    return res.json({ message: 'Stock quote deleted successfully.', symbol: upperSymbol });
  } catch (error) {
    console.error('deleteStockQuote error:', error);
    return res.status(500).json({ error: 'Failed to delete stock quote.' });
  }
};

// 7. Stock News/Discussions Management
exports.getStockNews = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, title, date, summary, source, url, sentiment, sentiment_score AS "sentimentScore", banner_image AS "bannerImage", created_at AS "createdAt" FROM stock_news ORDER BY created_at DESC'
    );
    const formatted = result.rows.map(n => ({
      ...n,
      sentimentScore: parseFloat(n.sentimentScore || 0)
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('getStockNews error:', error);
    return res.status(500).json({ error: 'Failed to retrieve stock news.' });
  }
};

exports.addStockNews = async (req, res) => {
  const { title, date, summary, source, url, sentiment, sentimentScore, bannerImage } = req.body;
  if (!title || !summary || !source) {
    return res.status(400).json({ error: 'Missing required news fields (title, summary, source).' });
  }

  const id = generateId('news_');
  const formattedDate = date || new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' GMT';

  try {
    const result = await db.query(
      `INSERT INTO stock_news (id, title, date, summary, source, url, sentiment, sentiment_score, banner_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, date, summary, source, url, sentiment, sentiment_score AS "sentimentScore", banner_image AS "bannerImage"`,
      [id, title, formattedDate, summary, source, url || null, sentiment || 'Neutral', sentimentScore || 0, bannerImage || null]
    );
    const n = result.rows[0];
    return res.status(201).json({
      ...n,
      sentimentScore: parseFloat(n.sentimentScore || 0)
    });
  } catch (error) {
    console.error('addStockNews error:', error);
    return res.status(500).json({ error: 'Failed to create stock news.' });
  }
};

exports.updateStockNews = async (req, res) => {
  const { id } = req.params;
  const { title, date, summary, source, url, sentiment, sentimentScore, bannerImage } = req.body;

  if (!title || !summary || !source) {
    return res.status(400).json({ error: 'Missing required news fields (title, summary, source).' });
  }

  try {
    const result = await db.query(
      `UPDATE stock_news 
       SET title = $1, date = $2, summary = $3, source = $4, url = $5, 
           sentiment = $6, sentiment_score = $7, banner_image = $8
       WHERE id = $9
       RETURNING id, title, date, summary, source, url, sentiment, sentiment_score AS "sentimentScore", banner_image AS "bannerImage"`,
      [title, date, summary, source, url, sentiment, sentimentScore, bannerImage, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock news item not found.' });
    }

    const n = result.rows[0];
    return res.json({
      ...n,
      sentimentScore: parseFloat(n.sentimentScore || 0)
    });
  } catch (error) {
    console.error('updateStockNews error:', error);
    return res.status(500).json({ error: 'Failed to update stock news.' });
  }
};

exports.deleteStockNews = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM stock_news WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock news item not found.' });
    }
    return res.json({ message: 'Stock news item deleted successfully.', id });
  } catch (error) {
    console.error('deleteStockNews error:', error);
    return res.status(500).json({ error: 'Failed to delete stock news.' });
  }
};

// 8. Manual Stock Sync
exports.syncLiveStocks = async (req, res) => {
  try {
    console.log('Admin triggered manual stock sync from NSE...');
    
    // Scrape live quotes and discussions using centralized helpers
    const liveQuotes = await stocksController.scrapeQuotes();
    const liveNews = await stocksController.scrapeNews();
    
    // Upsert quotes into database
    for (const q of liveQuotes) {
      await db.query(
        `INSERT INTO stock_quotes (symbol, name, price, change, change_percent, volume)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (symbol) 
         DO UPDATE SET 
           name = EXCLUDED.name, 
           price = EXCLUDED.price, 
           change = EXCLUDED.change, 
           change_percent = EXCLUDED.change_percent, 
           volume = EXCLUDED.volume, 
           updated_at = CURRENT_TIMESTAMP`,
        [q.symbol, q.name, q.price, q.change, q.changePercent, q.volume]
      );
    }
    
    // Upsert news discussions into database
    for (const n of liveNews) {
      await db.query(
        `INSERT INTO stock_news (id, title, date, summary, source, url, sentiment, sentiment_score, banner_image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) 
         DO UPDATE SET 
           title = EXCLUDED.title, 
           date = EXCLUDED.date, 
           summary = EXCLUDED.summary, 
           source = EXCLUDED.source, 
           url = EXCLUDED.url, 
           sentiment = EXCLUDED.sentiment, 
           sentiment_score = EXCLUDED.sentiment_score, 
           banner_image = EXCLUDED.banner_image`,
        [
          n.id, 
          n.title, 
          n.date, 
          n.summary, 
          n.source, 
          n.url || null, 
          n.sentiment || 'Neutral', 
          n.sentimentScore || 0, 
          n.banner_image || null
        ]
      );
    }
    
    // Retrieve freshly updated data from database to return to client
    const dbQuotes = await db.query(
      'SELECT symbol, name, price, change, change_percent AS "changePercent", volume, updated_at AS "updatedAt" FROM stock_quotes ORDER BY symbol ASC'
    );
    
    const dbNews = await db.query(
      'SELECT id, title, date, summary, source, url, sentiment, sentiment_score AS "sentimentScore", banner_image AS "bannerImage" FROM stock_news ORDER BY created_at DESC'
    );
    
    // Format database string decimals to floats
    const formattedQuotes = dbQuotes.rows.map(q => ({
      symbol: q.symbol,
      name: q.name,
      price: parseFloat(q.price),
      change: parseFloat(q.change),
      changePercent: parseFloat(q.changePercent),
      volume: q.volume,
      updatedAt: q.updatedAt
    }));
    
    const formattedNews = dbNews.rows.map(item => ({
      ...item,
      sentimentScore: parseFloat(item.sentimentScore || 0)
    }));
    
    return res.json({
      message: 'Successfully synced live stocks and discussions from NSE.',
      quotes: formattedQuotes,
      news: formattedNews
    });
  } catch (error) {
    console.error('syncLiveStocks error:', error);
    return res.status(500).json({ error: 'Failed to synchronize live stock data from NSE.' });
  }
};
