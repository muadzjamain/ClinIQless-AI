import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
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
  const { unreadCount, addNotification } = useNotifications();
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
  const toggleNotificationDropdown = () => {
    setNotificationDropdownOpen(prev => !prev);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Demo function to add a test notification
  const addTestNotification = () => {
    addNotification({
      title: 'Test Notification',
      message: 'This is a test notification added at ' + new Date().toLocaleTimeString(),
      type: 'info'
    });
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
        
        <div className="notifications" ref={notificationRef}>
          <button 
            className="notification-btn" 
            aria-label="Notifications"
            onClick={toggleNotificationDropdown}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          {notificationDropdownOpen && (
            <NotificationDropdown 
              isOpen={notificationDropdownOpen} 
              onClose={() => setNotificationDropdownOpen(false)} 
            />
          )}
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
