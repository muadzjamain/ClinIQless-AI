import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { theme } = useTheme();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your email inbox for password reset instructions');
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to reset password. Please check your email address.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`auth-container ${theme}`}>
      <div className={`auth-card ${theme}`}>
        <div className="auth-header">
          <img src="/logo.png" alt="ClinIQless AI" className="auth-logo" />
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your email to receive reset instructions</p>
        </div>
        
        <div className="auth-body">
          {error && <div className="auth-alert error">{error}</div>}
          {message && <div className="auth-alert success">{message}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Reset Password'}
            </button>
          </form>
        </div>
        
        <div className="auth-footer">
          <p>Remember your password? <Link to="/login" className="auth-link">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
