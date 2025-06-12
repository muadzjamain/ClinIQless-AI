import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFirestore, collection, query, where, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { FaComments, FaTrash, FaSearch, FaSpinner, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './Conversations.css';

function Conversations() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const db = getFirestore();
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Multilingual labels
  const labels = {
    en: {
      title: 'Conversations',
      description: 'View and manage your conversations with the AI health assistant',
      search: 'Search conversations',
      noConversations: 'No conversations found',
      loading: 'Loading conversations...',
      deleteConfirm: 'Delete Conversation',
      deleteWarning: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      cancel: 'Cancel',
      delete: 'Delete',
      deleting: 'Deleting...',
      errorDelete: 'Error deleting conversation',
      viewConversation: 'View in Chatbot',
      date: 'Date',
      messages: 'Messages'
    },
    ms: {
      title: 'Perbualan',
      description: 'Lihat dan urus perbualan anda dengan pembantu kesihatan AI',
      search: 'Cari perbualan',
      noConversations: 'Tiada perbualan ditemui',
      loading: 'Memuatkan perbualan...',
      deleteConfirm: 'Padam Perbualan',
      deleteWarning: 'Adakah anda pasti mahu memadamkan perbualan ini? Tindakan ini tidak boleh dibatalkan.',
      cancel: 'Batal',
      delete: 'Padam',
      deleting: 'Memadamkan...',
      errorDelete: 'Ralat memadamkan perbualan',
      viewConversation: 'Lihat dalam Chatbot',
      date: 'Tarikh',
      messages: 'Mesej'
    }
  };
  
  // Use the appropriate language
  const t = labels[userLanguage] || labels.en;
  
  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      if (!currentUser) return;
      
      try {
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('userId', '==', currentUser.uid),
          orderBy('lastUpdated', 'desc')
        );
        
        const conversationsSnapshot = await getDocs(conversationsQuery);
        const conversationsData = conversationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Error fetching conversations');
      } finally {
        setLoading(false);
      }
    }
    
    fetchConversations();
  }, [currentUser, db]);
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    // Search in conversation title or messages
    const title = conversation.title || '';
    const messages = conversation.messages || [];
    const messageTexts = messages.map(msg => msg.text || '').join(' ');
    
    return (
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      messageTexts.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Open delete modal
  const openDeleteModal = (conversation) => {
    setSelectedConversation(conversation);
    setShowDeleteModal(true);
  };
  
  // Close delete modal
  const closeDeleteModal = () => {
    setSelectedConversation(null);
    setShowDeleteModal(false);
  };
  
  // Delete conversation
  const deleteConversation = async () => {
    if (!selectedConversation) return;
    
    setDeleting(true);
    setError('');
    
    try {
      // Delete conversation document
      await deleteDoc(doc(db, 'conversations', selectedConversation.id));
      
      // Update state
      setConversations(conversations.filter(c => c.id !== selectedConversation.id));
      
      // Close modal
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError(t.errorDelete);
    } finally {
      setDeleting(false);
    }
  };
  
  // Format date
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
  
  // Get conversation preview
  const getConversationPreview = (conversation) => {
    const messages = conversation.messages || [];
    if (messages.length === 0) return '';
    
    // Get the last message text
    const lastMessage = messages[messages.length - 1];
    const text = lastMessage.text || '';
    
    // Truncate if too long
    return text.length > 100 ? `${text.substring(0, 100)}...` : text;
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FaComments className="title-icon" />
          {t.title}
        </h1>
        <p className="page-description">{t.description}</p>
      </div>
      
      {/* Search bar */}
      <div className={`search-container ${theme}`}>
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t.search}
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm('')}
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className={`alert alert-error ${theme}`}>
          <FaExclamationTriangle className="alert-icon" />
          {error}
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {/* Conversations list */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t.loading}</p>
        </div>
      ) : (
        <div className="conversations-list">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(conversation => (
              <div key={conversation.id} className={`conversation-card ${theme}`}>
                <div className="conversation-content">
                  <h3 className="conversation-title">
                    {conversation.title || `Conversation ${formatDate(conversation.createdAt)}`}
                  </h3>
                  
                  <p className="conversation-preview">
                    {getConversationPreview(conversation)}
                  </p>
                  
                  <div className="conversation-meta">
                    <span className="conversation-date">
                      {formatDate(conversation.lastUpdated || conversation.createdAt)}
                    </span>
                    <span className="conversation-messages">
                      {conversation.messages?.length || 0} {t.messages}
                    </span>
                  </div>
                </div>
                
                <div className="conversation-actions">
                  <a 
                    href="/chatbot" 
                    className="btn btn-outline btn-sm"
                    title={t.viewConversation}
                  >
                    {t.viewConversation}
                  </a>
                  
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => openDeleteModal(conversation)}
                    title={t.delete}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={`empty-state ${theme}`}>
              <FaComments className="empty-icon" />
              <p>{t.noConversations}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className={`modal ${theme}`}>
            <div className="modal-header">
              <h2>{t.deleteConfirm}</h2>
            </div>
            
            <div className="modal-body">
              <p className="warning-text">
                <FaExclamationTriangle className="warning-icon" />
                {t.deleteWarning}
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                {t.cancel}
              </button>
              
              <button 
                className="btn btn-danger"
                onClick={deleteConversation}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <FaSpinner className="spinner-icon" />
                    {t.deleting}
                  </>
                ) : (
                  <>
                    <FaTrash />
                    {t.delete}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Conversations;
