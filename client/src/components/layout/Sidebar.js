import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Sidebar.css';

// Import icons
import { 
  FaHome, 
  FaMicrophone, 
  FaHeartbeat, 
  FaUserMd, 
  FaCamera,
  FaUser,
  FaLanguage
} from 'react-icons/fa';

function Sidebar({ isOpen }) {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  
  // Get user language preference
  const userLanguage = userProfile?.language || 'en';
  
  // Multilingual menu labels
  const menuLabels = {
    en: {
      dashboard: 'Dashboard',
      voiceAnalysis: 'Glucose Checker',
      healthTracker: 'Health Tracker',
      doctorAdvice: 'Doctor Advice',
      conversations: 'Conversations',
      chatbot: 'Health Chatbot',
      skinAnalysis: 'Skin Analysis',
      profile: 'Profile'
    },
    ms: {
      dashboard: 'Papan Pemuka',
      voiceAnalysis: 'Pemeriksa Glukosa',
      healthTracker: 'Penjejak Kesihatan',
      doctorAdvice: 'Nasihat Doktor',
      conversations: 'Perbualan',
      chatbot: 'Bot Kesihatan',
      skinAnalysis: 'Analisis Kulit',
      profile: 'Profil'
    }
  };
  
  // Use the appropriate language labels
  const labels = menuLabels[userLanguage] || menuLabels.en;
  
  return (
    <aside className={`sidebar ${theme} ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-language">
        <FaLanguage />
        <select 
          className="language-selector" 
          defaultValue={userLanguage}
          onChange={(e) => {
            // This would be handled by updating user profile
            console.log('Language changed to:', e.target.value);
          }}
        >
          <option value="en">English</option>
          <option value="ms">Bahasa Melayu</option>
        </select>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'active' : ''}
              end
            >
              <FaHome className="nav-icon" />
              <span className="nav-text">{labels.dashboard}</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/health-tracker" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaHeartbeat className="nav-icon" />
              <span className="nav-text">
                {labels.healthTracker}
                <span className="coming-soon-badge">Coming Soon</span>
              </span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/doctor-advice" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaUserMd className="nav-icon" />
              <span className="nav-text">{labels.doctorAdvice}</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/voice-analysis" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaMicrophone className="nav-icon" />
              <span className="nav-text">{labels.voiceAnalysis}</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/skin-analysis" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaCamera className="nav-icon" />
              <span className="nav-text">{labels.skinAnalysis}</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <FaUser className="nav-icon" />
              <span className="nav-text">{labels.profile}</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="sdg-badges">
          <img src="/sdg3.png" alt="SDG 3: Good Health and Well-being" title="SDG 3: Good Health and Well-being" />
          <img src="/sdg9.png" alt="SDG 9: Industry, Innovation and Infrastructure" title="SDG 9: Industry, Innovation and Infrastructure" />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
