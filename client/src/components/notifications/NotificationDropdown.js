import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { FaBell, FaCheck, FaTrash, FaCheckDouble } from 'react-icons/fa';
import './NotificationDropdown.css';

function NotificationDropdown({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearNotifications 
  } = useNotifications();

  // Format the timestamp to a relative time (e.g., "2 hours ago")
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'year' : 'years'} ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'month' : 'months'} ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'day' : 'days'} ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    return 'Just now';
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'info':
        return <span className="notification-type info">ℹ️</span>;
      case 'reminder':
        return <span className="notification-type reminder">🔔</span>;
      case 'tip':
        return <span className="notification-type tip">💡</span>;
      case 'warning':
        return <span className="notification-type warning">⚠️</span>;
      case 'alert':
        return <span className="notification-type alert">🚨</span>;
      default:
        return <span className="notification-type default">📌</span>;
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate if a destination is specified
    if (notification.navigateTo) {
      navigate(notification.navigateTo);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notifications</h3>
        <div className="notification-actions">
          <button 
            className="action-btn mark-all-read" 
            onClick={markAllAsRead}
            title="Mark all as read"
          >
            <FaCheckDouble />
          </button>
          <button 
            className="action-btn clear-all" 
            onClick={clearNotifications}
            title="Clear all notifications"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      
      <div className="notification-list">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.navigateTo ? 'clickable' : ''}`}
              onClick={() => notification.navigateTo && handleNotificationClick(notification)}
            >
              <div className="notification-content">
                {getNotificationIcon(notification.type)}
                <div className="notification-text">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatTimeAgo(notification.timestamp)}</div>
                </div>
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button 
                    className="action-btn mark-read" 
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <FaCheck />
                  </button>
                )}
                <button 
                  className="action-btn delete" 
                  onClick={() => removeNotification(notification.id)}
                  title="Remove notification"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <FaBell className="empty-icon" />
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
