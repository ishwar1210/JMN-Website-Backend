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
    const [rows] = await db.query('SELECT * FROM client ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 2. GET SINGLE ITEM BY ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM client WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching single client:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 3. POST - CREATE NEW ITEM
router.post('/', handleUpload, async (req, res) => {
  let fileToCleanup = null;
  try {
    const { client_name } = req.body;

    if (!client_name) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(f => deleteFile(f.filename));
      }
      return res.status(400).json({ success: false, message: 'Please provide required fields: client_name' });
    }

    // Find if logo_image file was uploaded
    let logo_image = null;
    if (req.files && req.files.length > 0) {
      const imgFile = req.files.find(file => file.fieldname === 'logo_image');
      if (imgFile) {
        logo_image = `/uploads/${imgFile.filename}`;
        fileToCleanup = imgFile.filename;
      }
    }

    const [result] = await db.query(
      'INSERT INTO client (client_name, logo_image) VALUES (?, ?)',
      [client_name, logo_image]
    );

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: { id: result.insertId, client_name, logo_image }
    });
  } catch (error) {
    console.error('Error inserting client:', error);
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
    const [existing] = await db.query('SELECT * FROM client WHERE id = ?', [id]);
    if (existing.length === 0) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(f => deleteFile(f.filename));
      }
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const currentRecord = existing[0];
    const { client_name } = req.body;

    // Handle file upload
    let logo_image = currentRecord.logo_image;
    if (req.files && req.files.length > 0) {
      const imgFile = req.files.find(file => file.fieldname === 'logo_image');
      if (imgFile) {
        // Replaced old image
        if (currentRecord.logo_image) {
          deleteFile(currentRecord.logo_image);
        }
        logo_image = `/uploads/${imgFile.filename}`;
        fileToCleanup = imgFile.filename;
      }
    }

    // Keep existing values if not provided in the request body
    const final_client_name = client_name !== undefined ? client_name : currentRecord.client_name;

    await db.query(
      'UPDATE client SET client_name = ?, logo_image = ? WHERE id = ?',
      [final_client_name, logo_image, id]
    );

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: { id, client_name: final_client_name, logo_image }
    });
  } catch (error) {
    console.error('Error updating client:', error);
    if (fileToCleanup) deleteFile(fileToCleanup);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 5. DELETE - DELETE ITEM BY ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if record exists
    const [rows] = await db.query('SELECT * FROM client WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const record = rows[0];

    // Delete database entry
    await db.query('DELETE FROM client WHERE id = ?', [id]);

    // Delete physical image file from disk
    if (record.logo_image) {
      deleteFile(record.logo_image);
    }

    res.json({ success: true, message: 'Client and associated logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
