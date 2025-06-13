import React, { useState } from 'react';
import loginBg from '../../assets/LoginBG2.jpeg';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const containerStyle = {
    backgroundImage: `url(${loginBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div className={`auth-container ${theme}`} style={containerStyle}>
      <div className={`auth-card ${theme}`}>
        <div className="auth-header">
          <img 
            src="/assets/ClinIQLess_AI_Logo_NEW.jpeg" 
            alt="ClinIQless AI" 
            className="auth-logo" 
            style={{ 
              width: '250px', 
              height: '250px', 
              marginBottom: '1rem', 
              objectFit: 'contain' 
            }} 
          />

          <p className="auth-subtitle" style={{ fontSize: '1.2rem', marginBottom: '2rem', fontWeight: '500' }}>Sign in to your ClinIQless AI account</p>
        </div>
        
        <div className="auth-body">
          {error && <div className="auth-alert error">{error}</div>}
          
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
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            
            <div className="form-group text-right">
              <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
