import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FaRobot, FaTimes, FaPaperPlane, FaMicrophone, FaStop } from 'react-icons/fa';
import './FloatingChatbot.css';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your health assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();
  const { theme } = useTheme();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send initial greeting when chat is first opened
      setTimeout(() => {
        setMessages([{ text: `Hello ${currentUser?.displayName || 'there'}! How can I assist you today?`, sender: 'bot' }]);
      }, 500);
    }
  }, [isOpen, messages.length, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

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
      let botResponse = "Hello Jamal! How can I assist you today?";
      
      const userMessage = inputValue.toLowerCase();
      
      if (userMessage.includes('hello') || userMessage.includes('hi')) {
        botResponse = `Hello ${currentUser?.displayName || 'there'}! How can I assist you today?`;
      } else if (userMessage.includes('glucose') || userMessage.includes('sugar')) {
        botResponse = "Based on your recent history, your glucose readings have been 5.2 mmol/L (94 mg/dL) on average for the past week, which is within the normal range. Your last reading from yesterday was 5.5 mmol/L.";
      } else if (userMessage.includes('doctor') || userMessage.includes('advice')) {
        botResponse = "Based on your history and the most recent doctor validation, your advice received a score of 92. The recommendation to drink water during a fever is accurate. Staying hydrated helps regulate body temperature and prevents dehydration.";
      } else if (userMessage.includes('health') || userMessage.includes('track') || userMessage.includes('tracker')) {
        botResponse = "We're currently working on the health tracker feature. It's not ready just yet, but it's coming soon.";
      } else if (userMessage.includes('thank') || userMessage.includes('thanks') || userMessage.includes('thank you')) {
        botResponse = "You're welcome! Is there anything else I can help you with?";
      } else if (userMessage.includes('yes')|| userMessage.includes('haah')) {
        botResponse = "Of course! How can I assist you today?";
      } else if (userMessage.includes('no')|| userMessage.includes('nope')|| userMessage.includes('nawh')) {
        botResponse = "Thank you! Have a great day!";
      }
      
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    }, 1000);
  };

  // Toggle voice conversation mode
  const toggleRecording = () => {
    if (isRecording) {
      // Stop voice conversation
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    } else {
      // Start voice conversation
      setIsRecording(true);
      simulateVoiceConversation();
    }
  };
  
  // Simulate continuous voice conversation
  const simulateVoiceConversation = () => {
    // Start the conversation timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        
        // Simulate user speaking and pausing at intervals
        if (newTime % 5 === 0) { // Every 5 seconds, simulate user finished speaking
          processVoiceInput(newTime);
        }
        
        return newTime;
      });
    }, 1000);
  };
  
  // Mock voice processing
  const processVoiceInput = (duration) => {
    // Simulate processing time
    setIsTyping(true);
    
    // Simulate user finished speaking
    setTimeout(() => {
      setIsTyping(false);
      
      // Mock recognized text based on conversation duration
      let recognizedText = "";
      const conversationStage = Math.floor(duration / 5) % 4;
      
      switch(conversationStage) {
        case 0:
          recognizedText = "Hello, how are you today?";
          break;
        case 1:
          recognizedText = "Can you tell me about my skin condition?";
          break;
        case 2:
          recognizedText = "What about my doctor's advice?";
          break;
        case 3:
          recognizedText = "Thank you for your help!";
          break;
        default:
          recognizedText = "Hello again";
      }
      
      // Add user's voice message
      setMessages(prev => [...prev, { text: recognizedText, sender: 'user', isVoice: true }]);
      
      // Process the recognized text
      handleVoiceResponse(recognizedText);
    }, 800);
  };
  
  // Handle response to voice input
  const handleVoiceResponse = (voiceText) => {
    // Simulate bot is typing
    setIsTyping(true);
    
    // Simulate bot response
    setTimeout(() => {
      setIsTyping(false);
      
      // Simple responses based on keywords
      let botResponse = "I'm sorry, I didn't catch that. Could you please try again?";
      
      const userMessage = voiceText.toLowerCase();
      
      if (userMessage.includes('hello') || userMessage.includes('hi')) {
        botResponse = `Hello ${currentUser?.displayName || 'there'}! How can I assist you today?`;
      } else if (userMessage.includes('skin')) {
        botResponse = "Based on your recent skin analysis, you have combination skin with mild sensitivity. Your skin hydration level is good, but you may want to consider using products for sensitive skin.";
      } else if (userMessage.includes('doctor') || userMessage.includes('advice')) {
        botResponse = "Based on your history and the most recent doctor validation, your advice received a score of 92. The recommendation to drink water during a fever is accurate. Staying hydrated helps regulate body temperature and prevents dehydration.";
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
                <div className={`message-bubble ${message.isVoice ? 'voice-message' : ''}`}>
                  {message.isVoice && <FaMicrophone className="voice-icon" />}
                  {message.text}
                </div>
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
          
          <div className="chatbot-input">
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                placeholder="Type your message..." 
                disabled={isRecording}
              />
              <button 
                type="button" 
                className={`voice-button ${isRecording ? 'recording' : ''}`} 
                onClick={toggleRecording}
                title={isRecording ? 'Stop voice conversation' : 'Start voice conversation'}
              >
                {isRecording ? <FaStop /> : <FaMicrophone />}
                {isRecording && <span className="recording-time">Listening...</span>}
              </button>
              <button type="submit" disabled={isRecording}>
                <FaPaperPlane />
              </button>
            </form>
          </div>
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
