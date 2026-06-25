const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');

// Controllers
const authController = require('./controllers/auth');
const stocksController = require('./controllers/stocks');
const supermarketsController = require('./controllers/supermarkets');
const budgetsController = require('./controllers/budgets');
const shoppingController = require('./controllers/shopping');
const ordersController = require('./controllers/orders');
const receiptsController = require('./controllers/receipts');
const notificationsController = require('./controllers/notifications');
const adminController = require('./controllers/admin');
const adminAuthMiddleware = require('./middleware/adminAuth');
const promotionsController = require('./controllers/promotions');
const globalSettingsController = require('./controllers/globalSettings');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes

// 1. Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// 2. Stock market routes
app.get('/api/stocks/quotes', stocksController.getQuotes);
app.get('/api/stocks/news', stocksController.getNews);

// 3. Supermarkets route
app.get('/api/supermarkets/products', supermarketsController.getProducts);

// 4. Budgets routes (Secured)
app.get('/api/budgets', authMiddleware, budgetsController.getBudgets);
app.post('/api/budgets', authMiddleware, budgetsController.setBudget);
app.get('/api/budgets/global', authMiddleware, budgetsController.getGlobalBudgets);
app.post('/api/budgets/global', authMiddleware, budgetsController.setGlobalBudget);

// 5. Shopping lists routes (Secured)
app.get('/api/shopping-lists', authMiddleware, shoppingController.getLists);
app.post('/api/shopping-lists', authMiddleware, shoppingController.createList);
app.put('/api/shopping-lists/:id', authMiddleware, shoppingController.updateList);
app.delete('/api/shopping-lists/:id', authMiddleware, shoppingController.deleteList);

// 6. Shopping list items routes (Secured)
app.get('/api/shopping-lists/:id/items', authMiddleware, shoppingController.getListItems);
app.post('/api/shopping-lists/:id/items', authMiddleware, shoppingController.addItem);
app.put('/api/shopping-lists/items/:itemId', authMiddleware, shoppingController.updateItem);
app.delete('/api/shopping-lists/items/:itemId', authMiddleware, shoppingController.deleteItem);

// 7. Orders routes (Secured)
app.get('/api/orders', authMiddleware, ordersController.getOrders);
app.post('/api/orders', authMiddleware, ordersController.createOrder);
app.post('/api/orders/:id/pay', authMiddleware, ordersController.payOrder);

// 8. Receipts routes (Secured)
app.get('/api/receipts', authMiddleware, receiptsController.getReceipts);

// 9. Notifications routes (Secured)
app.get('/api/notifications', authMiddleware, notificationsController.getNotifications);
app.post('/api/notifications', authMiddleware, notificationsController.addNotification);
app.put('/api/notifications/:id/read', authMiddleware, notificationsController.markRead);
app.put('/api/notifications/read-all', authMiddleware, notificationsController.markAllRead);
app.delete('/api/notifications/:id', authMiddleware, notificationsController.deleteNotification);
app.delete('/api/notifications', authMiddleware, notificationsController.clearAllNotifications);

// 9b. Promotions & Global Settings routes (Secured)
app.get('/api/promotions', authMiddleware, promotionsController.getActivePromotions);
app.get('/api/global-settings', globalSettingsController.getSettings);

// 10. Admin Portal routes
app.post('/api/admin/auth/login', adminController.adminLogin);
app.get('/api/admin/stats', adminAuthMiddleware, adminController.getStats);
app.get('/api/admin/users', adminAuthMiddleware, adminController.getUsers);
app.delete('/api/admin/users/:id', adminAuthMiddleware, adminController.deleteUser);

app.get('/api/admin/promotions', adminAuthMiddleware, promotionsController.getPromotions);
app.post('/api/admin/promotions', adminAuthMiddleware, promotionsController.addPromotion);
app.put('/api/admin/promotions/:id', adminAuthMiddleware, promotionsController.updatePromotion);
app.delete('/api/admin/promotions/:id', adminAuthMiddleware, promotionsController.deletePromotion);

app.get('/api/admin/global-settings', adminAuthMiddleware, globalSettingsController.getGlobalSettings);
app.put('/api/admin/global-settings', adminAuthMiddleware, globalSettingsController.updateGlobalSettings);

app.get('/api/admin/products', adminAuthMiddleware, adminController.getProducts);
app.post('/api/admin/products', adminAuthMiddleware, adminController.addProduct);
app.put('/api/admin/products/:id', adminAuthMiddleware, adminController.updateProduct);
app.delete('/api/admin/products/:id', adminAuthMiddleware, adminController.deleteProduct);

app.get('/api/admin/receipts', adminAuthMiddleware, adminController.getReceipts);
app.put('/api/admin/receipts/:id/status', adminAuthMiddleware, adminController.updateReceiptStatus);
app.delete('/api/admin/receipts/:id', adminAuthMiddleware, adminController.deleteReceipt);

app.get('/api/admin/stocks/quotes', adminAuthMiddleware, adminController.getStockQuotes);
app.post('/api/admin/stocks/quotes', adminAuthMiddleware, adminController.addStockQuote);
app.put('/api/admin/stocks/quotes/:symbol', adminAuthMiddleware, adminController.updateStockQuote);
app.delete('/api/admin/stocks/quotes/:symbol', adminAuthMiddleware, adminController.deleteStockQuote);

app.get('/api/admin/stocks/news', adminAuthMiddleware, adminController.getStockNews);
app.post('/api/admin/stocks/news', adminAuthMiddleware, adminController.addStockNews);
app.put('/api/admin/stocks/news/:id', adminAuthMiddleware, adminController.updateStockNews);
app.delete('/api/admin/stocks/news/:id', adminAuthMiddleware, adminController.deleteStockNews);
app.post('/api/admin/stocks/sync', adminAuthMiddleware, adminController.syncLiveStocks);

// Root path diagnostic route
app.get('/', (req, res) => {
  res.json({ message: 'BudgetTrack Backend Server is running successfully.' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
