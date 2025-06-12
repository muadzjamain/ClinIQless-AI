import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Auth.css';

function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    // Validate password strength
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    try {
      setError('');
      setLoading(true);
      await register(email, password, displayName);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to create an account. ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`auth-container ${theme}`}>
      <div className={`auth-card ${theme}`}>
        <div className="auth-header">
          <img src="/logo.png" alt="ClinIQless AI" className="auth-logo" />
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join ClinIQless AI for personalized health insights</p>
        </div>
        
        <div className="auth-body">
          {error && <div className="auth-alert error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="displayName" className="form-label">Full Name</label>
              <input
                type="text"
                id="displayName"
                className="form-control"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            
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
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            
            <div className="form-group">
              <div className="form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id="termsCheck" 
                  required 
                />
                <label className="form-check-label" htmlFor="termsCheck">
                  I agree to the <a href="/terms" className="auth-link">Terms of Service</a> and <a href="/privacy" className="auth-link">Privacy Policy</a>
                </label>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
