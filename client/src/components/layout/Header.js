import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

// Import icons
import { 
  FaBars, 
  FaUser, 
  FaSignOutAlt, 
  FaMoon, 
  FaSun, 
  FaBell 
} from 'react-icons/fa';

function Header({ toggleSidebar }) {
  const { currentUser, userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
  return (
    <header className={`app-header ${theme}`}>
      <div className="header-left">
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FaBars />
        </button>
        
        <Link to="/" className="logo">
          <img 
            src="/assets/ClinIQLess_AI_LogoOnly_NoBG.png" 
            alt="ClinIQless AI" 
            className="logo-img" 
          />
          <span className="logo-text">ClinIQless AI</span>
        </Link>
      </div>
      
      <div className="header-right">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
        
        <div className="notifications">
          <button className="notification-btn" aria-label="Notifications">
            <FaBell />
            <span className="notification-badge">3</span>
          </button>
        </div>
        
        {currentUser && (
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">
                {userProfile?.displayName || currentUser.displayName || 'User'}
              </span>
              <span className="user-email">{currentUser.email}</span>
            </div>
            
            <div className="user-dropdown">
              <Link to="/profile" className="dropdown-item">
                <FaUser /> Profile
              </Link>
              <button onClick={handleLogout} className="dropdown-item logout-btn">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
