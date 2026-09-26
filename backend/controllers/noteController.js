const Note = require('../models/Note');
const { deleteFile } = require('../services/cloudinaryService');

// @desc    Get all notes for authenticated user with search, filter, and sort
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res, next) => {
  try {
    const { search, tag, status, pinned, sort } = req.query;

    // STRICT USER ISOLATION FILTER
    const query = { userId: req.user.id };

    // Filter by status if provided (active, draft, archived)
    if (status && ['active', 'draft', 'archived'].includes(status)) {
      query.status = status;
    } else if (!status) {
      // Default: return active & draft notes (exclude archived unless requested)
      query.status = { $ne: 'archived' };
    }

    // Filter by pinned status
    if (pinned === 'true') {
      query.isPinned = true;
    } else if (pinned === 'false') {
      query.isPinned = false;
    }

    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Search query (Title, Content, or Tags)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Determine sorting logic
    let sortOptions = {};
    switch (sort) {
      case 'recentlyCreated':
        sortOptions = { isPinned: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { isPinned: -1, createdAt: 1 };
        break;
      case 'titleAsc':
        sortOptions = { isPinned: -1, title: 1 };
        break;
      case 'titleDesc':
        sortOptions = { isPinned: -1, title: -1 };
        break;
      case 'recentlyUpdated':
      default:
        sortOptions = { isPinned: -1, updatedAt: -1 };
        break;
    }

    const notes = await Note.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: notes.length,
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note by ID
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res, next) => {
  try {
    // Enforce ownership check: Note must match BOTH _id and userId
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to view it',
      });
    }

    res.status(200).json({
      success: true,
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res, next) => {
  try {
    const { title, content, status, isPinned, tags, attachments } = req.body;

    // Create note bound to req.user.id
    const note = await Note.create({
      userId: req.user.id,
      title: title || 'Untitled Note',
      content: content || '',
      status: status || 'active',
      isPinned: Boolean(isPinned),
      tags: Array.isArray(tags) ? tags : [],
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing note (or auto-save draft)
// @route   PATCH /api/notes/:id
// @access  Private
const updateNote = async (req, res, next) => {
  try {
    // Find note ensuring ownership
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to edit it',
      });
    }

    const { title, content, status, isPinned, tags, attachments } = req.body;

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (status !== undefined) note.status = status;
    if (isPinned !== undefined) note.isPinned = Boolean(isPinned);
    if (tags !== undefined && Array.isArray(tags)) note.tags = tags;
    if (attachments !== undefined && Array.isArray(attachments)) note.attachments = attachments;

    const updatedNote = await note.save();

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note: updatedNote },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pin status for a note
// @route   PATCH /api/notes/:id/pin
// @access  Private
const togglePinNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or permission denied',
      });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    res.status(200).json({
      success: true,
      message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a note and cleanup attachments
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or permission denied',
      });
    }

    // Delete attached files from Cloudinary/storage
    if (note.attachments && note.attachments.length > 0) {
      for (const attachment of note.attachments) {
        if (attachment.publicId) {
          try {
            await deleteFile(attachment.publicId, attachment.resourceType);
          } catch (delErr) {
            console.error(`Failed to delete file ${attachment.publicId}:`, delErr.message);
          }
        }
      }
    }

    await Note.deleteOne({ _id: note._id });

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  togglePinNote,
  deleteNote,
};
