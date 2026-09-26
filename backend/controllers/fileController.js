const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { uploadFile, deleteFile } = require('../services/cloudinaryService');
const Note = require('../models/Note');

const getMimeType = (filename, defaultMime = 'application/octet-stream') => {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (lower.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (lower.endsWith('.csv')) return 'text/csv; charset=utf-8';
  if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  if (lower.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.zip')) return 'application/zip';
  return defaultMime;
};

// @desc    Upload attachment file(s) to Cloudinary / storage
// @route   POST /api/files/upload
// @access  Private
const uploadFileController = async (req, res, next) => {
  try {
    const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one file to upload',
      });
    }

    // Upload all files concurrently to Cloudinary or local fallback
    const attachments = await Promise.all(
      files.map((file) => uploadFile(file, req.user.id))
    );

    res.status(200).json({
      success: true,
      message: `${attachments.length} file(s) uploaded successfully`,
      data: {
        attachments,
        attachment: attachments[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attachment from note & Cloudinary
// @route   DELETE /api/files/:noteId/:attachmentId
// @access  Private
const deleteAttachmentController = async (req, res, next) => {
  try {
    const { noteId, attachmentId } = req.params;

    // Verify note ownership
    const note = await Note.findOne({
      _id: noteId,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or permission denied',
      });
    }

    const attachment = note.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    // Delete file from Cloudinary/storage
    if (attachment.publicId) {
      try {
        await deleteFile(attachment.publicId, attachment.resourceType);
      } catch (err) {
        console.error('Error removing file from storage:', err.message);
      }
    }

    // Pull attachment from array
    note.attachments.pull({ _id: attachmentId });
    await note.save();

    res.status(200).json({
      success: true,
      message: 'Attachment removed successfully',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Preview file stream (inline)
// @route   GET /api/files/preview-stream
// @access  Private
const previewFileController = async (req, res, next) => {
  try {
    const { url, name } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL query parameter is required' });
    }

    const filename = name || path.basename(url);
    const mimeType = getMimeType(filename);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);

    if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
      const relativePath = url.includes('/uploads/') ? url.substring(url.indexOf('/uploads/')) : url;
      const localPath = path.join(__dirname, '..', relativePath);

      if (!fs.existsSync(localPath)) {
        return res.status(404).json({ success: false, message: 'Local file not found' });
      }

      return fs.createReadStream(localPath).pipe(res);
    }

    const streamRes = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    });

    streamRes.data.pipe(res);
  } catch (error) {
    console.error('File preview stream error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to stream preview file' });
    }
  }
};

// @desc    Download file stream (attachment)
// @route   GET /api/files/download-stream
// @access  Private
const downloadFileController = async (req, res, next) => {
  try {
    const { url, name } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL query parameter is required' });
    }

    const filename = name || path.basename(url);
    const mimeType = getMimeType(filename);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
      const relativePath = url.includes('/uploads/') ? url.substring(url.indexOf('/uploads/')) : url;
      const localPath = path.join(__dirname, '..', relativePath);

      if (!fs.existsSync(localPath)) {
        return res.status(404).json({ success: false, message: 'Local file not found' });
      }

      return fs.createReadStream(localPath).pipe(res);
    }

    const streamRes = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    });

    streamRes.data.pipe(res);
  } catch (error) {
    console.error('File download stream error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to download file' });
    }
  }
};

module.exports = {
  uploadFileController,
  deleteAttachmentController,
  previewFileController,
  downloadFileController,
};

