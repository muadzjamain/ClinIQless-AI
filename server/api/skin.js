const express = require('express');
const multer = require('multer');
const path = require('path');
const { storage, db } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');
const { analyzeSkinImage } = require('../services/ai');
const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'));
    }
  }
});

/**
 * @route   POST /api/skin/analyze
 * @desc    Upload and analyze skin image
 * @access  Private
 */
router.post('/analyze', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image uploaded'
      });
    }

    const userId = req.user.uid;
    const file = req.file;
    const { notes, bodyPart } = req.body;
    
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}${fileExtension}`;
    const filePath = `skin/${userId}/${filename}`;
    
    // Upload file to Firebase Storage
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);
    
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          userId,
          originalname: file.originalname,
          bodyPart,
          timestamp
        }
      }
    });
    
    // Get download URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '01-01-2100'
    });
    
    // Analyze skin image using AI
    const analysis = await analyzeSkinImage(file.buffer, bodyPart);
    
    // Create skin analysis record in Firestore
    const analysisDoc = await db.collection('skinAnalysis').add({
      userId,
      imageUrl: url,
      filePath,
      bodyPart,
      notes,
      analysis,
      createdAt: new Date().toISOString()
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Skin image analyzed successfully',
      data: {
        id: analysisDoc.id,
        imageUrl: url,
        bodyPart,
        analysis
      }
    });
  } catch (error) {
    console.error('Skin analysis error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to analyze skin image',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/skin/history
 * @desc    Get user's skin analysis history
 * @access  Private
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { bodyPart, limit = 10, page = 1 } = req.query;
    
    // Build query
    let query = db.collection('skinAnalysis').where('userId', '==', userId);
    
    if (bodyPart) {
      query = query.where('bodyPart', '==', bodyPart);
    }
    
    // Order by date
    query = query.orderBy('createdAt', 'desc');
    
    // Apply pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;
    
    query = query.limit(limitNum).offset(offset);
    
    // Execute query
    const analysisSnapshot = await query.get();
    
    const analysisHistory = [];
    analysisSnapshot.forEach(doc => {
      analysisHistory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get total count for pagination
    let countQuery = db.collection('skinAnalysis').where('userId', '==', userId);
    
    if (bodyPart) {
      countQuery = countQuery.where('bodyPart', '==', bodyPart);
    }
    
    const countSnapshot = await countQuery.count().get();
    const totalItems = countSnapshot.data().count;
    const totalPages = Math.ceil(totalItems / limitNum);
    
    return res.status(200).json({
      status: 'success',
      data: {
        analysisHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get skin analysis history error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch skin analysis history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/skin/:id
 * @desc    Get specific skin analysis by ID
 * @access  Private
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const analysisId = req.params.id;
    
    // Get analysis document from Firestore
    const analysisDoc = await db.collection('skinAnalysis').doc(analysisId).get();
    
    if (!analysisDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Skin analysis not found'
      });
    }
    
    const analysisData = analysisDoc.data();
    
    // Check if the analysis belongs to the user
    if (analysisData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to skin analysis'
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
    console.error('Get skin analysis error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch skin analysis',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/skin/:id
 * @desc    Delete a skin analysis
 * @access  Private
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const analysisId = req.params.id;
    
    // Check if analysis exists and belongs to user
    const analysisDoc = await db.collection('skinAnalysis').doc(analysisId).get();
    
    if (!analysisDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Skin analysis not found'
      });
    }
    
    const analysisData = analysisDoc.data();
    
    if (analysisData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to skin analysis'
      });
    }
    
    // Delete image from Storage
    if (analysisData.filePath) {
      const bucket = storage.bucket();
      await bucket.file(analysisData.filePath).delete();
    }
    
    // Delete analysis document
    await db.collection('skinAnalysis').doc(analysisId).delete();
    
    return res.status(200).json({
      status: 'success',
      message: 'Skin analysis deleted successfully'
    });
  } catch (error) {
    console.error('Delete skin analysis error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete skin analysis',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/skin/recommendations/:id
 * @desc    Get skincare recommendations for a specific analysis
 * @access  Private
 */
router.get('/recommendations/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const analysisId = req.params.id;
    
    // Get analysis document from Firestore
    const analysisDoc = await db.collection('skinAnalysis').doc(analysisId).get();
    
    if (!analysisDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Skin analysis not found'
      });
    }
    
    const analysisData = analysisDoc.data();
    
    // Check if the analysis belongs to the user
    if (analysisData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to skin analysis'
      });
    }
    
    // Extract recommendations from analysis or generate new ones if not present
    let recommendations = analysisData.analysis?.recommendations;
    
    if (!recommendations) {
      // If recommendations don't exist, generate them using AI
      // In a real app, this would be more sophisticated
      recommendations = {
        skinType: analysisData.analysis?.skinType || 'unknown',
        concerns: analysisData.analysis?.concerns || [],
        products: [
          {
            type: 'Cleanser',
            recommendation: 'Gentle pH-balanced cleanser suitable for your skin type',
            ingredients: ['Glycerin', 'Ceramides', 'Hyaluronic Acid']
          },
          {
            type: 'Moisturizer',
            recommendation: 'Lightweight, non-comedogenic moisturizer',
            ingredients: ['Niacinamide', 'Ceramides', 'Peptides']
          },
          {
            type: 'Sunscreen',
            recommendation: 'Broad-spectrum SPF 30+ sunscreen',
            ingredients: ['Zinc Oxide', 'Titanium Dioxide']
          }
        ],
        routine: {
          morning: [
            'Cleanse with gentle cleanser',
            'Apply moisturizer',
            'Finish with sunscreen'
          ],
          evening: [
            'Cleanse with gentle cleanser',
            'Apply treatment products if needed',
            'Apply moisturizer'
          ]
        },
        lifestyle: [
          'Stay hydrated by drinking plenty of water',
          'Maintain a balanced diet rich in antioxidants',
          'Get adequate sleep to allow skin to repair'
        ]
      };
      
      // Update the analysis with recommendations
      await db.collection('skinAnalysis').doc(analysisId).update({
        'analysis.recommendations': recommendations
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        id: analysisId,
        recommendations
      }
    });
  } catch (error) {
    console.error('Get skin recommendations error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch skin recommendations',
      error: error.message
    });
  }
});

module.exports = router;
