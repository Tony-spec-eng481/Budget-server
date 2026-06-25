const db = require('../db');

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Get all shopping lists
exports.getLists = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      'SELECT id, name, shopping_date AS "shoppingDate", is_archived AS "isArchived", created_at AS "createdAt", updated_at AS "updatedAt" FROM shopping_lists WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('getLists error:', error);
    return res.status(500).json({ error: 'Failed to retrieve shopping lists.' });
  }
};

// Create a shopping list
exports.createList = async (req, res) => {
  const userId = req.user.id;
  const { id, name, shoppingDate } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'List name is required.' });
  }

  const listId = id || generateId();

  try {
    const result = await db.query(
      'INSERT INTO shopping_lists (id, user_id, name, shopping_date) VALUES ($1, $2, $3, $4) RETURNING id, name, shopping_date AS "shoppingDate", is_archived AS "isArchived", created_at AS "createdAt", updated_at AS "updatedAt"',
      [listId, userId, name, shoppingDate || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('createList error:', error);
    return res.status(500).json({ error: 'Failed to create shopping list.' });
  }
};

// Update a shopping list (name, is_archived)
exports.updateList = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, shoppingDate, isArchived } = req.body;

  try {
    // Verify list belongs to user
    const check = await db.query('SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Shopping list not found.' });
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (shoppingDate !== undefined) {
      fields.push(`shopping_date = $${paramIndex++}`);
      values.push(shoppingDate || null);
    }
    if (isArchived !== undefined) {
      fields.push(`is_archived = $${paramIndex++}`);
      values.push(isArchived);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(id);
    const sql = `UPDATE shopping_lists SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING id, name, shopping_date AS "shoppingDate", is_archived AS "isArchived", created_at AS "createdAt", updated_at AS "updatedAt"`;
    
    const result = await db.query(sql, values);
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('updateList error:', error);
    return res.status(500).json({ error: 'Failed to update shopping list.' });
  }
};

// Delete a shopping list
exports.deleteList = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // Verify list belongs to user
    const check = await db.query('SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Shopping list not found.' });
    }

    await db.query('DELETE FROM shopping_lists WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Shopping list deleted successfully.' });
  } catch (error) {
    console.error('deleteList error:', error);
    return res.status(500).json({ error: 'Failed to delete shopping list.' });
  }
};

// Get all items in a list
exports.getListItems = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // Verify list belongs to user
    const check = await db.query('SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Shopping list not found.' });
    }

    const result = await db.query(
      'SELECT id, list_id AS "listId", name, quantity, estimated_price AS "estimatedPrice", is_completed AS "isCompleted", created_at AS "createdAt" FROM shopping_items WHERE list_id = $1 ORDER BY created_at ASC',
      [id]
    );
    // Make sure decimals are parsed
    const formatted = result.rows.map(item => ({
      ...item,
      estimatedPrice: item.estimatedPrice ? parseFloat(item.estimatedPrice) : null
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('getListItems error:', error);
    return res.status(500).json({ error: 'Failed to retrieve list items.' });
  }
};

// Add an item to a list
exports.addItem = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // listId
  const { id: itemIdInput, name, quantity, estimatedPrice } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Item name is required.' });
  }

  try {
    // Verify list belongs to user
    const check = await db.query('SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Shopping list not found.' });
    }

    const itemId = itemIdInput || generateId();
    const result = await db.query(
      'INSERT INTO shopping_items (id, list_id, name, quantity, estimated_price) VALUES ($1, $2, $3, $4, $5) RETURNING id, list_id AS "listId", name, quantity, estimated_price AS "estimatedPrice", is_completed AS "isCompleted", created_at AS "createdAt"',
      [itemId, id, name, quantity, estimatedPrice]
    );

    const item = result.rows[0];
    item.estimatedPrice = item.estimatedPrice ? parseFloat(item.estimatedPrice) : null;
    return res.status(201).json(item);
  } catch (error) {
    console.error('addItem error:', error);
    return res.status(500).json({ error: 'Failed to add item to shopping list.' });
  }
};

// Update an item (name, quantity, estimatedPrice, isCompleted)
exports.updateItem = async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;
  const { name, quantity, estimatedPrice, isCompleted } = req.body;

  try {
    // Verify item belongs to a list owned by this user
    const check = await db.query(
      `SELECT si.* FROM shopping_items si 
       JOIN shopping_lists sl ON si.list_id = sl.id 
       WHERE si.id = $1 AND sl.user_id = $2`,
      [itemId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Shopping item not found.' });
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (quantity !== undefined) {
      fields.push(`quantity = $${paramIndex++}`);
      values.push(quantity);
    }
    if (estimatedPrice !== undefined) {
      fields.push(`estimated_price = $${paramIndex++}`);
      values.push(estimatedPrice);
    }
    if (isCompleted !== undefined) {
      fields.push(`is_completed = $${paramIndex++}`);
      values.push(isCompleted);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(itemId);
    const sql = `UPDATE shopping_items SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, list_id AS "listId", name, quantity, estimated_price AS "estimatedPrice", is_completed AS "isCompleted", created_at AS "createdAt"`;
    
    const result = await db.query(sql, values);
    const item = result.rows[0];
    item.estimatedPrice = item.estimatedPrice ? parseFloat(item.estimatedPrice) : null;
    return res.json(item);
  } catch (error) {
    console.error('updateItem error:', error);
    return res.status(500).json({ error: 'Failed to update shopping item.' });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;

  try {
    // Verify item belongs to a list owned by this user
    const check = await db.query(
      `SELECT si.* FROM shopping_items si 
       JOIN shopping_lists sl ON si.list_id = sl.id 
       WHERE si.id = $1 AND sl.user_id = $2`,
      [itemId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Shopping item not found.' });
    }

    await db.query('DELETE FROM shopping_items WHERE id = $1', [itemId]);
    return res.json({ success: true, message: 'Shopping item deleted successfully.' });
  } catch (error) {
    console.error('deleteItem error:', error);
    return res.status(500).json({ error: 'Failed to delete shopping item.' });
  }
};
