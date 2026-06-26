-- Database Schema for BudgetTrack PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supermarkets table (admin-managed)
CREATE TABLE IF NOT EXISTS supermarkets (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supermarket locations (multiple per supermarket)
CREATE TABLE IF NOT EXISTS supermarket_locations (
  id VARCHAR(100) PRIMARY KEY,
  supermarket_id VARCHAR(100) NOT NULL REFERENCES supermarkets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  county VARCHAR(100),
  town VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supermarket Product Catalog
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity VARCHAR(50) NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  supermarket_id VARCHAR(100) REFERENCES supermarkets(id) ON DELETE SET NULL
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
  supermarket_location VARCHAR(255),
  pickup_name VARCHAR(255),
  pickup_phone VARCHAR(50),
  pickup_time VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_list ON orders(list_id);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id VARCHAR(100) PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id VARCHAR(100) NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  company_name VARCHAR(100) NOT NULL DEFAULT 'BudgetTrack',
  list_title VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);

-- Stock quotes table
CREATE TABLE IF NOT EXISTS stock_quotes (
  symbol VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  change NUMERIC(15, 2) NOT NULL DEFAULT 0,
  change_percent NUMERIC(15, 2) NOT NULL DEFAULT 0,
  volume VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock news table
CREATE TABLE IF NOT EXISTS stock_news (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  source VARCHAR(100) NOT NULL,
  url TEXT,
  sentiment VARCHAR(50),
  sentiment_score NUMERIC(5, 2),
  banner_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Promotional Notifications
CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Read Promotions tracking
CREATE TABLE IF NOT EXISTS read_promotions (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  promotion_id VARCHAR(100) REFERENCES promotions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, promotion_id)
);

-- Global app settings
CREATE TABLE IF NOT EXISTS global_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL
);

-- =============================================================
-- MIGRATION SQL (run once on existing databases)
-- =============================================================
-- Run these statements if you are upgrading from the old schema
-- that had price_magunas instead of price + supermarket_id.
--
-- Step 1: Create the supermarkets table and a default entry
-- CREATE TABLE IF NOT EXISTS supermarkets (
--   id VARCHAR(100) PRIMARY KEY,
--   name VARCHAR(255) UNIQUE NOT NULL,
--   location VARCHAR(255),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );
-- INSERT INTO supermarkets (id, name, location)
--   VALUES ('sup_default', 'Default Supermarket', 'Kenya')
--   ON CONFLICT DO NOTHING;
--
-- Step 2: Add new columns to products
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS supermarket_id VARCHAR(100) REFERENCES supermarkets(id) ON DELETE SET NULL;
--
-- Step 3: Migrate price data from old column
-- UPDATE products SET price = price_magunas WHERE price = 0;
-- UPDATE products SET supermarket_id = 'sup_default';
--
-- Step 4: Drop old column (optional — only after verifying migration)
-- ALTER TABLE products DROP COLUMN IF EXISTS price_magunas;
-- =============================================================



