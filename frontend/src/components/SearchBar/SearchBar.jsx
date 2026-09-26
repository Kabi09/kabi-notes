import React from 'react';
import styles from './SearchBar.module.css';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const SearchBar = ({ value, onChange, placeholder = 'Search notes by title, content, or tags...' }) => {
  return (
    <div className={styles.searchWrapper}>
      <SearchIcon className={styles.searchIcon} fontSize="small" />
      <input
        type="text"
        className={styles.searchInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className={styles.clearIcon}
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <CloseIcon fontSize="small" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
