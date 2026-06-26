const db = require('./db');

async function insertPromotion() {
  const promoId = 'promo_weekend_feast_' + Math.random().toString(36).substr(2, 5);
  const title = '🥑 Weekend Fresh Feast: 20% Off All Organic Produce!';
  const body = 'Elevate your meals with the freshest selections of organic fruits, leafy greens, and premium avocados this weekend! Use checkout code FRESH20 to claim a 20% discount on your entire fresh produce cart. Offer valid from Friday to Sunday midnight at all participating supermarket branches. Limit one coupon per customer. Stay healthy and save more with BudgetTrack!';
  const imageUrl = '/uploads/promo_weekend_special.png';
  const linkUrl = 'https://www.google.com';

  console.log('Inserting promotional campaign into the database...');
  try {
    const result = await db.query(
      `INSERT INTO promotions (id, title, body, image_url, link_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE 
       SET title = EXCLUDED.title, body = EXCLUDED.body, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url
       RETURNING id`,
      [promoId, title, body, imageUrl, linkUrl]
    );
    console.log(`Successfully inserted promotional message! Campaign ID: ${result.rows[0].id}`);
  } catch (error) {
    console.error('Failed to insert promotional message:', error);
  } finally {
    // End the pool connection to let the process exit cleanly
    await db.pool.end();
    console.log('Database pool connection closed.');
  }
}

insertPromotion();
