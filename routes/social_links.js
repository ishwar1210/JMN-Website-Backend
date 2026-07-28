const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Ensure social_links table exists
const initTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS social_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform VARCHAR(50) NOT NULL UNIQUE,
        url VARCHAR(255) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default social links if empty
    const [rows] = await db.query('SELECT * FROM social_links');
    if (rows.length === 0) {
      await db.query(`
        INSERT INTO social_links (platform, url) VALUES
        ('facebook', 'https://facebook.com'),
        ('instagram', 'https://instagram.com'),
        ('youtube', 'https://youtube.com'),
        ('linkedin', 'https://linkedin.com')
      `);
    }
  } catch (err) {
    console.error('Error initializing social_links table:', err.message);
  }
};

initTable();

// 1. GET ALL SOCIAL LINKS
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM social_links ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching social links:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 2. GET SINGLE SOCIAL LINK BY ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM social_links WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Social link not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching single social link:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 3. POST - CREATE NEW SOCIAL LINK
router.post('/', async (req, res) => {
  const { platform, url, is_active } = req.body;

  if (!platform || !url) {
    return res.status(400).json({ success: false, message: 'Platform and URL are required fields' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO social_links (platform, url, is_active) VALUES (?, ?, ?)',
      [platform.toLowerCase(), url, is_active !== undefined ? is_active : 1]
    );

    res.status(201).json({
      success: true,
      message: 'Social link created successfully',
      data: { id: result.insertId, platform, url, is_active: is_active !== undefined ? is_active : 1 }
    });
  } catch (error) {
    console.error('Error creating social link:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 4. PUT - UPDATE SOCIAL LINK BY ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { platform, url, is_active } = req.body;

  if (!platform || !url) {
    return res.status(400).json({ success: false, message: 'Platform and URL are required fields' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM social_links WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Social link not found' });
    }

    await db.query(
      'UPDATE social_links SET platform = ?, url = ?, is_active = ? WHERE id = ?',
      [platform.toLowerCase(), url, is_active !== undefined ? is_active : 1, id]
    );

    res.json({
      success: true,
      message: 'Social link updated successfully',
      data: { id: Number(id), platform, url, is_active }
    });
  } catch (error) {
    console.error('Error updating social link:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 5. DELETE - DELETE SOCIAL LINK BY ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query('SELECT id FROM social_links WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Social link not found' });
    }

    await db.query('DELETE FROM social_links WHERE id = ?', [id]);
    res.json({ success: true, message: 'Social link deleted successfully' });
  } catch (error) {
    console.error('Error deleting social link:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
