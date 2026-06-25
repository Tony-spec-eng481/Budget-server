-- Database Schema for BudgetTrack PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supermarket Product Catalog
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity VARCHAR(50) NOT NULL,
  price_naivas NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_carrefour NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_quickmart NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- Category-specific budgets
CREATE TABLE IF NOT EXISTS budgets (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  monthly_limit NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KES',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_category_budget UNIQUE (user_id, category)
);

-- Global budgets (daily, weekly, monthly targets)
CREATE TABLE IF NOT EXISTS global_budgets (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KES',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, period)
);

-- Shopping lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  shopping_date DATE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shopping list items
CREATE TABLE IF NOT EXISTS shopping_items (
  id VARCHAR(100) PRIMARY KEY,
  list_id VARCHAR(100) NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity VARCHAR(50),
  estimated_price NUMERIC(15, 2),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'budget', 'stock', 'shopping'
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_products_search ON products(name, category);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(100) PRIMARY KEY,
  list_id VARCHAR(100) NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supermarket VARCHAR(100) NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'paid'
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_list ON orders(list_id);
