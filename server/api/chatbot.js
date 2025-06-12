const express = require('express');
const { db } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');
const { processChatbotQuery } = require('../services/ai');
const router = express.Router();

/**
 * @route   POST /api/chatbot/query
 * @desc    Process a chatbot query
 * @access  Private
 */
router.post('/query', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { query, language = 'en' } = req.body;
    
    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Query is required'
      });
    }
    
    // Get user's language preference if not specified
    if (!language) {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      language = userData?.language || 'en';
    }
    
    // Process query using AI
    const response = await processChatbotQuery(query, language);
    
    // Save conversation to history
    const conversationDoc = await db.collection('chatbotConversations').add({
      userId,
      query,
      response,
      language,
      timestamp: new Date().toISOString()
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        id: conversationDoc.id,
        response,
        language
      }
    });
  } catch (error) {
    console.error('Chatbot query error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process chatbot query',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/history
 * @desc    Get user's chatbot conversation history
 * @access  Private
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 20, page = 1 } = req.query;
    
    // Build query
    let query = db.collection('chatbotConversations')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc');
    
    // Apply pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;
    
    query = query.limit(limitNum).offset(offset);
    
    // Execute query
    const conversationsSnapshot = await query.get();
    
    const conversations = [];
    conversationsSnapshot.forEach(doc => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get total count for pagination
    const countSnapshot = await db.collection('chatbotConversations')
      .where('userId', '==', userId)
      .count()
      .get();
      
    const totalItems = countSnapshot.data().count;
    const totalPages = Math.ceil(totalItems / limitNum);
    
    return res.status(200).json({
      status: 'success',
      data: {
        conversations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get chatbot history error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chatbot history',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/chatbot/history
 * @desc    Clear user's chatbot conversation history
 * @access  Private
 */
router.delete('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get all conversation documents for the user
    const conversationsSnapshot = await db.collection('chatbotConversations')
      .where('userId', '==', userId)
      .get();
    
    // Delete each conversation document
    const batch = db.batch();
    conversationsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Chatbot history cleared successfully'
    });
  } catch (error) {
    console.error('Clear chatbot history error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to clear chatbot history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/knowledge
 * @desc    Get chatbot knowledge base entries (public)
 * @access  Public
 */
router.get('/knowledge', async (req, res) => {
  try {
    const { language = 'en', query, limit = 20 } = req.query;
    
    // Build query
    let dbQuery = db.collection('chatbotKnowledge')
      .where('language', '==', language);
    
    if (query) {
      // Simple text search (in a real app, use Firestore text search or Algolia)
      dbQuery = dbQuery.where('tags', 'array-contains', query.toLowerCase());
    }
    
    dbQuery = dbQuery.limit(parseInt(limit));
    
    // Execute query
    const knowledgeSnapshot = await dbQuery.get();
    
    const knowledgeEntries = [];
    knowledgeSnapshot.forEach(doc => {
      knowledgeEntries.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        knowledgeEntries
      }
    });
  } catch (error) {
    console.error('Get chatbot knowledge error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chatbot knowledge',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/chatbot/knowledge
 * @desc    Add entry to chatbot knowledge base (admin only)
 * @access  Private (Admin)
 */
router.post('/knowledge', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized: Admin access required'
      });
    }
    
    const { question, answer, language = 'en', tags = [] } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({
        status: 'error',
        message: 'Question and answer are required'
      });
    }
    
    // Process tags
    const processedTags = tags.map(tag => tag.toLowerCase());
    
    // Add question words to tags for better searchability
    const questionWords = question.toLowerCase().split(' ');
    questionWords.forEach(word => {
      if (word.length > 3 && !processedTags.includes(word)) {
        processedTags.push(word);
      }
    });
    
    // Create knowledge entry in Firestore
    const knowledgeDoc = await db.collection('chatbotKnowledge').add({
      question,
      answer,
      language,
      tags: processedTags,
      createdBy: userId,
      createdAt: new Date().toISOString()
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Knowledge entry added successfully',
      data: {
        id: knowledgeDoc.id,
        question,
        answer,
        language,
        tags: processedTags
      }
    });
  } catch (error) {
    console.error('Add chatbot knowledge error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add knowledge entry',
      error: error.message
    });
  }
});

module.exports = router;
