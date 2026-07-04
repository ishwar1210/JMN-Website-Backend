const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. GET ALL ITEMS
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM technologies ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching technologies:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 2. GET SINGLE ITEM BY ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM technologies WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Technology not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching single technology:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 3. POST - CREATE NEW ITEM
router.post('/', async (req, res) => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields: name, slug' });
  }

  try {
    // Check if slug already exists since it's UNIQUE
    const [existing] = await db.query('SELECT id FROM technologies WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Slug must be unique. This slug is already taken.' });
    }

    const [result] = await db.query(
      'INSERT INTO technologies (name, slug) VALUES (?, ?)',
      [name, slug]
    );

    res.status(201).json({
      success: true,
      message: 'Technology created successfully',
      data: { id: result.insertId, name, slug }
    });
  } catch (error) {
    console.error('Error inserting technology:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 4. PUT - UPDATE ITEM BY ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, slug } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields: name, slug' });
  }

  try {
    // Check if item exists
    const [existingItem] = await db.query('SELECT id FROM technologies WHERE id = ?', [id]);
    if (existingItem.length === 0) {
      return res.status(404).json({ success: false, message: 'Technology not found' });
    }

    // Check if new slug is taken by another item
    const [existingSlug] = await db.query('SELECT id FROM technologies WHERE slug = ? AND id != ?', [slug, id]);
    if (existingSlug.length > 0) {
      return res.status(400).json({ success: false, message: 'Slug must be unique. This slug is already taken.' });
    }

    await db.query(
      'UPDATE technologies SET name = ?, slug = ? WHERE id = ?',
      [name, slug, id]
    );

    res.json({
      success: true,
      message: 'Technology updated successfully',
      data: { id, name, slug }
    });
  } catch (error) {
    console.error('Error updating technology:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 5. DELETE - DELETE ITEM BY ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if item exists
    const [existingItem] = await db.query('SELECT id FROM technologies WHERE id = ?', [id]);
    if (existingItem.length === 0) {
      return res.status(404).json({ success: false, message: 'Technology not found' });
    }

    await db.query('DELETE FROM technologies WHERE id = ?', [id]);

    res.json({ success: true, message: 'Technology deleted successfully' });
  } catch (error) {
    console.error('Error deleting technology:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
