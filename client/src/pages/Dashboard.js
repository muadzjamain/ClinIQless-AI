import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import './Dashboard.css';

// Import icons
import { 
  FaMicrophone, 
  FaHeartbeat, 
  FaUserMd, 
  FaComments, /* Still needed for Recent Conversations section */
  FaCamera,
  FaChartLine,
  FaCalendarAlt,
  FaBell,
  FaStar,
  FaArrowUp,
  FaShieldAlt
} from 'react-icons/fa';

function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [healthData, setHealthData] = useState(null);
  const [voiceAnalyses, setVoiceAnalyses] = useState([]);
  const [doctorAdvice, setDoctorAdvice] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const db = getFirestore();
  
  // Fetch user's data for dashboard
  useEffect(() => {
    async function fetchDashboardData() {
      if (!currentUser) return;
      
      try {
        // Fetch latest health data
        const healthQuery = query(
          collection(db, 'healthData'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const healthSnapshot = await getDocs(healthQuery);
        if (!healthSnapshot.empty) {
          setHealthData(healthSnapshot.docs[0].data());
        }
        
        // Fetch recent voice analyses
        const voiceQuery = query(
          collection(db, 'voiceAnalyses'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        const voiceSnapshot = await getDocs(voiceQuery);
        setVoiceAnalyses(voiceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
        
        // Fetch recent doctor advice
        const adviceQuery = query(
          collection(db, 'doctorAdvice'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        const adviceSnapshot = await getDocs(adviceQuery);
        setDoctorAdvice(adviceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
        
        // Fetch recent conversations
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        const conversationsSnapshot = await getDocs(conversationsQuery);
        setConversations(conversationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [currentUser, db]);
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Multilingual dashboard labels
  const dashboardLabels = {
    en: {
      welcome: 'Welcome',
      dashboard: 'Dashboard',
      healthSummary: 'Health Summary',
      recentVoiceAnalyses: 'Recent Voice Analyses',
      recentDoctorAdvice: 'Recent Doctor Advice',
      recentConversations: 'Recent Conversations',
      quickActions: 'Quick Actions',
      newVoiceAnalysis: 'Check your Glucose Levels',
      trackHealth: 'Track Health',
      addDoctorAdvice: 'Validate Doctor Advice',
      recordConversation: 'Record Conversation',
      chatWithAI: 'Chat with AI',
      analyzeSkin: 'Analyze Skin',
      viewAll: 'View All',
      noData: 'No data available',
      loading: 'Loading...',
      upcomingReminders: 'Upcoming Reminders',
      noReminders: 'No upcoming reminders'
    },
    ms: {
      welcome: 'Selamat Datang',
      dashboard: 'Papan Pemuka',
      healthSummary: 'Ringkasan Kesihatan',
      recentVoiceAnalyses: 'Analisis Suara Terkini',
      recentDoctorAdvice: 'Nasihat Doktor Terkini',
      recentConversations: 'Perbualan Terkini',
      quickActions: 'Tindakan Cepat',
      newVoiceAnalysis: 'Periksa Tahap Glukosa Anda',
      trackHealth: 'Jejak Kesihatan',
      addDoctorAdvice: 'Sahkan Nasihat Doktor',
      recordConversation: 'Rekod Perbualan',
      chatWithAI: 'Bual dengan AI',
      analyzeSkin: 'Analisis Kulit',
      viewAll: 'Lihat Semua',
      noData: 'Tiada data tersedia',
      loading: 'Memuatkan...',
      upcomingReminders: 'Peringatan Akan Datang',
      noReminders: 'Tiada peringatan akan datang'
    }
  };
  
  // Use the appropriate language labels
  const labels = dashboardLabels[userLanguage] || dashboardLabels.en;
  
  // Format date function
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return new Intl.DateTimeFormat(userLanguage === 'ms' ? 'ms-MY' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="page-container dashboard-container">
      {/* Enhanced Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <div className="welcome-text">
            <h1 className="welcome-title">
              {labels.welcome}, {userProfile?.displayName || currentUser?.displayName || 'User'}! 👋
            </h1>
            <p className="welcome-subtitle">
              Here's your health overview for todays
            </p>
          </div>
          <div className="welcome-stats">
            <div className="stat-card">
              <FaArrowUp className="stat-icon" />
              <div className="stat-info">
                <span className="stat-number">95%</span>
                <span className="stat-label">Health Score</span>
              </div>
            </div>
            <div className="stat-card">
              <FaShieldAlt className="stat-icon" />
              <div className="stat-info">
                <span className="stat-number">12</span>
                <span className="stat-label">Days Active</span>
              </div>
            </div>
            <div className="stat-card">
              <FaStar className="stat-icon" />
              <div className="stat-info">
                <span className="stat-number">4.8</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p className="loading-text">{labels.loading}</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Enhanced Health Summary Widget */}
          <div className={`widget health-widget ${theme}`}>
            <div className="widget-header">
              <h2 className="widget-title">
                <FaHeartbeat className="widget-icon" />
                {labels.healthSummary}
              </h2>
              <div className="widget-actions">
                <Link to="/health-tracker" className="btn btn-outline btn-sm">
                  View Details
                </Link>
              </div>
            </div>
            <div className="widget-body">
              {healthData ? (
                <div className="health-summary">
                  <div className="health-metrics-grid">
                    <div className="health-metric-card">
                      <div className="metric-icon">
                        <FaHeartbeat />
                      </div>
                      <div className="metric-content">
                        <span className="metric-label">Blood Pressure</span>
                        <span className="metric-value">{healthData.bloodPressure || '120/80'}</span>
                        <span className="metric-status normal">Normal</span>
                      </div>
                    </div>
                    <div className="health-metric-card">
                      <div className="metric-icon">
                        <FaChartLine />
                      </div>
                      <div className="metric-content">
                        <span className="metric-label">Heart Rate</span>
                        <span className="metric-value">{healthData.heartRate || '72'} bpm</span>
                        <span className="metric-status normal">Normal</span>
                      </div>
                    </div>
                    <div className="health-metric-card">
                      <div className="metric-icon">
                        <FaArrowUp />
                      </div>
                      <div className="metric-content">
                        <span className="metric-label">Activity Level</span>
                        <span className="metric-value">High</span>
                        <span className="metric-status good">Excellent</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-data-state">
                  <FaHeartbeat className="no-data-icon" />
                  <p className="no-data-text">{labels.noData}</p>
                  <Link to="/health-tracker" className="btn btn-primary">
                    Start Tracking
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Recent Voice Analyses */}
            <div className={`widget ${theme}`}>
              <div className="widget-header">
                <h2 className="widget-title">
                  <FaMicrophone className="widget-icon" />
                  {labels.recentVoiceAnalyses}
                </h2>
              </div>
              <div className="widget-body">
                {voiceAnalyses.length > 0 ? (
                  <ul className="dashboard-list">
                    {voiceAnalyses.map(analysis => (
                      <li key={analysis.id} className="dashboard-list-item">
                        <div className="list-item-icon">
                          <FaMicrophone />
                        </div>
                        <div className="list-item-content">
                          <h4>{analysis.title || 'Voice Analysis'}</h4>
                          <p>Risk Score: {analysis.riskScore || 'N/A'}</p>
                          <span className="list-item-date">{formatDate(analysis.timestamp)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-data">{labels.noData}</div>
                )}
              </div>
              <div className="widget-footer">
                <Link to="/voice-analysis" className="btn btn-outline-primary btn-sm">
                  {labels.viewAll}
                </Link>
              </div>
            </div>
            
            {/* Recent Doctor Advice */}
            <div className={`widget ${theme}`}>
              <div className="widget-header">
                <h2 className="widget-title">
                  <FaUserMd className="widget-icon" />
                  {labels.recentDoctorAdvice}
                </h2>
              </div>
              <div className="widget-body">
                {doctorAdvice.length > 0 ? (
                  <ul className="dashboard-list">
                    {doctorAdvice.map(advice => (
                      <li key={advice.id} className="dashboard-list-item">
                        <div className="list-item-icon">
                          <FaUserMd />
                        </div>
                        <div className="list-item-content">
                          <h4>{advice.doctorName || 'Doctor'}</h4>
                          <p>{advice.advice.substring(0, 60)}...</p>
                          <div className="advice-reliability">
                            <span className={`reliability-badge ${advice.reliabilityScore >= 70 ? 'high' : advice.reliabilityScore >= 40 ? 'medium' : 'low'}`}>
                              {advice.reliabilityScore}%
                            </span>
                            <span>Reliability</span>
                          </div>
                          <span className="list-item-date">{formatDate(advice.timestamp)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-data">{labels.noData}</div>
                )}
              </div>
              <div className="widget-footer">
                <Link to="/doctor-advice" className="btn btn-outline-primary btn-sm">
                  {labels.viewAll}
                </Link>
              </div>
            </div>
            
            {/* Recent Conversations */}
            <div className={`widget ${theme}`}>
              <div className="widget-header">
                <h2 className="widget-title">
                  <FaComments className="widget-icon" />
                  {labels.recentConversations}
                </h2>
              </div>
              <div className="widget-body">
                {conversations.length > 0 ? (
                  <ul className="dashboard-list">
                    {conversations.map(conversation => (
                      <li key={conversation.id} className="dashboard-list-item">
                        <div className="list-item-icon">
                          <FaComments />
                        </div>
                        <div className="list-item-content">
                          <h4>{conversation.title || 'Conversation'}</h4>
                          <p>{conversation.summary ? conversation.summary.substring(0, 60) + '...' : 'Processing...'}</p>
                          <span className="list-item-date">{formatDate(conversation.timestamp)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-data">{labels.noData}</div>
                )}
              </div>
              <div className="widget-footer">
                <Link to="/conversations" className="btn btn-outline-primary btn-sm">
                  {labels.viewAll}
                </Link>
              </div>
            </div>
            
            {/* Upcoming Reminders */}
            <div className={`widget ${theme}`}>
              <div className="widget-header">
                <h2 className="widget-title">
                  <FaBell className="widget-icon" />
                  {labels.upcomingReminders}
                </h2>
              </div>
              <div className="widget-body">
                <div className="reminders-list">
                  <div className="reminder-item">
                    <div className="reminder-icon">
                      <FaCalendarAlt />
                    </div>
                    <div className="reminder-content">
                      <h4>Doctor Appointment</h4>
                      <p>Dr. Sarah Lee - General Checkup</p>
                      <span className="reminder-date">Tomorrow, 10:00 AM</span>
                    </div>
                  </div>
                  <div className="reminder-item">
                    <div className="reminder-icon">
                      <FaHeartbeat />
                    </div>
                    <div className="reminder-content">
                      <h4>Blood Pressure Check</h4>
                      <p>Regular monitoring</p>
                      <span className="reminder-date">Today, 8:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="widget-footer">
                <Link to="/health-tracker" className="btn btn-outline-primary btn-sm">
                  Manage Reminders
                </Link>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2 className="section-title">{labels.quickActions}</h2>
            <div className="quick-actions">
              <Link to="/voice-analysis" className="quick-action-card">
                <div className="quick-action-icon">
                  <FaMicrophone />
                </div>
                <span>{labels.newVoiceAnalysis}</span>
              </Link>
              
              <Link to="/health-tracker" className="quick-action-card">
                <div className="quick-action-icon">
                  <FaHeartbeat />
                </div>
                <span>{labels.trackHealth}</span>
              </Link>
              
              <Link to="/doctor-advice" className="quick-action-card">
                <div className="quick-action-icon">
                  <FaUserMd />
                </div>
                <span>{labels.addDoctorAdvice}</span>
              </Link>
              
              <Link to="/skin-analysis" className="quick-action-card">
                <div className="quick-action-icon">
                  <FaCamera />
                </div>
                <span>{labels.analyzeSkin}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
