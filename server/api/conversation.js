const express = require('express');
const multer = require('multer');
const path = require('path');
const { storage, db } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');
const { summarizeConversation } = require('../services/ai');
const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size for longer conversations
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only WAV, MP3, and WebM audio files are allowed.'));
    }
  }
});

/**
 * @route   POST /api/conversation/record
 * @desc    Upload and process doctor conversation recording
 * @access  Private
 */
router.post('/record', authenticateUser, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No audio file uploaded'
      });
    }

    const userId = req.user.uid;
    const file = req.file;
    const { doctorName, specialization, visitDate = new Date().toISOString(), notes } = req.body;
    
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}${fileExtension}`;
    const filePath = `conversations/${userId}/${filename}`;
    
    // Upload file to Firebase Storage
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);
    
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          userId,
          doctorName,
          originalname: file.originalname,
          timestamp
        }
      }
    });
    
    // Get download URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '01-01-2100'
    });
    
    // Create conversation record in Firestore (initially without transcription/summary)
    const conversationDoc = await db.collection('conversations').add({
      userId,
      doctorName,
      specialization,
      visitDate,
      notes,
      audioUrl: url,
      filename,
      filePath,
      status: 'processing',
      createdAt: new Date().toISOString()
    });
    
    // Start asynchronous processing (in a real app, this would be a Cloud Function)
    // For now, we'll process it here but in a production app this should be done in a background job
    processConversation(conversationDoc.id, file.buffer, userId);
    
    return res.status(202).json({
      status: 'success',
      message: 'Conversation recording uploaded and processing started',
      data: {
        id: conversationDoc.id,
        audioUrl: url,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Conversation recording error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process conversation recording',
      error: error.message
    });
  }
});

/**
 * Process conversation recording (transcription and summarization)
 * In a real app, this would be a Cloud Function triggered by a Firestore write
 */
const processConversation = async (conversationId, audioBuffer, userId) => {
  try {
    // Update status to processing
    await db.collection('conversations').doc(conversationId).update({
      status: 'transcribing'
    });
    
    // In a real implementation, this would use the Speech-to-Text API
    // For this prototype, we'll simulate a transcription
    const transcription = `
      Doctor: Good morning. How are you feeling today?
      Patient: I've been feeling tired lately, and I'm thirsty all the time.
      Doctor: How long has this been going on?
      Patient: About two weeks now. I'm also urinating more frequently.
      Doctor: Those symptoms could indicate several conditions. Let's run some tests. I'd like to check your blood sugar levels.
      Patient: Do you think it might be diabetes?
      Doctor: It's a possibility we need to rule out. Frequent urination, increased thirst, and fatigue are common symptoms of diabetes. But let's not jump to conclusions before we have the test results.
      Patient: My father has type 2 diabetes. Does that increase my risk?
      Doctor: Yes, family history is a risk factor. We'll check your fasting blood glucose and HbA1c levels. In the meantime, try to reduce your sugar intake and increase physical activity.
      Patient: How soon can we get the results?
      Doctor: The blood work should be ready in 2-3 days. I'll call you as soon as I have the results. If your blood sugar is elevated, we'll discuss treatment options, which might include lifestyle changes, medication, or both.
      Patient: Thank you, doctor. I'll wait for your call.
      Doctor: Before you go, do you have any other concerns or questions?
      Patient: No, that's all for now.
      Doctor: Alright. The nurse will help you schedule the blood tests. Take care, and I'll talk to you soon.
    `;
    
    // Update with transcription
    await db.collection('conversations').doc(conversationId).update({
      transcription,
      status: 'summarizing'
    });
    
    // Summarize the conversation using AI
    const summary = await summarizeConversation(transcription);
    
    // Update with summary
    await db.collection('conversations').doc(conversationId).update({
      summary,
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Conversation processing error:', error);
    
    // Update status to error
    await db.collection('conversations').doc(conversationId).update({
      status: 'error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/conversation/history
 * @desc    Get user's conversation history
 * @access  Private
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { doctorName, limit = 10, page = 1 } = req.query;
    
    // Build query
    let query = db.collection('conversations').where('userId', '==', userId);
    
    if (doctorName) {
      query = query.where('doctorName', '==', doctorName);
    }
    
    // Order by date
    query = query.orderBy('visitDate', 'desc');
    
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
    let countQuery = db.collection('conversations').where('userId', '==', userId);
    
    if (doctorName) {
      countQuery = countQuery.where('doctorName', '==', doctorName);
    }
    
    const countSnapshot = await countQuery.count().get();
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
    console.error('Get conversation history error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversation history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/conversation/:id
 * @desc    Get specific conversation by ID
 * @access  Private
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.id;
    
    // Get conversation document from Firestore
    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    
    if (!conversationDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }
    
    const conversationData = conversationDoc.data();
    
    // Check if the conversation belongs to the user
    if (conversationData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to conversation'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        id: conversationDoc.id,
        ...conversationData
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversation',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/conversation/:id
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.id;
    
    // Check if conversation exists and belongs to user
    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    
    if (!conversationDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }
    
    const conversationData = conversationDoc.data();
    
    if (conversationData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to conversation'
      });
    }
    
    // Delete audio file from Storage
    if (conversationData.filePath) {
      const bucket = storage.bucket();
      await bucket.file(conversationData.filePath).delete();
    }
    
    // Delete conversation document
    await db.collection('conversations').doc(conversationId).delete();
    
    return res.status(200).json({
      status: 'success',
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete conversation',
      error: error.message
    });
  }
});

module.exports = router;
