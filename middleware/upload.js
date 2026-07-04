const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Save file with a unique name: timestamp-originalName (sanitized)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
  }
});

// File filter to allow images and videos
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|webp|mp4|webm|ogg|mov/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png, gif, webp) and videos (mp4, webm, ogg, mov) are allowed!'), false);
  }
};

// File filter to allow resumes (pdf, doc, docx)
const resumeFileFilter = (req, file, cb) => {
  const allowedExts = /pdf|doc|docx/;
  // application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  const allowedMimes = /pdf|msword|wordprocessingml|octet-stream/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimes.test(file.mimetype) || allowedExts.test(file.originalname.split('.').pop().toLowerCase());

  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('Only resumes (PDF, DOC, DOCX) are allowed!'), false);
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
  fileFilter: fileFilter
});

// Initialize multer for resumes
upload.resume = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit for resumes
  fileFilter: resumeFileFilter
});

module.exports = upload;
