import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

import AddIcon from '@mui/icons-material/Add';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';

const Sidebar = ({
  activeFilter,
  onFilterChange,
  activeTag,
  onTagSelect,
  tags = [],
  counts = {},
  isOpen,
  onCloseMobile,
}) => {
  const navigate = useNavigate();

  const handleNavClick = (filter) => {
    onFilterChange(filter);
    onTagSelect('');
    if (onCloseMobile) onCloseMobile();
  };

  const handleTagClick = (tag) => {
    if (activeTag === tag) {
      onTagSelect('');
    } else {
      onTagSelect(tag);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleNewNote = () => {
    navigate('/new-note');
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.createBtnContainer}>
        <button className={styles.newNoteBtn} onClick={handleNewNote}>
          <AddIcon />
          <span>New Note</span>
        </button>
      </div>

      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>Views</div>

        <button
          className={`${styles.navItem} ${
            activeFilter === 'all' && !activeTag ? styles.navItemActive : ''
          }`}
          onClick={() => handleNavClick('all')}
        >
          <div className={styles.navItemLeft}>
            <DescriptionOutlinedIcon fontSize="small" />
            <span>All Notes</span>
          </div>
          <span className={styles.countBadge}>{counts.all || 0}</span>
        </button>

        <button
          className={`${styles.navItem} ${
            activeFilter === 'pinned' ? styles.navItemActive : ''
          }`}
          onClick={() => handleNavClick('pinned')}
        >
          <div className={styles.navItemLeft}>
            <PushPinOutlinedIcon fontSize="small" />
            <span>Pinned</span>
          </div>
          <span className={styles.countBadge}>{counts.pinned || 0}</span>
        </button>

        <button
          className={`${styles.navItem} ${
            activeFilter === 'draft' ? styles.navItemActive : ''
          }`}
          onClick={() => handleNavClick('draft')}
        >
          <div className={styles.navItemLeft}>
            <EditNoteOutlinedIcon fontSize="small" />
            <span>Drafts</span>
          </div>
          <span className={styles.countBadge}>{counts.draft || 0}</span>
        </button>

        <button
          className={`${styles.navItem} ${
            activeFilter === 'archived' ? styles.navItemActive : ''
          }`}
          onClick={() => handleNavClick('archived')}
        >
          <div className={styles.navItemLeft}>
            <ArchiveOutlinedIcon fontSize="small" />
            <span>Archived</span>
          </div>
          <span className={styles.countBadge}>{counts.archived || 0}</span>
        </button>

        {tags.length > 0 && (
          <>
            <div className={styles.sectionTitle}>Tags</div>
            <div className={styles.tagsContainer}>
              {tags.map((tag) => (
                <button
                  key={tag}
                  className={`${styles.tagPill} ${
                    activeTag === tag ? styles.tagPillActive : ''
                  }`}
                  onClick={() => handleTagClick(tag)}
                >
                  <LocalOfferOutlinedIcon style={{ fontSize: 12 }} />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
