import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaHeartbeat } from 'react-icons/fa';
import './HealthTracker.css';

function HealthTracker() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Multilingual labels
  const labels = {
    en: {
      title: 'Health Tracker',
      description: 'Monitor and track your health metrics over time',
      loading: 'Loading...',
      comingSoon: 'Full health tracking features coming soon!',
      dashboard: 'Dashboard',
      metrics: 'Add Metrics',
      history: 'History'
    },
    ms: {
      title: 'Penjejak Kesihatan',
      description: 'Pantau dan jejaki metrik kesihatan anda dari masa ke masa',
      loading: 'Memuatkan...',
      comingSoon: 'Ciri-ciri penjejakan kesihatan penuh akan datang tidak lama lagi!',
      dashboard: 'Papan Pemuka',
      metrics: 'Tambah Metrik',
      history: 'Sejarah'
    }
  };
  
  // Use the appropriate language
  const t = labels[userLanguage] || labels.en;
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FaHeartbeat className="title-icon" />
          {t.title}
        </h1>
        <p className="page-description">{t.description}</p>
      </div>
      
      <div className="tabs-container">
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            {t.dashboard}
          </div>
          <div 
            className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            {t.metrics}
          </div>
          <div 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            {t.history}
          </div>
        </div>
      </div>
      
      <div className={`metrics-form ${theme}`}>
        <div className="coming-soon">
          <p>{t.comingSoon}</p>
        </div>
      </div>
    </div>
  );
}

export default HealthTracker;
