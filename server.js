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

// Root path diagnostic route
app.get('/', (req, res) => {
  res.json({ message: 'BudgetTrack Backend Server is running successfully.' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
