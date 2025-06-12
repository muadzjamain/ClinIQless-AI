const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage, db } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');
const { analyzeVoice } = require('../services/ai');
const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
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
 * @route   POST /api/voice/analyze
 * @desc    Upload and analyze voice recording for diabetes risk prediction
 * @access  Private
 */
router.post('/analyze', authenticateUser, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No audio file uploaded'
      });
    }

    const userId = req.user.uid;
    const file = req.file;
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}${fileExtension}`;
    const filePath = `audio/${userId}/${filename}`;
    
    // Upload file to Firebase Storage
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);
    
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          userId,
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
    
    // Analyze voice using AI service
    const analysisResults = await analyzeVoice(file.buffer);
    
    // Save analysis results to Firestore
    const analysisDoc = await db.collection('voiceAnalysis').add({
      userId,
      audioUrl: url,
      filename,
      filePath,
      results: analysisResults,
      createdAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Voice analysis completed successfully',
      data: {
        id: analysisDoc.id,
        audioUrl: url,
        results: analysisResults
      }
    });
  } catch (error) {
    console.error('Voice analysis error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to analyze voice recording',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/voice/history
 * @desc    Get user's voice analysis history
 * @access  Private
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Get voice analysis history from Firestore
    const analysisSnapshot = await db.collection('voiceAnalysis')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();
    
    const analysisHistory = [];
    analysisSnapshot.forEach(doc => {
      analysisHistory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get total count for pagination
    const countSnapshot = await db.collection('voiceAnalysis')
      .where('userId', '==', userId)
      .count()
      .get();
    
    const totalItems = countSnapshot.data().count;
    const totalPages = Math.ceil(totalItems / limit);
    
    return res.status(200).json({
      status: 'success',
      data: {
        history: analysisHistory,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get voice history error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch voice analysis history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/voice/analysis/:id
 * @desc    Get specific voice analysis by ID
 * @access  Private
 */
router.get('/analysis/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const analysisId = req.params.id;
    
    // Get analysis document from Firestore
    const analysisDoc = await db.collection('voiceAnalysis').doc(analysisId).get();
    
    if (!analysisDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Voice analysis not found'
      });
    }
    
    const analysisData = analysisDoc.data();
    
    // Check if the analysis belongs to the user
    if (analysisData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to voice analysis'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        id: analysisDoc.id,
        ...analysisData
      }
    });
  } catch (error) {
    console.error('Get voice analysis error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch voice analysis',
      error: error.message
    });
  }
});

module.exports = router;
