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
    const [result] = await db.query('CALL SP_GetAllWhatwedoDetail()');
    // SP_GetAllWhatwedoDetail returns a list of details.
    // In mysql2, calling a procedure returns [ [rows, okPacket], fields ]
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
    const [result] = await db.query('CALL SP_GetWhatwedoDetailById(?)', [id]);
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

// 2.5 GET DETAIL BY WHATWEDO ID
router.get('/whatwedo/:whatwedo_id', async (req, res) => {
  const { whatwedo_id } = req.params;
  try {
    const [result] = await db.query('CALL SP_GetWhatwedoDetailByWhatwedoId(?)', [whatwedo_id]);
    const details = result[0] || [];
    const thinkItems = result[1] || [];

    if (details.length === 0) {
      return res.status(404).json({ success: false, message: 'Detail record not found for the given whatwedo_id' });
    }

    const data = {
      ...details[0],
      think_items: thinkItems
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching detail record by whatwedo_id:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 3. POST - CREATE NEW DETAIL RECORD WITH IMAGE UPLOADS
router.post('/', handleUpload, async (req, res) => {
  let filesToCleanup = [];
  try {
    const {
      whatwedo_id,
      banner_title,
      expertise_header,
      expertise_desc
    } = req.body;

    if (!whatwedo_id) {
      if (req.files) {
        req.files.forEach(f => deleteFile(f.filename));
      }
      return res.status(400).json({ success: false, message: 'whatwedo_id is required' });
    }

    // Map uploaded files
    const filesMap = {};
    if (req.files) {
      req.files.forEach(file => {
        filesMap[file.fieldname] = file.filename;
        filesToCleanup.push(file.filename);
      });
    }

    const banner_image = filesMap['banner_image'] ? `/uploads/${filesMap['banner_image']}` : null;

    // Parse think_items
    let thinkItems = [];
    if (req.body.think_items) {
      thinkItems = typeof req.body.think_items === 'string'
        ? JSON.parse(req.body.think_items)
        : req.body.think_items;
    }

    // Map dynamic think images
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
      'CALL SP_InsertWhatwedoDetail(?, ?, ?, ?, ?, ?)',
      [
        whatwedo_id,
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
        whatwedo_id,
        banner_image,
        banner_title,
        expertise_header,
        expertise_desc,
        think_items: thinkItems
      }
    });
  } catch (error) {
    console.error('Error inserting detail record:', error);
    // Cleanup any files uploaded during this request
    filesToCleanup.forEach(filename => deleteFile(filename));
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 4. PUT - UPDATE DETAIL RECORD BY ID
router.put('/:id', handleUpload, async (req, res) => {
  const { id } = req.params;
  let filesToCleanup = [];
  try {
    // 1. Fetch current record to manage file replacement/cleanup
    const [existingResult] = await db.query('CALL SP_GetWhatwedoDetailById(?)', [id]);
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
      whatwedo_id,
      banner_title,
      expertise_header,
      expertise_desc
    } = req.body;

    // Map uploaded files
    const filesMap = {};
    if (req.files) {
      req.files.forEach(file => {
        filesMap[file.fieldname] = file.filename;
        filesToCleanup.push(file.filename);
      });
    }

    // Determine banner image
    let banner_image = currentRecord.banner_image;
    if (filesMap['banner_image']) {
      // Replaced old banner image
      if (currentRecord.banner_image) {
        deleteFile(currentRecord.banner_image);
      }
      banner_image = `/uploads/${filesMap['banner_image']}`;
    }

    // Parse incoming think_items
    let thinkItems = [];
    if (req.body.think_items) {
      thinkItems = typeof req.body.think_items === 'string'
        ? JSON.parse(req.body.think_items)
        : req.body.think_items;
    }

    // Track which old think images we should delete (ones that are not in the new thinkItems list)
    const newImages = new Set();

    // Map dynamic think images
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

    // Delete any old think images that are no longer referenced in the updated think list
    currentThinkItems.forEach(oldItem => {
      if (oldItem.think_image && !newImages.has(oldItem.think_image)) {
        deleteFile(oldItem.think_image);
      }
    });

    const thinkItemsJson = JSON.stringify(thinkItems);

    const final_whatwedo_id = whatwedo_id !== undefined ? whatwedo_id : currentRecord.whatwedo_id;
    const final_banner_title = banner_title !== undefined ? banner_title : currentRecord.banner_title;
    const final_expertise_header = expertise_header !== undefined ? expertise_header : currentRecord.expertise_header;
    const final_expertise_desc = expertise_desc !== undefined ? expertise_desc : currentRecord.expertise_desc;

    await db.query(
      'CALL SP_UpdateWhatwedoDetail(?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        final_whatwedo_id,
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
        whatwedo_id: final_whatwedo_id,
        banner_image,
        banner_title: final_banner_title,
        expertise_header: final_expertise_header,
        expertise_desc: final_expertise_desc,
        think_items: thinkItems
      }
    });
  } catch (error) {
    console.error('Error updating detail record:', error);
    // Cleanup files uploaded in this request on error
    filesToCleanup.forEach(filename => deleteFile(filename));
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// 5. DELETE - DELETE RECORD BY ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Fetch record first to get file paths for cleanup
    const [existingResult] = await db.query('CALL SP_GetWhatwedoDetailById(?)', [id]);
    const details = existingResult[0] || [];
    const thinkItems = existingResult[1] || [];

    if (details.length === 0) {
      return res.status(404).json({ success: false, message: 'Detail record not found' });
    }

    // 2. Call delete procedure
    await db.query('CALL SP_DeleteWhatwedoDetail(?)', [id]);

    // 3. Delete physical files from disk
    if (details[0].banner_image) {
      deleteFile(details[0].banner_image);
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
