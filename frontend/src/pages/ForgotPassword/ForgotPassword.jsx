import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordUser } from '../../services/authApi';
import styles from './ForgotPassword.module.css';
import Toast from '../../components/Toast/Toast';

import LockResetIcon from '@mui/icons-material/LockReset';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await forgotPasswordUser({ email });
      if (res.success) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const msg = err.response?.data?.message || 'Failed to request password reset';
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <div className={styles.logoIcon}>
            {submitted ? <MarkEmailReadIcon fontSize="large" /> : <LockResetIcon fontSize="large" />}
          </div>
          <h1 className={styles.title}>{submitted ? 'Check Your Email' : 'Forgot Password?'}</h1>
          <p className={styles.subtitle}>
            {submitted
              ? `We have sent password reset instructions to ${email}. Please check your inbox or spam folder.`
              : 'Enter your registered email address below and we will send you a password reset link.'}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                className="input-field"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
              />
              {error && <span className={styles.errorText}>{error}</span>}
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Back to Login
            </Link>
          </div>
        )}

        <p className={styles.footerText}>
          Remember your password? <Link to="/login">Log In</Link>
        </p>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default ForgotPassword;
