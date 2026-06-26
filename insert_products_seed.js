const db = require('./db');

const TARGET_SUPERMARKETS = [
  { id: 'sup_mqujqd7otswnp', name: 'Naivas', key: 'naivas' },
  { id: 'sup_mquk1rz0d3dno', name: 'Quickmart', key: 'quickmart' },
  { id: 'sup_mquhb6jls746d', name: 'Skymart', key: 'skymart' }
];

function varyPrice(originalPrice, supermarketName, productName) {
  const priceNum = parseFloat(originalPrice);
  if (isNaN(priceNum) || priceNum <= 0) return 0;
  
  // Use character code sums of product name and supermarket name to create a semi-deterministic,
  // yet realistic price variation so prices are consistent when re-run.
  let nameHash = 0;
  for (let i = 0; i < productName.length; i++) {
    nameHash += productName.charCodeAt(i);
  }
  for (let i = 0; i < supermarketName.length; i++) {
    nameHash += supermarketName.charCodeAt(i);
  }
  
  // Variation between -10% and +12%
  const percentChange = ((nameHash % 23) - 10) / 100; // -10% to +12%
  let newPrice = priceNum * (1 + percentChange);
  
  // Round to nearest shilling, or nearest 5 shillings for items above KES 200
  if (newPrice > 200) {
    newPrice = Math.round(newPrice / 5) * 5;
  } else {
    newPrice = Math.round(newPrice);
  }
  
  // Keep prices positive and reasonable
  return Math.max(5, newPrice);
}

async function seedProducts() {
  console.log('Starting product seeding for Naivas, Quickmart, and Skymart...');
  try {
    // 1. Fetch all existing products (belonging to Magunas or default)
    const originalProductsResult = await db.query('SELECT * FROM products');
    const originalProducts = originalProductsResult.rows;
    console.log(`Found ${originalProducts.length} base products in the database.`);
    
    if (originalProducts.length === 0) {
      console.log('Error: No base products found in database to clone. Please make sure Magunas products are seeded first.');
      return;
    }
    
    // 2. Clone and insert products for each target supermarket
    let insertedCount = 0;
    for (const prod of originalProducts) {
      // Avoid cloning a clone (only clone products that belong to the base supermarket, e.g. Magunas or don't have suffix)
      if (prod.id.endsWith('_naivas') || prod.id.endsWith('_quickmart') || prod.id.endsWith('_skymart')) {
        continue;
      }
      
      for (const target of TARGET_SUPERMARKETS) {
        const clonedId = `${prod.id}_${target.key}`;
        const newPrice = varyPrice(prod.price, target.name, prod.name);
        
        await db.query(
          `INSERT INTO products (id, name, category, quantity, price, supermarket_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               category = EXCLUDED.category,
               quantity = EXCLUDED.quantity,
               price = EXCLUDED.price,
               supermarket_id = EXCLUDED.supermarket_id`,
          [clonedId, prod.name, prod.category, prod.quantity, newPrice, target.id]
        );
        insertedCount++;
      }
    }
    
    console.log(`Successfully seeded ${insertedCount} products across Naivas, Quickmart, and Skymart.`);
    
    // 3. Verify total products count in the database
    const totalCountResult = await db.query('SELECT COUNT(*) FROM products');
    console.log(`Total products in database now: ${totalCountResult.rows[0].count}`);
    
    // Print breakdown per supermarket
    const breakdownResult = await db.query(`
      SELECT s.name AS supermarket_name, COUNT(p.id) AS product_count
      FROM products p
      LEFT JOIN supermarkets s ON p.supermarket_id = s.id
      GROUP BY s.name
      ORDER BY s.name ASC
    `);
    console.log('Product breakdown by Supermarket:');
    for (const row of breakdownResult.rows) {
      console.log(`- ${row.supermarket_name || 'No Supermarket'}: ${row.product_count} products`);
    }
    
  } catch (error) {
    console.error('Failed to seed products:', error);
  } finally {
    await db.pool.end();
    console.log('Database pool connection closed.');
  }
}

seedProducts();
