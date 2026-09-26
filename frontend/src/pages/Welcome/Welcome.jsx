import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Welcome.module.css';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LogoutIcon from '@mui/icons-material/Logout';

const Welcome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.welcomePage}>
      <div className={styles.welcomeCard}>
        <div className={styles.avatarCircle}>{getInitials(user?.name)}</div>
        <h1 className={styles.title}>Welcome, {user?.name || 'User'} 👋</h1>
        <p className={styles.subtitle}>
          You are successfully logged in. Your personal cloud workspace is ready.
        </p>

        <div className={styles.btnGroup}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/dashboard')}
            style={{ width: '100%', padding: '12px' }}
          >
            <span>Open Notes</span>
            <ArrowForwardIcon fontSize="small" />
          </button>
          <button
            className="btn btn-outline"
            onClick={handleLogout}
            style={{ width: '100%', padding: '12px' }}
          >
            <LogoutIcon fontSize="small" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
