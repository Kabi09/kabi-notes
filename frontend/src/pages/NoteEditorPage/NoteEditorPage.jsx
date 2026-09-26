import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fetchNoteById, createNote, updateNote, deleteNote } from '../../services/notesApi';
import Navbar from '../../components/Navbar/Navbar';
import RichEditor from '../../components/RichEditor/RichEditor';
import FileAttachment from '../../components/FileAttachment/FileAttachment';
import Modal from '../../components/Modal/Modal';
import Toast from '../../components/Toast/Toast';
import styles from './NoteEditorPage.module.css';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PushPinIcon from '@mui/icons-material/PushPin';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const NoteEditorPage = () => {
  const { id } = useParams(); // If present, edit mode; else, new note mode
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [noteId, setNoteId] = useState(id || null);

  const [loading, setLoading] = useState(!!id);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [isNavigating, setIsNavigating] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const isLoadedRef = useRef(false);
  const autosaveTimerRef = useRef(null);

  // Handle Delete Note
  const handleDeleteNoteConfirm = async () => {
    if (!noteId) return;
    try {
      await deleteNote(noteId);
      setToast({ message: 'Note deleted successfully', type: 'success' });
      navigate('/dashboard');
    } catch (err) {
      console.error('Delete note error:', err);
      setToast({ message: 'Failed to delete note', type: 'error' });
    } finally {
      setDeleteModalOpen(false);
    }
  };

  // Keep a live mutable ref of editor values to avoid stale closures in handleBack
  const stateRef = useRef({
    title,
    content,
    tags,
    isPinned,
    attachments,
    noteId,
    saveStatus,
  });

  useEffect(() => {
    stateRef.current = {
      title,
      content,
      tags,
      isPinned,
      attachments,
      noteId,
      saveStatus,
    };
  }, [title, content, tags, isPinned, attachments, noteId, saveStatus]);

  // Load existing note data if editing
  useEffect(() => {
    if (id) {
      const loadNote = async () => {
        try {
          const res = await fetchNoteById(id);
          if (res.success && res.data?.note) {
            const n = res.data.note;
            setTitle(n.title || '');
            setContent(n.content || '');
            setTags(n.tags || []);
            setIsPinned(n.isPinned || false);
            setAttachments(n.attachments || []);
            setNoteId(n._id);
            isLoadedRef.current = true;
          }
        } catch (err) {
          console.error('Failed to load note:', err);
          setToast({ message: 'Failed to load note. Permission denied or note not found.', type: 'error' });
          setTimeout(() => navigate('/dashboard'), 2000);
        } finally {
          setLoading(false);
        }
      };
      loadNote();
    } else {
      isLoadedRef.current = true;
      setLoading(false);
    }
  }, [id, navigate]);

  // Utility to check if note contains meaningful user content
  const checkMeaningfulContent = (t, c, tg, att) => {
    const plainContent = DOMPurify.sanitize(c || '', { ALLOWED_TAGS: [] }).replace(/&nbsp;/g, ' ').trim();
    return t.trim() !== '' || plainContent !== '' || tg.length > 0 || att.length > 0;
  };

  // Save Note API function
  const executeSave = async (explicitSave = false, currentValues = null) => {
    const currentState = currentValues || stateRef.current;
    setSaveStatus('saving');

    const payload = {
      title: currentState.title.trim() || 'Untitled Note',
      content: currentState.content,
      tags: currentState.tags,
      isPinned: currentState.isPinned,
      attachments: currentState.attachments,
      status: explicitSave ? 'active' : 'draft',
    };

    try {
      if (currentState.noteId) {
        // Update existing note/draft
        const res = await updateNote(currentState.noteId, payload);
        if (res.success) {
          setSaveStatus('saved');
          return res.data.note;
        }
      } else {
        // Create initial note/draft
        const res = await createNote(payload);
        if (res.success && res.data?.note) {
          setNoteId(res.data.note._id);
          stateRef.current.noteId = res.data.note._id;
          setSaveStatus('saved');
          window.history.replaceState(null, '', `/notes/${res.data.note._id}`);
          return res.data.note;
        }
      }
    } catch (err) {
      console.error('Save note error:', err);
      setSaveStatus('unsaved');
      throw err;
    }
  };

  // Debounced Autosave Effect
  useEffect(() => {
    if (!isLoadedRef.current) return;

    const hasContent = checkMeaningfulContent(title, content, tags, attachments);

    // If it's a new note with no meaningful content, don't trigger auto-save yet
    if (!noteId && !hasContent) {
      return;
    }

    setSaveStatus('unsaved');

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      executeSave(false);
    }, 1500);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [title, content, tags, isPinned, attachments, noteId]);

  // Back Button Navigation Handler - Flushes any unsaved state before navigating
  const handleBack = async () => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    const currentState = stateRef.current;
    const hasContent = checkMeaningfulContent(
      currentState.title,
      currentState.content,
      currentState.tags,
      currentState.attachments
    );

    // Case 1: New note with no content -> simply navigate back without creating empty draft
    if (!currentState.noteId && !hasContent) {
      navigate('/dashboard');
      return;
    }

    // Case 2: Has content or is an existing note -> flush/save draft before navigating
    setIsNavigating(true);
    try {
      await executeSave(false);
    } catch (err) {
      console.error('Flush draft before back error:', err);
    } finally {
      navigate('/dashboard');
    }
  };

  // Explicit Save & Done Button
  const handleExplicitSave = async () => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    setIsNavigating(true);
    try {
      await executeSave(true);
      setToast({ message: 'Note saved successfully!', type: 'success' });
      navigate('/dashboard');
    } catch (err) {
      setIsNavigating(false);
      setToast({ message: 'Failed to save note. Please try again.', type: 'error' });
    }
  };

  // Add Tag
  const handleAddTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/#/g, '');
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput('');
    }
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Attachment add/delete handlers
  const handleAddAttachment = (newAtt) => {
    setAttachments((prev) => [...prev, newAtt]);
  };

  const handleDeleteAttachment = (attToDelete) => {
    setAttachments((prev) =>
      prev.filter((a) => a._id !== attToDelete._id && a.publicId !== attToDelete.publicId)
    );
  };

  if (loading) {
    return (
      <div className={styles.layoutContainer}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading note editor...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layoutContainer}>
      <Navbar />

      <main className={styles.contentArea}>
        <div className={styles.topHeader}>
          <button className={styles.backBtn} onClick={handleBack} disabled={isNavigating}>
            <ArrowBackIcon fontSize="small" />
            <span>{isNavigating ? 'Saving draft...' : 'Back to Notes'}</span>
          </button>

          <div className={styles.headerActions}>
            <div className={styles.saveStatus}>
              {saveStatus === 'saving' && (
                <span className={styles.savingBadge}>
                  <SyncIcon style={{ fontSize: 16, animation: 'spin 1s linear infinite' }} />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className={styles.savedBadge}>
                  <CheckCircleIcon style={{ fontSize: 16 }} />
                  Saved ✓
                </span>
              )}
              {saveStatus === 'unsaved' && <span>Unsaved changes...</span>}
            </div>

            {noteId && (
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteModalOpen(true)}
                disabled={isNavigating}
                title="Delete Note"
                style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
              >
                <DeleteOutlineIcon fontSize="small" />
                <span>Delete</span>
              </button>
            )}

            <button
              className="btn btn-primary"
              onClick={handleExplicitSave}
              disabled={isNavigating}
            >
              <SaveIcon fontSize="small" />
              <span>Save & Done</span>
            </button>
          </div>
        </div>

        <div className={styles.editorCard}>
          {/* Title Input */}
          <input
            type="text"
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
          />

          {/* Tags Section */}
          <div className={styles.tagsSection}>
            <div className={styles.tagsLabel}>
              <LocalOfferIcon style={{ fontSize: 16 }} />
              <span>Tags</span>
            </div>
            <div className={styles.tagsRow}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tagPill}>
                  #{tag}
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <CloseIcon style={{ fontSize: 14 }} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={styles.tagInput}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag + Enter"
              />
            </div>
          </div>

          {/* Pin Toggle */}
          <div className={styles.pinToggleRow}>
            <div className={styles.pinLabel}>
              <PushPinIcon fontSize="small" style={{ color: isPinned ? 'var(--pin-color)' : undefined }} />
              <span>Pin this note to top</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>

          {/* Rich Content Editor */}
          <RichEditor
            value={content}
            onChange={(val) => setContent(val)}
            placeholder="Write your note content here..."
          />

          {/* File Attachments */}
          <FileAttachment
            attachments={attachments}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        </div>
      </main>

      {/* Delete Note Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        title="Delete Note"
        onClose={() => setDeleteModalOpen(false)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteNoteConfirm}>
              Delete Permanently
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>"{title || 'Untitled Note'}"</strong>?
        </p>
        <p style={{ marginTop: '8px', color: 'var(--danger-color)', fontSize: '13px' }}>
          This will also delete all attached files permanently. This action cannot be undone.
        </p>
      </Modal>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default NoteEditorPage;
