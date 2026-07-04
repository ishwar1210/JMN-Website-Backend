const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const upload = require('../middleware/upload');

// Helper function to delete physical files
const deleteFile = (relativePath) => {
  if (!relativePath) return;
  
  // Extract only the filename from the URL or path
  let filename = relativePath;
  if (relativePath.includes('/uploads/')) {
    filename = relativePath.substring(relativePath.indexOf('/uploads/') + 9);
  } else if (relativePath.includes('\\uploads\\')) {
    filename = relativePath.substring(relativePath.indexOf('\\uploads\\') + 9);
  } else {
    filename = path.basename(relativePath);
  }
  
  const filePath = path.join(__dirname, '../uploads', filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete file at ${filePath}:`, err.message);
    } else {
      console.log(`Successfully deleted file at ${filePath}`);
    }
  });
};

// Middleware to handle multer upload and potential errors
const handleUpload = (req, res, next) => {
  upload.any()(req, res, function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// 1. GET ALL ITEMS
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM achievements ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 2. GET SINGLE ITEM BY ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM achievements WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching single achievement:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 3. POST - CREATE NEW ITEM
router.post('/', handleUpload, async (req, res) => {
  let fileToCleanup = null;
  try {
    const { archiv_name, archiv_desc } = req.body;

    if (!archiv_name) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(f => deleteFile(f.filename));
      }
      return res.status(400).json({ success: false, message: 'Please provide required fields: archiv_name' });
    }

    // Find if archiv_image file was uploaded
    let archiv_image = null;
    if (req.files && req.files.length > 0) {
      const imgFile = req.files.find(file => file.fieldname === 'archiv_image');
      if (imgFile) {
        archiv_image = `/uploads/${imgFile.filename}`;
        fileToCleanup = imgFile.filename;
      }
    }

    const [result] = await db.query(
      'INSERT INTO achievements (archiv_name, archiv_image, archiv_desc) VALUES (?, ?, ?)',
      [archiv_name, archiv_image, archiv_desc || null]
    );

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully',
      data: { id: result.insertId, archiv_name, archiv_image, archiv_desc }
    });
  } catch (error) {
    console.error('Error inserting achievement:', error);
    if (fileToCleanup) deleteFile(fileToCleanup);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 4. PUT - UPDATE ITEM BY ID
router.put('/:id', handleUpload, async (req, res) => {
  const { id } = req.params;
  let fileToCleanup = null;
  try {
    // Check if record exists
    const [existing] = await db.query('SELECT * FROM achievements WHERE id = ?', [id]);
    if (existing.length === 0) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(f => deleteFile(f.filename));
      }
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }

    const currentRecord = existing[0];
    const { archiv_name, archiv_desc } = req.body;

    // Handle file upload
    let archiv_image = currentRecord.archiv_image;
    if (req.files && req.files.length > 0) {
      const imgFile = req.files.find(file => file.fieldname === 'archiv_image');
      if (imgFile) {
        // Replaced old image
        if (currentRecord.archiv_image) {
          deleteFile(currentRecord.archiv_image);
        }
        archiv_image = `/uploads/${imgFile.filename}`;
        fileToCleanup = imgFile.filename;
      }
    }

    // Keep existing values if not provided in the request body
    const final_archiv_name = archiv_name !== undefined ? archiv_name : currentRecord.archiv_name;
    const final_archiv_desc = archiv_desc !== undefined ? archiv_desc : currentRecord.archiv_desc;

    await db.query(
      'UPDATE achievements SET archiv_name = ?, archiv_image = ?, archiv_desc = ? WHERE id = ?',
      [final_archiv_name, archiv_image, final_archiv_desc, id]
    );

    res.json({
      success: true,
      message: 'Achievement updated successfully',
      data: { id, archiv_name: final_archiv_name, archiv_image, archiv_desc: final_archiv_desc }
    });
  } catch (error) {
    console.error('Error updating achievement:', error);
    if (fileToCleanup) deleteFile(fileToCleanup);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 5. DELETE - DELETE ITEM BY ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if record exists
    const [rows] = await db.query('SELECT * FROM achievements WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }

    const record = rows[0];

    // Delete database entry
    await db.query('DELETE FROM achievements WHERE id = ?', [id]);

    // Delete physical image file from disk
    if (record.archiv_image) {
      deleteFile(record.archiv_image);
    }

    res.json({ success: true, message: 'Achievement and associated image deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
