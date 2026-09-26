import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNotes, togglePinNote, deleteNote } from '../../services/notesApi';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import NoteCard from '../../components/NoteCard/NoteCard';
import SearchBar from '../../components/SearchBar/SearchBar';
import Modal from '../../components/Modal/Modal';
import Toast from '../../components/Toast/Toast';
import styles from './Dashboard.module.css';

import AddIcon from '@mui/icons-material/Add';
import PushPinIcon from '@mui/icons-material/PushPin';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, pinned, draft, archived
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('recentlyUpdated');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal delete confirmation state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    noteId: null,
    noteTitle: '',
  });

  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        sort: sortBy,
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedTag) params.tag = selectedTag;

      if (filter === 'pinned') params.pinned = 'true';
      if (filter === 'draft') params.status = 'draft';
      if (filter === 'archived') params.status = 'archived';
      // When filter === 'all', params.status is omitted so backend returns both active and draft notes

      const res = await fetchNotes(params);
      if (res.success && res.data) {
        setNotes(res.data.notes || []);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      setToast({ message: 'Failed to load notes. Please refresh.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filter, selectedTag, sortBy]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Handle Pin Toggle
  const handleTogglePin = async (id) => {
    try {
      const res = await togglePinNote(id);
      if (res.success) {
        setNotes((prevNotes) =>
          prevNotes.map((n) => (n._id === id ? res.data.note : n))
        );
        const isPinnedNow = res.data.note.isPinned;
        setToast({
          message: `Note ${isPinnedNow ? 'pinned' : 'unpinned'}`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Pin toggle error:', err);
      setToast({ message: 'Failed to pin note', type: 'error' });
    }
  };

  // Confirm delete modal trigger
  const triggerDeleteConfirm = (id, title) => {
    setDeleteModal({
      isOpen: true,
      noteId: id,
      noteTitle: title || 'Untitled Note',
    });
  };

  // Execute delete note
  const confirmDelete = async () => {
    if (!deleteModal.noteId) return;
    try {
      const res = await deleteNote(deleteModal.noteId);
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n._id !== deleteModal.noteId));
        setToast({ message: 'Note deleted successfully', type: 'success' });
      }
    } catch (err) {
      console.error('Delete note error:', err);
      setToast({ message: 'Failed to delete note', type: 'error' });
    } finally {
      setDeleteModal({ isOpen: false, noteId: null, noteTitle: '' });
    }
  };

  // Extract unique tags and count metrics
  const uniqueTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));
  const counts = {
    all: notes.length,
    pinned: notes.filter((n) => n.isPinned).length,
    draft: notes.filter((n) => n.status === 'draft').length,
    archived: notes.filter((n) => n.status === 'archived').length,
  };

  // Separate pinned and unpinned notes for rendering
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  return (
    <div className={styles.layoutContainer}>
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className={styles.mainWrapper}>
        <Sidebar
          activeFilter={filter}
          onFilterChange={(f) => setFilter(f)}
          activeTag={selectedTag}
          onTagSelect={(t) => setSelectedTag(t)}
          tags={uniqueTags}
          counts={counts}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <main className={styles.contentArea}>
          <div className={styles.topBar}>
            <SearchBar value={searchQuery} onChange={(q) => setSearchQuery(q)} />

            <div className={styles.controlsRight}>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recentlyUpdated">Recently Updated</option>
                <option value="recentlyCreated">Recently Created</option>
                <option value="oldest">Oldest</option>
                <option value="titleAsc">Title A-Z</option>
                <option value="titleDesc">Title Z-A</option>
              </select>

              <button className="btn btn-primary" onClick={() => navigate('/new-note')}>
                <AddIcon />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.notesGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className={styles.emptyState}>
              {searchQuery ? (
                <>
                  <SearchOffIcon className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No notes found</h3>
                  <p className={styles.emptySubtitle}>
                    No notes matched your query "{searchQuery}". Try a different keyword or clear the search.
                  </p>
                  <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <NoteAddOutlinedIcon className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No notes yet</h3>
                  <p className={styles.emptySubtitle}>
                    Create your first note and start organizing your ideas, documents, and files.
                  </p>
                  <button className="btn btn-primary" onClick={() => navigate('/new-note')}>
                    <AddIcon />
                    <span>Create Note</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Pinned Notes Section */}
              {pinnedNotes.length > 0 && (
                <div>
                  <h3 className={styles.sectionHeading}>
                    <PushPinIcon className={styles.sectionHeadingIcon} fontSize="small" />
                    Pinned Notes ({pinnedNotes.length})
                  </h3>
                  <div className={styles.notesGrid}>
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note._id}
                        note={note}
                        onTogglePin={handleTogglePin}
                        onDelete={triggerDeleteConfirm}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Notes Section */}
              {otherNotes.length > 0 && (
                <div>
                  {pinnedNotes.length > 0 && (
                    <h3 className={styles.sectionHeading}>Other Notes ({otherNotes.length})</h3>
                  )}
                  <div className={styles.notesGrid}>
                    {otherNotes.map((note) => (
                      <NoteCard
                        key={note._id}
                        note={note}
                        onTogglePin={handleTogglePin}
                        onDelete={triggerDeleteConfirm}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete Note"
        onClose={() => setDeleteModal({ isOpen: false, noteId: null, noteTitle: '' })}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setDeleteModal({ isOpen: false, noteId: null, noteTitle: '' })}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmDelete}>
              Delete Permanently
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>"{deleteModal.noteTitle}"</strong>?
        </p>
        <p style={{ marginTop: '8px', color: 'var(--danger-color)', fontSize: '13px' }}>
          This will also delete all attached files permanently. This action cannot be undone.
        </p>
      </Modal>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default Dashboard;
