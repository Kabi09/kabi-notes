const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Local uploads directory for fallback storage when Cloudinary keys are not provided
const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

/**
 * Upload file buffer or file path to Cloudinary (or local fallback)
 */
const uploadFile = async (file, userId) => {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      // Determine Cloudinary resource_type based on mime type
      let resourceType = 'auto';
      if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        resourceType = 'video';
      } else {
        resourceType = 'raw';
      }

      const folderPath = `notes-app/users/${userId}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            originalName: file.originalname,
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: result.resource_type,
            format: result.format || path.extname(file.originalname).replace('.', ''),
            size: file.size,
          });
        }
      );

      uploadStream.end(file.buffer);
    });
  } else {
    // Fallback: Local storage simulation
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    const filePath = path.join(LOCAL_UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, file.buffer);

    const publicId = `local_uploads/${filename}`;
    const url = `/uploads/${filename}`;

    return {
      originalName: file.originalname,
      publicId,
      url,
      resourceType: file.mimetype.startsWith('image/') ? 'image' : 'raw',
      format: ext.replace('.', ''),
      size: file.size,
    };
  }
};

/**
 * Delete file from Cloudinary (or local fallback)
 */
const deleteFile = async (publicId, resourceType = 'raw') => {
  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      throw error;
    }
  } else {
    // Local fallback deletion
    if (publicId.startsWith('local_uploads/')) {
      const filename = publicId.replace('local_uploads/', '');
      const filePath = path.join(LOCAL_UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return { result: 'ok' };
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};
