const db = require('./db');

const promotions = [
  {
    id: 'promo_weekend_feast',
    title: '🥑 Weekend Fresh Feast: 20% Off All Organic Produce!',
    body: 'Elevate your meals with the freshest selections of organic fruits, leafy greens, and premium avocados this weekend! Use checkout code FRESH20 to claim a 20% discount on your entire fresh produce cart. Offer valid from Friday to Sunday midnight at all participating supermarket branches. Limit one coupon per customer. Stay healthy and save more with BudgetTrack!',
    imageUrl: '/uploads/promo_weekend_special.png',
    linkUrl: 'https://www.google.com'
  },
  {
    id: 'promo_coffee_bakery',
    title: '☕ Midweek Coffee Boost: Buy 1 Get 1 Free!',
    body: 'Beat the Wednesday slump! Purchase any large barista-crafted coffee at Java House or Artcaffe and get a second one or a fresh pastry absolutely free! Present your BudgetTrack coupon code COFFEEBOGO to the cashier at checkout. Valid every Wednesday from 7 AM to 2 PM. Recharge your energy without breaking your weekly budget!',
    imageUrl: '/uploads/promo_coffee_bakery.png',
    linkUrl: 'https://www.google.com'
  },
  {
    id: 'promo_fitness_kickstart',
    title: '🏃‍♂️ Fitness Kickstart: 30% Off Gym & Supplement Packs!',
    body: 'Ready to hit your fitness goals? Get an exclusive 30% discount on monthly and annual memberships at participating Alpha Fitness centers, plus a free consultation with a personal trainer. Use code FITSTART at check-out or on our partner portals. Offer ends this Sunday night. Invest in your health today while keeping your budget in shape!',
    imageUrl: '/uploads/promo_fitness_kickstart.png',
    linkUrl: 'https://www.google.com'
  },
  {
    id: 'promo_tech_upgrade',
    title: '💻 Tech Upgrade Week: Up to 15% Off Selected Gadgets!',
    body: 'Enhance your workstation or upgrade your daily tech! Enjoy up to 15% off on selected headphones, wireless chargers, mechanical keyboards, and smart home gadgets at certified electronics outlets. Use voucher code TECH15 to redeem. Offer valid until next Friday. Smart upgrades, smarter savings!',
    imageUrl: '/uploads/promo_tech_upgrade.png',
    linkUrl: 'https://www.google.com'
  }
];

async function seedPromotions() {
  console.log('Seeding promotional campaigns into the database...');
  try {
    for (const promo of promotions) {
      const result = await db.query(
        `INSERT INTO promotions (id, title, body, image_url, link_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE 
         SET title = EXCLUDED.title, body = EXCLUDED.body, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url
         RETURNING id`,
        [promo.id, promo.title, promo.body, promo.imageUrl, promo.linkUrl]
      );
      console.log(`- Promotion [${promo.id}] inserted or updated.`);
    }
    console.log('Promotions seeded successfully!');
  } catch (error) {
    console.error('Failed to seed promotions:', error);
  } finally {
    // End the pool connection to let the process exit cleanly
    await db.pool.end();
    console.log('Database pool connection closed.');
  }
}

seedPromotions();
