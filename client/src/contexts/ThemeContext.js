import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create context
const ThemeContext = createContext();

// Hook to use the theme context
export function useTheme() {
  return useContext(ThemeContext);
}

// Provider component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  
  // Load theme preference from user profile or localStorage
  useEffect(() => {
    if (userProfile && userProfile.preferences && userProfile.preferences.theme) {
      setTheme(userProfile.preferences.theme);
    } else {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, [userProfile]);
  
  // Toggle theme between light and dark
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Save to localStorage for non-authenticated users
    localStorage.setItem('theme', newTheme);
    
    // Save to user profile if authenticated
    if (currentUser && updateUserProfile) {
      try {
        await updateUserProfile({
          preferences: {
            ...(userProfile?.preferences || {}),
            theme: newTheme
          }
        });
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };
  
  const value = {
    theme,
    toggleTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
