const multer = require('multer');
const path = require('path');

// Memory storage engine for streaming to Cloudinary
const storage = multer.memoryStorage();

// Allowed file extensions regex
const ALLOWED_EXTENSIONS = /jpeg|jpg|png|webp|gif|svg|pdf|doc|docx|txt|md|markdown|csv|xls|xlsx|ppt|pptx|zip|json|xml|mp3|mp4/;

// File filter validation
const fileFilter = (req, file, cb) => {
  const extname = ALLOWED_EXTENSIONS.test(
    path.extname(file.originalname).toLowerCase()
  );

  // Check MIME types or fallback by extension check
  const isAllowedMime =
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('text/') ||
    file.mimetype.startsWith('audio/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype.includes('pdf') ||
    file.mimetype.includes('word') ||
    file.mimetype.includes('excel') ||
    file.mimetype.includes('spreadsheet') ||
    file.mimetype.includes('presentation') ||
    file.mimetype.includes('zip') ||
    file.mimetype.includes('json') ||
    file.mimetype.includes('markdown') ||
    file.mimetype.includes('octet-stream');

  if (extname || isAllowedMime) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        'File type not allowed! Allowed formats: PDF, DOC, DOCX, MD, TXT, CSV, XLS, XLSX, PPT, PPTX, ZIP, Images, Audio, Video.'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter,
});

module.exports = upload;
