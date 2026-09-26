const express = require('express');
const router = express.Router();
const {
  uploadFileController,
  deleteAttachmentController,
  previewFileController,
  downloadFileController,
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All file routes require authentication
router.use(protect);

router.post('/upload', upload.any(), uploadFileController);
router.get('/preview-stream', previewFileController);
router.get('/download-stream', downloadFileController);
router.delete('/:noteId/:attachmentId', deleteAttachmentController);

module.exports = router;

