import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';

// Layout Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Main Pages
import Dashboard from './pages/Dashboard';
import VoiceAnalysis from './pages/VoiceAnalysis';
import HealthTracker from './pages/HealthTracker';
import DoctorAdvice from './pages/DoctorAdvice';
import Conversations from './pages/Conversations';
import Chatbot from './pages/Chatbot';
import SkinAnalysis from './pages/SkinAnalysis';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Styles
import './App.css';

function App() {
  const { currentUser, loading } = useAuth();
  const { theme } = useTheme();
  
  useEffect(() => {
    // Apply theme to body
    document.body.className = theme;
  }, [theme]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading ClinIQless AI...</p>
      </div>
    );
  }

  return (
    <div className={`app ${theme}`}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to="/" /> : <Register />} />
        <Route path="/forgot-password" element={currentUser ? <Navigate to="/" /> : <ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/voice-analysis" element={
            <ProtectedRoute>
              <VoiceAnalysis />
            </ProtectedRoute>
          } />
          
          <Route path="/health-tracker" element={
            <ProtectedRoute>
              <HealthTracker />
            </ProtectedRoute>
          } />
          
          <Route path="/doctor-advice" element={
            <ProtectedRoute>
              <DoctorAdvice />
            </ProtectedRoute>
          } />
          
          <Route path="/conversations" element={
            <ProtectedRoute>
              <Conversations />
            </ProtectedRoute>
          } />
          
          <Route path="/chatbot" element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          } />
          
          <Route path="/skin-analysis" element={
            <ProtectedRoute>
              <SkinAnalysis />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
