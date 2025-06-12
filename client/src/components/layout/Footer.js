import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Footer.css';

function Footer() {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`app-footer ${theme}`}>
      <div className="footer-content">
        <div className="footer-section">
          <h4>ClinIQless AI</h4>
          <p>Your holistic health companion powered by AI</p>
        </div>
        
        <div className="footer-section">
          <h4>SDG Alignment</h4>
          <div className="sdg-info">
            <div className="sdg-item">
              <span className="sdg-badge sdg3">3</span>
              <span>Good Health and Well-being</span>
            </div>
            <div className="sdg-item">
              <span className="sdg-badge sdg9">9</span>
              <span>Industry, Innovation and Infrastructure</span>
            </div>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Features</h4>
          <ul className="footer-links">
            <li>Voice-based Diabetes Risk Prediction</li>
            <li>Personal Health Tracker</li>
            <li>Doctor Advice Reliability Tracker</li>
            <li>Conversation Recording & Summarization</li>
            <li>Multilingual Health Chatbot</li>
            <li>Skin Type Analysis</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} ClinIQless AI. All rights reserved.</p>
        <div className="footer-legal">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
