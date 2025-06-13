import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './FloatingChatbot.css';
import { useAuth } from '../../contexts/AuthContext';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your health assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    setMessages([...messages, { text: inputValue, sender: 'user' }]);
    setInputValue('');
    
    // Simulate bot is typing
    setIsTyping(true);
    
    // Simulate bot response (replace with actual API call in production)
    setTimeout(() => {
      setIsTyping(false);
      
      // Simple responses based on keywords
      let botResponse = "I'm not sure how to help with that. Could you try asking something about health tracking, glucose levels, or medical advice?";
      
      const userMessage = inputValue.toLowerCase();
      
      if (userMessage.includes('hello') || userMessage.includes('hi')) {
        botResponse = `Hello ${currentUser?.displayName || 'there'}! How can I assist you today?`;
      } else if (userMessage.includes('glucose') || userMessage.includes('sugar')) {
        botResponse = "To check your glucose levels, you can use our Glucose Checker tool from the sidebar menu.";
      } else if (userMessage.includes('doctor') || userMessage.includes('appointment')) {
        botResponse = "You can find doctor advice and schedule appointments through our Doctor Advice section.";
      } else if (userMessage.includes('health') || userMessage.includes('track')) {
        botResponse = "Our Health Tracker can help you monitor various health metrics over time.";
      } else if (userMessage.includes('thank')) {
        botResponse = "You're welcome! Is there anything else I can help you with?";
      }
      
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    }, 1000);
  };

  return (
    <div className="floating-chatbot">
      {isOpen ? (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <FaRobot className="chatbot-icon" />
              <h3>Health Assistant</h3>
            </div>
            <button className="close-button" onClick={toggleChatbot}>
              <FaTimes />
            </button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <div className="message-bubble">{message.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="message-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type your message..."
            />
            <button type="submit" disabled={!inputValue.trim()}>
              <FaPaperPlane />
            </button>
          </form>
        </div>
      ) : (
        <button className="chatbot-button" onClick={toggleChatbot}>
          <FaRobot />
        </button>
      )}
    </div>
  );
};

export default FloatingChatbot;
