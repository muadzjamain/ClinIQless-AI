import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { FaRobot, FaPaperPlane, FaUser, FaInfoCircle } from 'react-icons/fa';
import './Chatbot.css';

function Chatbot() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);
  
  const db = getFirestore();
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Multilingual labels
  const labels = {
    en: {
      title: 'AI Health Assistant',
      description: 'Chat with our AI health assistant for health advice and information',
      placeholder: 'Type your health question here...',
      send: 'Send',
      loading: 'Loading conversation history...',
      noMessages: 'No messages yet. Start a conversation!',
      thinking: 'AI is thinking...',
      disclaimer: 'This AI assistant provides general health information only. Always consult with a healthcare professional for medical advice.',
      welcomeMessage: 'Hello! I\'m your AI health assistant. How can I help you today?',
      examples: 'Examples:',
      exampleQuestions: [
        'What are common symptoms of the flu?',
        'How can I improve my sleep quality?',
        'What foods are good for heart health?',
        'How much exercise is recommended weekly?'
      ]
    },
    ms: {
      title: 'Pembantu Kesihatan AI',
      description: 'Berbual dengan pembantu kesihatan AI kami untuk mendapatkan nasihat dan maklumat kesihatan',
      placeholder: 'Taip soalan kesihatan anda di sini...',
      send: 'Hantar',
      loading: 'Memuatkan sejarah perbualan...',
      noMessages: 'Tiada mesej lagi. Mulakan perbualan!',
      thinking: 'AI sedang berfikir...',
      disclaimer: 'Pembantu AI ini hanya menyediakan maklumat kesihatan umum. Sentiasa rujuk kepada profesional kesihatan untuk nasihat perubatan.',
      welcomeMessage: 'Halo! Saya pembantu kesihatan AI anda. Bagaimana saya boleh membantu anda hari ini?',
      examples: 'Contoh:',
      exampleQuestions: [
        'Apakah gejala biasa selesema?',
        'Bagaimana saya boleh meningkatkan kualiti tidur saya?',
        'Makanan apa yang baik untuk kesihatan jantung?',
        'Berapa banyak senaman yang disyorkan setiap minggu?'
      ]
    }
  };
  
  // Use the appropriate language
  const t = labels[userLanguage] || labels.en;
  
  // Fetch chat history
  useEffect(() => {
    async function fetchChatHistory() {
      if (!currentUser) return;
      
      try {
        const chatQuery = query(
          collection(db, 'chatMessages'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'asc')
        );
        
        const chatSnapshot = await getDocs(chatQuery);
        const messages = chatSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (messages.length > 0) {
          setChatHistory(messages);
        } else {
          // Add welcome message if no chat history
          setChatHistory([
            {
              id: 'welcome',
              text: t.welcomeMessage,
              sender: 'ai',
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchChatHistory();
  }, [currentUser, db, t.welcomeMessage]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || sending) return;
    
    const userMessage = {
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Add user message to chat
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setSending(true);
    
    try {
      // Save user message to Firestore
      await addDoc(collection(db, 'chatMessages'), {
        ...userMessage,
        userId: currentUser.uid
      });
      
      // Add "thinking" message
      setChatHistory(prev => [
        ...prev, 
        { id: 'thinking', text: t.thinking, sender: 'ai', isThinking: true }
      ]);
      
      // Simulate AI response after a delay
      setTimeout(async () => {
        // Generate AI response based on user message
        const aiResponse = await generateAIResponse(userMessage.text);
        
        // Remove thinking message and add AI response
        setChatHistory(prev => 
          prev.filter(msg => msg.id !== 'thinking').concat({
            text: aiResponse,
            sender: 'ai',
            timestamp: new Date()
          })
        );
        
        // Save AI response to Firestore
        await addDoc(collection(db, 'chatMessages'), {
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
          userId: currentUser.uid
        });
        
        setSending(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setSending(false);
    }
  };
  
  // Simulate AI response generation
  const generateAIResponse = async (userMessage) => {
    // In a real implementation, this would call an AI API
    // For demo purposes, we'll use some predefined responses
    
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (lowerCaseMessage.includes('flu') || lowerCaseMessage.includes('cold') || lowerCaseMessage.includes('selesema')) {
      return "Common flu symptoms include fever, cough, sore throat, body aches, headache, and fatigue. Rest, stay hydrated, and consider over-the-counter medications for symptom relief. See a doctor if symptoms are severe or persist longer than a week.";
    } else if (lowerCaseMessage.includes('sleep') || lowerCaseMessage.includes('tidur')) {
      return "To improve sleep quality: maintain a consistent sleep schedule, create a restful environment, limit daytime naps, stay physically active, manage stress, and avoid caffeine, nicotine, and alcohol before bedtime. If sleep problems persist, consider consulting a healthcare provider.";
    } else if (lowerCaseMessage.includes('heart') || lowerCaseMessage.includes('jantung')) {
      return "Foods good for heart health include: fruits, vegetables, whole grains, lean proteins, fatty fish rich in omega-3s (like salmon), nuts, seeds, legumes, and olive oil. Limit sodium, saturated fats, and added sugars. Stay hydrated and consider the DASH or Mediterranean diet approaches.";
    } else if (lowerCaseMessage.includes('exercise') || lowerCaseMessage.includes('senaman')) {
      return "Adults should aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous activity weekly, plus muscle-strengthening activities on 2 or more days per week. Spread activities throughout the week and reduce sitting time. Always start gradually if you're new to exercise.";
    } else {
      return "Thank you for your question. While I don't have specific information on that topic, I recommend discussing your health concerns with a healthcare provider who can give you personalized advice. Is there something else I can help with?";
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return new Intl.DateTimeFormat(userLanguage === 'ms' ? 'ms-MY' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FaRobot className="title-icon" />
          {t.title}
        </h1>
        <p className="page-description">{t.description}</p>
      </div>
      
      {/* Disclaimer */}
      <div className={`disclaimer ${theme}`}>
        <FaInfoCircle className="disclaimer-icon" />
        <p>{t.disclaimer}</p>
      </div>
      
      {/* Chat Container */}
      <div className={`chat-container ${theme}`}>
        {/* Chat Messages */}
        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">
              <div className="spinner"></div>
              <p>{t.loading}</p>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="chat-empty">
              <FaRobot className="empty-icon" />
              <p>{t.noMessages}</p>
              <div className="example-questions">
                <h3>{t.examples}</h3>
                <ul>
                  {t.exampleQuestions.map((question, index) => (
                    <li 
                      key={index}
                      onClick={() => {
                        setMessage(question);
                      }}
                    >
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'ai-message'} ${msg.isThinking ? 'thinking' : ''}`}
              >
                <div className="message-avatar">
                  {msg.sender === 'user' ? <FaUser /> : <FaRobot />}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {msg.isThinking ? (
                      <div className="thinking-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                  {!msg.isThinking && (
                    <div className="message-time">
                      {formatTime(msg.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        
        {/* Chat Input */}
        <form className="chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.placeholder}
            disabled={sending}
          />
          <button 
            type="submit" 
            className="btn btn-primary btn-send"
            disabled={!message.trim() || sending}
          >
            <FaPaperPlane />
            <span className="send-text">{t.send}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
