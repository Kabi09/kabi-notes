const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  resourceType: {
    type: String,
    default: 'raw',
  },
  format: {
    type: String,
  },
  size: {
    type: Number,
    default: 0,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Untitled Note',
    },
    content: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [attachmentSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for user notes sorting by pinned status and update time
noteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });
// Compound index for text search capability
noteSchema.index({ userId: 1, title: 'text', content: 'text', tags: 'text' });

const Note = mongoose.model('Note', noteSchema);
module.exports = Note;
