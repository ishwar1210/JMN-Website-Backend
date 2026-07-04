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

// 1. GET ALL ITEMS (Usually there is only 1 homepage configuration)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM home ORDER BY updated_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching home configurations:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 2. GET SINGLE ITEM BY ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM home WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Home configuration not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching single home configuration:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 3. POST - CREATE NEW ITEM
router.post('/', handleUpload, async (req, res) => {
  let fileToCleanup = null;
  try {
    const {
      home_title,
      home_desc,
      company_exp,
      apps_dev,
      project_dev,
      countries_served,
      client_satisfaction_percent,
      talented_squad
    } = req.body;

    // Find if home_video file was uploaded
    let home_video = null;
    if (req.files && req.files.length > 0) {
      const videoFile = req.files.find(file => file.fieldname === 'home_video');
      if (videoFile) {
        home_video = `/uploads/${videoFile.filename}`;
        fileToCleanup = videoFile.filename;
      }
    }

    const [result] = await db.query(
      `INSERT INTO home 
       (home_video, home_title, home_desc, company_exp, apps_dev, project_dev, countries_served, client_satisfaction_percent, talented_squad) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        home_video,
        home_title || null,
        home_desc || null,
        company_exp !== undefined ? parseInt(company_exp) : 0,
        apps_dev !== undefined ? parseInt(apps_dev) : 0,
        project_dev !== undefined ? parseInt(project_dev) : 0,
        countries_served !== undefined ? parseInt(countries_served) : 0,
        client_satisfaction_percent !== undefined ? parseFloat(client_satisfaction_percent) : 0.00,
        talented_squad !== undefined ? parseInt(talented_squad) : 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Home configuration created successfully',
      data: {
        id: result.insertId,
        home_video,
        home_title,
        home_desc,
        company_exp,
        apps_dev,
        project_dev,
        countries_served,
        client_satisfaction_percent,
        talented_squad
      }
    });
  } catch (error) {
    console.error('Error inserting home configuration:', error);
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
    const [existing] = await db.query('SELECT * FROM home WHERE id = ?', [id]);
    if (existing.length === 0) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(f => deleteFile(f.filename));
      }
      return res.status(404).json({ success: false, message: 'Home configuration not found' });
    }

    const currentRecord = existing[0];
    const {
      home_title,
      home_desc,
      company_exp,
      apps_dev,
      project_dev,
      countries_served,
      client_satisfaction_percent,
      talented_squad
    } = req.body;

    // Handle file upload
    let home_video = currentRecord.home_video;
    if (req.files && req.files.length > 0) {
      const videoFile = req.files.find(file => file.fieldname === 'home_video');
      if (videoFile) {
        // Replaced old video
        if (currentRecord.home_video) {
          deleteFile(currentRecord.home_video);
        }
        home_video = `/uploads/${videoFile.filename}`;
        fileToCleanup = videoFile.filename;
      }
    }

    // Keep existing values if not provided in the request body
    const final_home_title = home_title !== undefined ? home_title : currentRecord.home_title;
    const final_home_desc = home_desc !== undefined ? home_desc : currentRecord.home_desc;
    const final_company_exp = company_exp !== undefined ? parseInt(company_exp) : currentRecord.company_exp;
    const final_apps_dev = apps_dev !== undefined ? parseInt(apps_dev) : currentRecord.apps_dev;
    const final_project_dev = project_dev !== undefined ? parseInt(project_dev) : currentRecord.project_dev;
    const final_countries_served = countries_served !== undefined ? parseInt(countries_served) : currentRecord.countries_served;
    const final_client_satisfaction_percent = client_satisfaction_percent !== undefined ? parseFloat(client_satisfaction_percent) : currentRecord.client_satisfaction_percent;
    const final_talented_squad = talented_squad !== undefined ? parseInt(talented_squad) : currentRecord.talented_squad;

    await db.query(
      `UPDATE home SET 
       home_video = ?, 
       home_title = ?, 
       home_desc = ?, 
       company_exp = ?, 
       apps_dev = ?, 
       project_dev = ?, 
       countries_served = ?, 
       client_satisfaction_percent = ?, 
       talented_squad = ? 
       WHERE id = ?`,
      [
        home_video,
        final_home_title,
        final_home_desc,
        final_company_exp,
        final_apps_dev,
        final_project_dev,
        final_countries_served,
        final_client_satisfaction_percent,
        final_talented_squad,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Home configuration updated successfully',
      data: {
        id,
        home_video,
        home_title: final_home_title,
        home_desc: final_home_desc,
        company_exp: final_company_exp,
        apps_dev: final_apps_dev,
        project_dev: final_project_dev,
        countries_served: final_countries_served,
        client_satisfaction_percent: final_client_satisfaction_percent,
        talented_squad: final_talented_squad
      }
    });
  } catch (error) {
    console.error('Error updating home configuration:', error);
    if (fileToCleanup) deleteFile(fileToCleanup);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 5. DELETE - DELETE ITEM BY ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if record exists
    const [rows] = await db.query('SELECT * FROM home WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Home configuration not found' });
    }

    const record = rows[0];

    // Delete database entry
    await db.query('DELETE FROM home WHERE id = ?', [id]);

    // Delete physical video file from disk
    if (record.home_video) {
      deleteFile(record.home_video);
    }

    res.json({ success: true, message: 'Home configuration and associated video deleted successfully' });
  } catch (error) {
    console.error('Error deleting home configuration:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
