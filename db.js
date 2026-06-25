const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('supabase.com'))
    ? { rejectUnauthorized: false }
    : false
});

// Seed data from SupermarketService
const INITIAL_PRODUCTS = [
  { id: 'milk_tuzo_500', name: 'Tuzo Milk', category: 'Milk', quantity: '500ml', price: 60 },
  { id: 'milk_mt_kenya_500', name: 'Mount Kenya Milk', category: 'Milk', quantity: '500ml', price: 58 },
  { id: 'milk_brookside_500', name: 'Brookside Milk', category: 'Milk', quantity: '500ml', price: 65 },
  { id: 'milk_ilara_500', name: 'Ilara Milk', category: 'Milk', quantity: '500ml', price: 59 },
  { id: 'milk_kcc_500', name: 'KCC Fresh Milk', category: 'Milk', quantity: '500ml', price: 58 },
  { id: 'milk_tuzo_1l', name: 'Tuzo Milk', category: 'Milk', quantity: '1L', price: 118 },
  { id: 'milk_brookside_1l', name: 'Brookside Milk', category: 'Milk', quantity: '1L', price: 125 },
  { id: 'dairy_brookside_yogurt_500', name: 'Brookside Yogurt', category: 'Yogurt', quantity: '500ml', price: 110 },
  { id: 'sugar_kabras_1k', name: 'Kabras Sugar', category: 'Sugar', quantity: '1kg', price: 145 },
  { id: 'sugar_kabras_2k', name: 'Kabras Sugar', category: 'Sugar', quantity: '2kg', price: 285 },
  { id: 'sugar_local_1k', name: 'Local Label Sugar', category: 'Sugar', quantity: '1kg', price: 135 },
  { id: 'bread_broadways_400', name: 'Broadways Bread', category: 'Bread', quantity: '400g', price: 65 },
  { id: 'bread_festive_400', name: 'Festive Bread', category: 'Bread', quantity: '400g', price: 65 },
  { id: 'bread_supaloaf_400', name: 'Supa Loaf Bread', category: 'Bread', quantity: '400g', price: 65 },
  { id: 'bread_broadways_800', name: 'Broadways Bread', category: 'Bread', quantity: '800g', price: 130 },
  { id: 'bread_festive_800', name: 'Festive Bread', category: 'Bread', quantity: '800g', price: 130 },
  { id: 'flour_jogoo_2k', name: 'Jogoo Maize Meal', category: 'Maize Flour', quantity: '2kg', price: 130 },
  { id: 'flour_pembe_maize_2k', name: 'Pembe Maize Meal', category: 'Maize Flour', quantity: '2kg', price: 128 },
  { id: 'flour_soko_2k', name: 'Soko Maize Meal', category: 'Maize Flour', quantity: '2kg', price: 125 },
  { id: 'flour_hostess_2k', name: 'Hostess Maize Meal', category: 'Maize Flour', quantity: '2kg', price: 175 },
  { id: 'flour_ajab_wheat_2k', name: 'Ajab Wheat Flour', category: 'Wheat Flour', quantity: '2kg', price: 165 },
  { id: 'flour_exe_wheat_2k', name: 'EXE Wheat Flour', category: 'Wheat Flour', quantity: '2kg', price: 175 },
  { id: 'flour_pembe_wheat_2k', name: 'Pembe Wheat Flour', category: 'Wheat Flour', quantity: '2kg', price: 160 },
  { id: 'oil_goldenfry_1l', name: 'Golden Fry Cooking Oil', category: 'Cooking Oil', quantity: '1L', price: 240 },
  { id: 'oil_goldenfry_2l', name: 'Golden Fry Cooking Oil', category: 'Cooking Oil', quantity: '2L', price: 460 },
  { id: 'oil_freshfri_1l', name: 'Fresh Fri Cooking Oil', category: 'Cooking Oil', quantity: '1L', price: 250 },
  { id: 'oil_freshfri_2l', name: 'Fresh Fri Cooking Oil', category: 'Cooking Oil', quantity: '2L', price: 480 },
  { id: 'oil_rina_1l', name: 'Rina Cooking Oil', category: 'Cooking Oil', quantity: '1L', price: 235 },
  { id: 'oil_rina_2l', name: 'Rina Cooking Oil', category: 'Cooking Oil', quantity: '2L', price: 450 },
  { id: 'oil_goldenfry_5l', name: 'Golden Fry Cooking Oil', category: 'Cooking Oil', quantity: '5L', price: 1100 },
  { id: 'eggs_6', name: 'Fresh Eggs Pack of 6', category: 'Eggs', quantity: '6 pack', price: 100 },
  { id: 'eggs_15', name: 'Fresh Eggs Pack of 15', category: 'Eggs', quantity: '15 pack', price: 240 },
  { id: 'eggs_30', name: 'Fresh Eggs Tray of 30', category: 'Eggs', quantity: '30 tray', price: 450 },
  { id: 'rice_daawat_2k', name: 'Daawat Basmati Rice', category: 'Rice', quantity: '2kg', price: 380 },
  { id: 'rice_pearl_2k', name: 'Pearl Pishori Rice', category: 'Rice', quantity: '2kg', price: 420 },
  { id: 'rice_sindano_2k', name: 'Sindano Rice', category: 'Rice', quantity: '2kg', price: 220 },
  { id: 'soap_sunlight_1k', name: 'Sunlight Washing Powder', category: 'Detergent', quantity: '1kg', price: 290 },
  { id: 'soap_ariel_1k', name: 'Ariel Washing Powder', category: 'Detergent', quantity: '1kg', price: 340 },
  { id: 'soap_omo_1k', name: 'Omo Washing Powder', category: 'Detergent', quantity: '1kg', price: 320 },
  { id: 'soap_geisha_225', name: 'Geisha Soap', category: 'Bath Soap', quantity: '225g', price: 120 },
  { id: 'soap_menengai_800', name: 'Menengai Bar Soap', category: 'Laundry Soap', quantity: '800g', price: 140 },
  { id: 'tea_ketepa_100s', name: 'Ketepa Tea Bags', category: 'Tea', quantity: '100 bags', price: 210 },
  { id: 'tea_safari_250', name: 'Safari Pure Tea', category: 'Tea', quantity: '250g', price: 180 },
  { id: 'coffee_nescafe_100', name: 'Nescafe Classic', category: 'Coffee', quantity: '100g', price: 380 },
  { id: 'tissue_hanan_4', name: 'Hanan Toilet Paper', category: 'Tissue', quantity: '4 pack', price: 180 },
  { id: 'tissue_velvex_4', name: 'Velvex Toilet Paper', category: 'Tissue', quantity: '4 pack', price: 220 },
  { id: 'tissue_toilex_4', name: 'Toilex Toilet Paper', category: 'Tissue', quantity: '4 pack', price: 140 },
  { id: 'salt_kensalt_1k', name: 'Kensalt Salt', category: 'Salt', quantity: '1kg', price: 35 },
  { id: 'blueband_250', name: 'Blue Band Margarine', category: 'Margarine', quantity: '250g', price: 145 },
  { id: 'blueband_500', name: 'Blue Band Margarine', category: 'Margarine', quantity: '500g', price: 275 },
  { id: 'spaghetti_santa_500', name: 'Santa Maria Spaghetti', category: 'Pasta', quantity: '500g', price: 80 },
  { id: 'drink_delmonte_1l', name: 'Del Monte Juice', category: 'Juice', quantity: '1L', price: 280 },
  { id: 'drink_keringet_1l', name: 'Keringet Mineral Water', category: 'Water', quantity: '1L', price: 75 },
  { id: 'drink_cocacola_2l', name: 'Coca-Cola Soda', category: 'Soda', quantity: '2L', price: 180 }
];

async function seedDatabase() {
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Applying schema from schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log('Schema applied successfully.');
    }

    // Run schema migrations
    console.log('Running database migrations...');
    await pool.query('ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS shopping_date DATE;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;');
    await pool.query('ALTER TABLE receipts ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT \'pending\';');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);');
    
    // Create receipts table
    await pool.query(`
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
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);');

    // Create stock tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_quotes (
        symbol VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(15, 2) NOT NULL DEFAULT 0,
        change NUMERIC(15, 2) NOT NULL DEFAULT 0,
        change_percent NUMERIC(15, 2) NOT NULL DEFAULT 0,
        volume VARCHAR(50),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
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
    `);

    // Add supermarket_location and pickup details columns to orders table
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS supermarket_location VARCHAR(255);');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_name VARCHAR(255);');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_phone VARCHAR(50);');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(50);');

    console.log('PostgreSQL migrations completed.');

    // Seed admin user
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@budgettrack.com'");
    if (adminCheck.rows.length === 0) {
      console.log('Seeding default administrator...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('AdminPass2026!', 10);
      await pool.query(
        "INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, TRUE)",
        ['admin@budgettrack.com', hashedPassword]
      );
      console.log('Default administrator account created successfully.');
    }

    // Seed stock quotes if empty
    const quotesCheck = await pool.query('SELECT COUNT(*) FROM stock_quotes');
    if (parseInt(quotesCheck.rows[0].count, 10) === 0) {
      console.log('Seeding default stock quotes...');
      const defaultQuotes = [
        { symbol: 'SCOM', name: 'Safaricom PLC', price: 15.65, change: 0.15, changePercent: 0.97, volume: '15.4M' },
        { symbol: 'EQTY', name: 'Equity Group Holdings Plc', price: 38.25, change: -0.50, changePercent: -1.29, volume: '2.1M' },
        { symbol: 'KCB', name: 'KCB Group PLC', price: 29.80, change: 0.40, changePercent: 1.36, volume: '1.8M' },
        { symbol: 'COOP', name: 'Co-operative Bank of Kenya', price: 12.50, change: 0.05, changePercent: 0.40, volume: '3.5M' },
        { symbol: 'EABL', name: 'East African Breweries Plc', price: 110.00, change: -1.25, changePercent: -1.12, volume: '120K' },
        { symbol: 'BAT', name: 'British American Tobacco Kenya', price: 519.00, change: 1.00, changePercent: 0.19, volume: '14.1K' },
        { symbol: 'ABSA', name: 'Absa Bank Kenya Plc', price: 30.75, change: 1.35, changePercent: 4.59, volume: '3.5M' },
        { symbol: 'KPLC', name: 'Kenya Power & Lighting Co.', price: 1.85, change: 0.02, changePercent: 1.09, volume: '5.2M' },
        { symbol: 'KEGN', name: 'KenGen Plc', price: 2.30, change: 0.04, changePercent: 1.77, volume: '4.1M' },
        { symbol: 'SCAN', name: 'ScanGroup Limited', price: 2.86, change: -0.03, changePercent: -1.04, volume: '153.6K' }
      ];
      for (const q of defaultQuotes) {
        await pool.query(
          `INSERT INTO stock_quotes (symbol, name, price, change, change_percent, volume)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [q.symbol, q.name, q.price, q.change, q.changePercent, q.volume]
        );
      }
      console.log('Seeded stock quotes.');
    }

    // Seed stock news if empty
    const newsCheck = await pool.query('SELECT COUNT(*) FROM stock_news');
    if (parseInt(newsCheck.rows[0].count, 10) === 0) {
      console.log('Seeding default stock news...');
      const defaultNews = [
        {
          id: 'fn_1',
          title: 'Safaricom Volume Extends Surge on Market Entry',
          date: 'Jun 20, 2026 12:45 GMT',
          summary: 'SCOM led transactions on the Nairobi Securities Exchange as institutional interest rallied around defensive blue chips.',
          source: 'NSE Forum',
          url: 'https://afx.kwayisi.org/nse/',
          sentiment: 'Bullish',
          sentimentScore: 0.35,
          banner_image: null
        },
        {
          id: 'fn_2',
          title: 'Patrick shared a market perspective',
          date: 'Jan 22, 2026 10:56 GMT',
          summary: 'KNRE is on a Massive Sale, KNRE shares trade at roughly KES 3.19, but the actual value of the assets backing each share (Book Value) is likely over KES 15.00. You are essentially buying a KES 1000 note for KES 200. It is deeply undervalued.',
          source: 'NSE Forum',
          url: 'https://afx.kwayisi.org/nse/',
          sentiment: 'Bullish',
          sentimentScore: 0.45,
          banner_image: null
        }
      ];
      for (const n of defaultNews) {
        await pool.query(
          `INSERT INTO stock_news (id, title, date, summary, source, url, sentiment, sentiment_score, banner_image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [n.id, n.title, n.date, n.summary, n.source, n.url, n.sentiment, n.sentimentScore, n.banner_image]
        );
      }
      console.log('Seeded stock news.');
    }

    const res = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(res.rows[0].count, 10) === 0) {
      console.log('Seeding initial products into database...');
      for (const p of INITIAL_PRODUCTS) {
        await pool.query(
          `INSERT INTO products (id, name, category, quantity, price_magunas)
           VALUES ($1, $2, $3, $4, $5)`,
          [p.id, p.name, p.category, p.quantity, p.price]
        );
      }
      console.log('Successfully seeded database with supermarket products.');
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}

// Automatically seed on export initialization
seedDatabase();

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
