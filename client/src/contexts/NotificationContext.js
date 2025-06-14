import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the notification context
const NotificationContext = createContext();

// Custom hook to use the notification context
export function useNotifications() {
  return useContext(NotificationContext);
}

// Provider component
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Load notifications from localStorage on mount
  useEffect(() => {
    // Force reset notifications for development (remove in production)
    localStorage.removeItem('notifications');
    console.log('Notifications reset in localStorage');
    
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
      }
    } else {
      // Initialize with mock notifications if none exist
      const initialNotifications = [
        {
          id: 1,
          title: 'Glucose Alert',
          message: 'Last time you checked your reading you were diabetic (13.4 mmol/L & 241 mg/dL). Want to recheck?',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          read: false,
          type: 'warning',
          navigateTo: '/voice-analysis'
        },
        {
          id: 2,
          title: 'Skin Condition Update',
          message: 'Your recent skin analysis shows signs of eczema. Check recommended treatments.',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          read: false,
          type: 'alert',
          navigateTo: '/skin-analysis'
        },
        {
          id: 3,
          title: 'Doctor Appointment',
          message: 'You have a scheduled follow-up with Dr. Sarah on June 20, 2025. Prepare your questions.',
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          read: false,
          type: 'reminder',
          navigateTo: '/doctor-advice'
        },
        {
          id: 4,
          title: 'Health Tip',
          message: 'Regular hydration helps improve skin condition and overall health.',
          timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          read: false,
          type: 'tip',
          navigateTo: null
        }
      ];
      setNotifications(initialNotifications);
      setUnreadCount(initialNotifications.length);
      localStorage.setItem('notifications', JSON.stringify(initialNotifications));
      console.log('Initial notifications set:', initialNotifications);
    }
  }, []);
  
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);
  
  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    return newNotification.id;
  };
  
  // Mark a notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };
  
  // Remove a notification
  const removeNotification = (id) => {
    const notification = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };
  
  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
