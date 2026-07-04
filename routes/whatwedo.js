const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. GET ALL ITEMS
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM whatwedo ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 2. GET SINGLE ITEM BY ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM whatwedo WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching single item:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 3. POST - CREATE NEW ITEM
router.post('/', async (req, res) => {
  const { name, slug, category } = req.body;

  if (!name || !slug || !category) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields: name, slug, category' });
  }

  try {
    // Check if slug already exists since it's UNIQUE
    const [existing] = await db.query('SELECT id FROM whatwedo WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Slug must be unique. This slug is already taken.' });
    }

    const [result] = await db.query(
      'INSERT INTO whatwedo (name, slug, category) VALUES (?, ?, ?)',
      [name, slug, category]
    );

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: { id: result.insertId, name, slug, category }
    });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 4. PUT - UPDATE ITEM BY ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, slug, category } = req.body;

  if (!name || !slug || !category) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields: name, slug, category' });
  }

  try {
    // Check if item exists
    const [existingItem] = await db.query('SELECT id FROM whatwedo WHERE id = ?', [id]);
    if (existingItem.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Check if new slug is taken by another item
    const [existingSlug] = await db.query('SELECT id FROM whatwedo WHERE slug = ? AND id != ?', [slug, id]);
    if (existingSlug.length > 0) {
      return res.status(400).json({ success: false, message: 'Slug must be unique. This slug is already taken.' });
    }

    await db.query(
      'UPDATE whatwedo SET name = ?, slug = ?, category = ? WHERE id = ?',
      [name, slug, category, id]
    );

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: { id, name, slug, category }
    });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 5. DELETE - DELETE ITEM BY ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if item exists
    const [existingItem] = await db.query('SELECT id FROM whatwedo WHERE id = ?', [id]);
    if (existingItem.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await db.query('DELETE FROM whatwedo WHERE id = ?', [id]);

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
