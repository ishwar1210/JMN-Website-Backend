const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. GET ALL ITEMS
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM career ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching careers:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 2. GET SINGLE ITEM BY ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM career WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Career item not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching single career item:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 3. POST - CREATE NEW ITEM
router.post('/', async (req, res) => {
  const { job_title, job_category, job_desc, job_type } = req.body;

  if (!job_title) {
    return res.status(400).json({ success: false, message: 'Please provide required fields: job_title' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO career (job_title, job_category, job_desc, job_type) VALUES (?, ?, ?, ?)',
      [job_title, job_category || null, job_desc || null, job_type || null]
    );

    res.status(201).json({
      success: true,
      message: 'Career item created successfully',
      data: { id: result.insertId, job_title, job_category, job_desc, job_type }
    });
  } catch (error) {
    console.error('Error inserting career item:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 4. PUT - UPDATE ITEM BY ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { job_title, job_category, job_desc, job_type } = req.body;

  if (!job_title) {
    return res.status(400).json({ success: false, message: 'Please provide required fields: job_title' });
  }

  try {
    // Check if item exists
    const [existingItem] = await db.query('SELECT id FROM career WHERE id = ?', [id]);
    if (existingItem.length === 0) {
      return res.status(404).json({ success: false, message: 'Career item not found' });
    }

    await db.query(
      'UPDATE career SET job_title = ?, job_category = ?, job_desc = ?, job_type = ? WHERE id = ?',
      [job_title, job_category || null, job_desc || null, job_type || null, id]
    );

    res.json({
      success: true,
      message: 'Career item updated successfully',
      data: { id, job_title, job_category, job_desc, job_type }
    });
  } catch (error) {
    console.error('Error updating career item:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 5. DELETE - DELETE ITEM BY ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if item exists
    const [existingItem] = await db.query('SELECT id FROM career WHERE id = ?', [id]);
    if (existingItem.length === 0) {
      return res.status(404).json({ success: false, message: 'Career item not found' });
    }

    await db.query('DELETE FROM career WHERE id = ?', [id]);

    res.json({ success: true, message: 'Career item deleted successfully' });
  } catch (error) {
    console.error('Error deleting career item:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
