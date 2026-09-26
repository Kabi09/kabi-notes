import React from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import styles from './NoteCard.module.css';

import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const NoteCard = ({ note, onTogglePin, onDelete }) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Prevent navigation if clicking direct action buttons
    if (e.target.closest('button')) return;
    navigate(`/notes/${note._id}`);
  };

  const handlePin = (e) => {
    e.stopPropagation();
    onTogglePin(note._id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(note._id, note.title);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/notes/${note._id}`);
  };

  // Strip HTML tags for clean card text preview snippet
  const getPlainText = (html) => {
    if (!html) return '';
    const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
    return clean.replace(/&nbsp;/g, ' ').trim();
  };

  const isImage = (filename) => {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(filename || '');
  };

  const imageAttachments = (note.attachments || []).filter((a) => isImage(a.originalName));

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} mins ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    if (diffSeconds < 172800) return 'Yesterday';

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div
      className={`${styles.card} ${note.isPinned ? styles.pinnedCard : ''}`}
      onClick={handleCardClick}
    >
      <div className={styles.header}>
        <h4 className={styles.title}>{note.title || 'Untitled Note'}</h4>
        <div className={styles.headerRight}>
          <button
            className={`${styles.pinBtn} ${note.isPinned ? styles.pinBtnActive : ''}`}
            onClick={handlePin}
            title={note.isPinned ? 'Unpin Note' : 'Pin Note'}
            aria-label="Pin Note"
          >
            {note.isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
          </button>
        </div>
      </div>

      <div className={styles.contentSnippet}>
        {getPlainText(note.content) || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Empty note</span>}
      </div>

      {imageAttachments.length > 0 && (
        <div className={styles.imagePreviewRow}>
          {imageAttachments.slice(0, 3).map((img, i) => (
            <img
              key={img._id || i}
              src={img.url}
              alt={img.originalName}
              className={styles.cardThumbImg}
              title={img.originalName}
            />
          ))}
        </div>
      )}

      {(note.tags?.length > 0 || note.status === 'draft') && (
        <div className={styles.tagsRow}>
          {note.status === 'draft' && <span className={styles.draftBadge}>Draft</span>}
          {note.tags?.map((tag) => (
            <span key={tag} className={styles.tagPill}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <span>{formatDate(note.updatedAt || note.createdAt)}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {note.attachments?.length > 0 && (
            <div className={styles.attachmentBadge} title={`${note.attachments.length} attachment(s)`}>
              <AttachFileIcon style={{ fontSize: 16 }} />
              <span>{note.attachments.length}</span>
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={handleEdit}
              title="Edit Note"
              aria-label="Edit Note"
            >
              <EditOutlinedIcon fontSize="small" />
            </button>
            <button
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={handleDelete}
              title="Delete Note"
              aria-label="Delete Note"
            >
              <DeleteOutlineIcon fontSize="small" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
