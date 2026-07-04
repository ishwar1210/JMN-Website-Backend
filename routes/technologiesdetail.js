const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const upload = require('../middleware/upload');

// Helper function to delete physical files
const deleteFile = (relativePath) => {
  if (!relativePath) return;
  
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

// Middleware to handle multer upload
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
    const [result] = await db.query('CALL SP_GetAllTechnologiesDetail()');
    const rows = result[0] || [];
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
    const [result] = await db.query('CALL SP_GetTechnologiesDetailById(?)', [id]);
    const details = result[0] || [];
    const thinkItems = result[1] || [];

    if (details.length === 0) {
      return res.status(404).json({ success: false, message: 'Detail record not found' });
    }

    const data = {
      ...details[0],
      think_items: thinkItems
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching single detail record:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 2.5 GET DETAIL BY TECHNOLOGIES ID
router.get('/technologies/:technologies_id', async (req, res) => {
  const { technologies_id } = req.params;
  try {
    const [result] = await db.query('CALL SP_GetTechnologiesDetailByTechnologiesId(?)', [technologies_id]);
    const details = result[0] || [];
    const thinkItems = result[1] || [];

    if (details.length === 0) {
      return res.status(404).json({ success: false, message: 'Detail record not found' });
    }

    const data = {
      ...details[0],
      think_items: thinkItems
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching detail record by technologies_id:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 3. POST - CREATE NEW DETAIL RECORD
router.post('/', handleUpload, async (req, res) => {
  let filesToCleanup = [];
  try {
    const {
      technologies_id,
      banner_title,
      expertise_header,
      expertise_desc
    } = req.body;

    if (!technologies_id) {
      if (req.files) {
        req.files.forEach(f => deleteFile(f.filename));
      }
      return res.status(400).json({ success: false, message: 'technologies_id is required' });
    }

    const filesMap = {};
    if (req.files) {
      req.files.forEach(file => {
        filesMap[file.fieldname] = file.filename;
        filesToCleanup.push(file.filename);
      });
    }

    const banner_image = filesMap['banner_image'] ? `/uploads/${filesMap['banner_image']}` : null;

    let thinkItems = [];
    if (req.body.think_items) {
      thinkItems = typeof req.body.think_items === 'string'
        ? JSON.parse(req.body.think_items)
        : req.body.think_items;
    }

    thinkItems = thinkItems.map((item, index) => {
      const fieldName = `think_image_${index}`;
      if (filesMap[fieldName]) {
        return {
          ...item,
          image: `/uploads/${filesMap[fieldName]}`
        };
      }
      return {
        ...item,
        image: item.image || null
      };
    });

    const thinkItemsJson = JSON.stringify(thinkItems);

    const [result] = await db.query(
      'CALL SP_InsertTechnologiesDetail(?, ?, ?, ?, ?, ?)',
      [
        technologies_id,
        banner_image,
        banner_title || null,
        expertise_header || null,
        expertise_desc || null,
        thinkItemsJson
      ]
    );

    const insertedId = result[0] && result[0][0] ? result[0][0].inserted_id : null;

    res.status(201).json({
      success: true,
      message: 'Detail record created successfully',
      data: {
        id: insertedId,
        technologies_id,
        banner_image,
        banner_title,
        expertise_header,
        expertise_desc,
        think_items: thinkItems
      }
    });
  } catch (error) {
    console.error('Error inserting detail record:', error);
    filesToCleanup.forEach(filename => deleteFile(filename));
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 4. PUT - UPDATE DETAIL RECORD BY ID
router.put('/:id', handleUpload, async (req, res) => {
  const { id } = req.params;
  let filesToCleanup = [];
  try {
    const [existingResult] = await db.query('CALL SP_GetTechnologiesDetailById(?)', [id]);
    const details = existingResult[0] || [];
    const currentThinkItems = existingResult[1] || [];

    if (details.length === 0) {
      if (req.files) {
        req.files.forEach(f => deleteFile(f.filename));
      }
      return res.status(404).json({ success: false, message: 'Detail record not found' });
    }

    const currentRecord = details[0];
    const {
      technologies_id,
      banner_title,
      expertise_header,
      expertise_desc
    } = req.body;

    const filesMap = {};
    if (req.files) {
      req.files.forEach(file => {
        filesMap[file.fieldname] = file.filename;
        filesToCleanup.push(file.filename);
      });
    }

    let banner_image = currentRecord.banner_image;
    if (filesMap['banner_image']) {
      if (currentRecord.banner_image) {
        deleteFile(currentRecord.banner_image);
      }
      banner_image = `/uploads/${filesMap['banner_image']}`;
    }

    let thinkItems = [];
    if (req.body.think_items) {
      thinkItems = typeof req.body.think_items === 'string'
        ? JSON.parse(req.body.think_items)
        : req.body.think_items;
    }

    const newImages = new Set();
    thinkItems = thinkItems.map((item, index) => {
      const fieldName = `think_image_${index}`;
      let finalImage = item.image || null;
      if (filesMap[fieldName]) {
        finalImage = `/uploads/${filesMap[fieldName]}`;
      }
      if (finalImage) {
        newImages.add(finalImage);
      }
      return {
        ...item,
        image: finalImage
      };
    });

    currentThinkItems.forEach(oldItem => {
      if (oldItem.think_image && !newImages.has(oldItem.think_image)) {
        deleteFile(oldItem.think_image);
      }
    });

    const thinkItemsJson = JSON.stringify(thinkItems);

    const final_technologies_id = technologies_id !== undefined ? technologies_id : currentRecord.technologies_id;
    const final_banner_title = banner_title !== undefined ? banner_title : currentRecord.banner_title;
    const final_expertise_header = expertise_header !== undefined ? expertise_header : currentRecord.expertise_header;
    const final_expertise_desc = expertise_desc !== undefined ? expertise_desc : currentRecord.expertise_desc;

    await db.query(
      'CALL SP_UpdateTechnologiesDetail(?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        final_technologies_id,
        banner_image,
        final_banner_title,
        final_expertise_header,
        final_expertise_desc,
        thinkItemsJson
      ]
    );

    res.json({
      success: true,
      message: 'Detail record updated successfully',
      data: {
        id,
        technologies_id: final_technologies_id,
        banner_image,
        banner_title: final_banner_title,
        expertise_header: final_expertise_header,
        expertise_desc: final_expertise_desc,
        think_items: thinkItems
      }
    });
  } catch (error) {
    console.error('Error updating detail record:', error);
    filesToCleanup.forEach(filename => deleteFile(filename));
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 5. DELETE - DELETE RECORD BY ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [existingResult] = await db.query('CALL SP_GetTechnologiesDetailById(?)', [id]);
    const details = existingResult[0] || [];
    const thinkItems = existingResult[1] || [];

    if (details.length === 0) {
      return res.status(404).json({ success: false, message: 'Detail record not found' });
    }

    const detailRecord = details[0];

    await db.query('CALL SP_DeleteTechnologiesDetail(?)', [id]);

    if (detailRecord.banner_image) {
      deleteFile(detailRecord.banner_image);
    }

    thinkItems.forEach(item => {
      if (item.think_image) {
        deleteFile(item.think_image);
      }
    });

    res.json({ success: true, message: 'Detail record and associated images deleted successfully' });
  } catch (error) {
    console.error('Error deleting detail record:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
