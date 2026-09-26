import React, { useEffect } from 'react';
import styles from './Toast.module.css';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const typeClass =
    type === 'success'
      ? styles.toastSuccess
      : type === 'error'
      ? styles.toastError
      : styles.toastInfo;

  const Icon =
    type === 'success'
      ? CheckCircleOutlineIcon
      : type === 'error'
      ? ErrorOutlineIcon
      : InfoOutlinedIcon;

  return (
    <div className={styles.toastContainer}>
      <div className={`${styles.toast} ${typeClass}`}>
        <div className={styles.toastContent}>
          <Icon fontSize="small" />
          <span>{message}</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close notification">
          <CloseIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
