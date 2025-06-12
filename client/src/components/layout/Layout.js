import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useTheme } from '../../contexts/ThemeContext';
import './Layout.css';

/**
 * Main layout component for authenticated pages
 * Includes header, sidebar, content area, and footer
 */
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme } = useTheme();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`layout ${theme}`}>
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="layout-container">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
          <Outlet />
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export default Layout;
