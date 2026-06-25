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
  { id: 'milk_tuzo_500', name: 'Tuzo Milk', category: 'Milk', quantity: '500ml', prices: { Naivas: 60, Carrefour: 65, Quickmart: 62 } },
  { id: 'milk_mt_kenya_500', name: 'Mount Kenya Milk', category: 'Milk', quantity: '500ml', prices: { Naivas: 58, Carrefour: 60, Quickmart: 59 } },
  { id: 'milk_brookside_500', name: 'Brookside Milk', category: 'Milk', quantity: '500ml', prices: { Naivas: 65, Carrefour: 70, Quickmart: 67 } },
  { id: 'milk_ilara_500', name: 'Ilara Milk', category: 'Milk', quantity: '500ml', prices: { Naivas: 59, Carrefour: 62, Quickmart: 60 } },
  { id: 'milk_kcc_500', name: 'KCC Fresh Milk', category: 'Milk', quantity: '500ml', prices: { Naivas: 58, Carrefour: 60, Quickmart: 59 } },
  { id: 'milk_tuzo_1l', name: 'Tuzo Milk', category: 'Milk', quantity: '1L', prices: { Naivas: 118, Carrefour: 125, Quickmart: 120 } },
  { id: 'milk_brookside_1l', name: 'Brookside Milk', category: 'Milk', quantity: '1L', prices: { Naivas: 125, Carrefour: 130, Quickmart: 128 } },
  { id: 'dairy_brookside_yogurt_500', name: 'Brookside Yogurt', category: 'Yogurt', quantity: '500ml', prices: { Naivas: 110, Carrefour: 115, Quickmart: 112 } },
  { id: 'sugar_kabras_1k', name: 'Kabras Sugar', category: 'Sugar', quantity: '1kg', prices: { Naivas: 145, Carrefour: 150, Quickmart: 147 } },
  { id: 'sugar_kabras_2k', name: 'Kabras Sugar', category: 'Sugar', quantity: '2kg', prices: { Naivas: 285, Carrefour: 295, Quickmart: 290 } },
  { id: 'sugar_local_1k', name: 'Local Label Sugar', category: 'Sugar', quantity: '1kg', prices: { Naivas: 135, Carrefour: 130, Quickmart: 138 } },
  { id: 'bread_broadways_400', name: 'Broadways Bread', category: 'Bread', quantity: '400g', prices: { Naivas: 65, Carrefour: 67, Quickmart: 65 } },
  { id: 'bread_festive_400', name: 'Festive Bread', category: 'Bread', quantity: '400g', prices: { Naivas: 65, Carrefour: 68, Quickmart: 66 } },
  { id: 'bread_supaloaf_400', name: 'Supa Loaf Bread', category: 'Bread', quantity: '400g', prices: { Naivas: 65, Carrefour: 65, Quickmart: 65 } },
  { id: 'bread_broadways_800', name: 'Broadways Bread', category: 'Bread', quantity: '800g', prices: { Naivas: 130, Carrefour: 132, Quickmart: 130 } },
  { id: 'bread_festive_800', name: 'Festive Bread', category: 'Bread', quantity: '800g', prices: { Naivas: 130, Carrefour: 134, Quickmart: 132 } },
  { id: 'flour_jogoo_2k', name: 'Jogoo Maize Meal', category: 'Maize Flour', quantity: '2kg', prices: { Naivas: 130, Carrefour: 135, Quickmart: 132 } },
  { id: 'flour_pembe_maize_2k', name: 'Pembe Maize Meal', category: 'Maize Flour', quantity: '2kg', prices: { Naivas: 128, Carrefour: 132, Quickmart: 130 } },
  { id: 'flour_soko_2k', name: 'Soko Maize Meal', category: 'Maize Flour', quantity: '2kg', prices: { Naivas: 125, Carrefour: 128, Quickmart: 126 } },
  { id: 'flour_hostess_2k', name: 'Hostess Maize Meal', category: 'Maize Flour', quantity: '2kg', prices: { Naivas: 175, Carrefour: 180, Quickmart: 178 } },
  { id: 'flour_ajab_wheat_2k', name: 'Ajab Wheat Flour', category: 'Wheat Flour', quantity: '2kg', prices: { Naivas: 165, Carrefour: 170, Quickmart: 168 } },
  { id: 'flour_exe_wheat_2k', name: 'EXE Wheat Flour', category: 'Wheat Flour', quantity: '2kg', prices: { Naivas: 175, Carrefour: 182, Quickmart: 179 } },
  { id: 'flour_pembe_wheat_2k', name: 'Pembe Wheat Flour', category: 'Wheat Flour', quantity: '2kg', prices: { Naivas: 160, Carrefour: 165, Quickmart: 162 } },
  { id: 'oil_goldenfry_1l', name: 'Golden Fry Cooking Oil', category: 'Cooking Oil', quantity: '1L', prices: { Naivas: 240, Carrefour: 245, Quickmart: 242 } },
  { id: 'oil_goldenfry_2l', name: 'Golden Fry Cooking Oil', category: 'Cooking Oil', quantity: '2L', prices: { Naivas: 460, Carrefour: 470, Quickmart: 465 } },
  { id: 'oil_freshfri_1l', name: 'Fresh Fri Cooking Oil', category: 'Cooking Oil', quantity: '1L', prices: { Naivas: 250, Carrefour: 255, Quickmart: 252 } },
  { id: 'oil_freshfri_2l', name: 'Fresh Fri Cooking Oil', category: 'Cooking Oil', quantity: '2L', prices: { Naivas: 480, Carrefour: 490, Quickmart: 485 } },
  { id: 'oil_rina_1l', name: 'Rina Cooking Oil', category: 'Cooking Oil', quantity: '1L', prices: { Naivas: 235, Carrefour: 240, Quickmart: 238 } },
  { id: 'oil_rina_2l', name: 'Rina Cooking Oil', category: 'Cooking Oil', quantity: '2L', prices: { Naivas: 450, Carrefour: 460, Quickmart: 455 } },
  { id: 'oil_goldenfry_5l', name: 'Golden Fry Cooking Oil', category: 'Cooking Oil', quantity: '5L', prices: { Naivas: 1100, Carrefour: 1120, Quickmart: 1110 } },
  { id: 'eggs_6', name: 'Fresh Eggs Pack of 6', category: 'Eggs', quantity: '6 pack', prices: { Naivas: 100, Carrefour: 110, Quickmart: 105 } },
  { id: 'eggs_15', name: 'Fresh Eggs Pack of 15', category: 'Eggs', quantity: '15 pack', prices: { Naivas: 240, Carrefour: 250, Quickmart: 245 } },
  { id: 'eggs_30', name: 'Fresh Eggs Tray of 30', category: 'Eggs', quantity: '30 tray', prices: { Naivas: 450, Carrefour: 470, Quickmart: 460 } },
  { id: 'rice_daawat_2k', name: 'Daawat Basmati Rice', category: 'Rice', quantity: '2kg', prices: { Naivas: 380, Carrefour: 395, Quickmart: 385 } },
  { id: 'rice_pearl_2k', name: 'Pearl Pishori Rice', category: 'Rice', quantity: '2kg', prices: { Naivas: 420, Carrefour: 440, Quickmart: 425 } },
  { id: 'rice_sindano_2k', name: 'Sindano Rice', category: 'Rice', quantity: '2kg', prices: { Naivas: 220, Carrefour: 230, Quickmart: 225 } },
  { id: 'soap_sunlight_1k', name: 'Sunlight Washing Powder', category: 'Detergent', quantity: '1kg', prices: { Naivas: 290, Carrefour: 300, Quickmart: 295 } },
  { id: 'soap_ariel_1k', name: 'Ariel Washing Powder', category: 'Detergent', quantity: '1kg', prices: { Naivas: 340, Carrefour: 350, Quickmart: 345 } },
  { id: 'soap_omo_1k', name: 'Omo Washing Powder', category: 'Detergent', quantity: '1kg', prices: { Naivas: 320, Carrefour: 330, Quickmart: 325 } },
  { id: 'soap_geisha_225', name: 'Geisha Soap', category: 'Bath Soap', quantity: '225g', prices: { Naivas: 120, Carrefour: 125, Quickmart: 122 } },
  { id: 'soap_menengai_800', name: 'Menengai Bar Soap', category: 'Laundry Soap', quantity: '800g', prices: { Naivas: 140, Carrefour: 145, Quickmart: 142 } },
  { id: 'tea_ketepa_100s', name: 'Ketepa Tea Bags', category: 'Tea', quantity: '100 bags', prices: { Naivas: 210, Carrefour: 220, Quickmart: 215 } },
  { id: 'tea_safari_250', name: 'Safari Pure Tea', category: 'Tea', quantity: '250g', prices: { Naivas: 180, Carrefour: 190, Quickmart: 185 } },
  { id: 'coffee_nescafe_100', name: 'Nescafe Classic', category: 'Coffee', quantity: '100g', prices: { Naivas: 380, Carrefour: 400, Quickmart: 390 } },
  { id: 'tissue_hanan_4', name: 'Hanan Toilet Paper', category: 'Tissue', quantity: '4 pack', prices: { Naivas: 180, Carrefour: 190, Quickmart: 185 } },
  { id: 'tissue_velvex_4', name: 'Velvex Toilet Paper', category: 'Tissue', quantity: '4 pack', prices: { Naivas: 220, Carrefour: 230, Quickmart: 225 } },
  { id: 'tissue_toilex_4', name: 'Toilex Toilet Paper', category: 'Tissue', quantity: '4 pack', prices: { Naivas: 140, Carrefour: 145, Quickmart: 140 } },
  { id: 'salt_kensalt_1k', name: 'Kensalt Salt', category: 'Salt', quantity: '1kg', prices: { Naivas: 35, Carrefour: 38, Quickmart: 36 } },
  { id: 'blueband_250', name: 'Blue Band Margarine', category: 'Margarine', quantity: '250g', prices: { Naivas: 145, Carrefour: 150, Quickmart: 147 } },
  { id: 'blueband_500', name: 'Blue Band Margarine', category: 'Margarine', quantity: '500g', prices: { Naivas: 275, Carrefour: 285, Quickmart: 280 } },
  { id: 'spaghetti_santa_500', name: 'Santa Maria Spaghetti', category: 'Pasta', quantity: '500g', prices: { Naivas: 80, Carrefour: 85, Quickmart: 82 } },
  { id: 'drink_delmonte_1l', name: 'Del Monte Juice', category: 'Juice', quantity: '1L', prices: { Naivas: 280, Carrefour: 290, Quickmart: 285 } },
  { id: 'drink_keringet_1l', name: 'Keringet Mineral Water', category: 'Water', quantity: '1L', prices: { Naivas: 75, Carrefour: 80, Quickmart: 78 } },
  { id: 'drink_cocacola_2l', name: 'Coca-Cola Soda', category: 'Soda', quantity: '2L', prices: { Naivas: 180, Carrefour: 185, Quickmart: 180 } }
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
    console.log('PostgreSQL migrations completed.');

    const res = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(res.rows[0].count, 10) === 0) {
      console.log('Seeding initial products into database...');
      for (const p of INITIAL_PRODUCTS) {
        await pool.query(
          `INSERT INTO products (id, name, category, quantity, price_naivas, price_carrefour, price_quickmart)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [p.id, p.name, p.category, p.quantity, p.prices.Naivas, p.prices.Carrefour, p.prices.Quickmart]
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
