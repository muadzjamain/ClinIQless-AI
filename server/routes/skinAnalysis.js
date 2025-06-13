const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeSkin } = require('../services/ai');
const { db } = require('../config/firebase');
const { collection, addDoc } = require('firebase/firestore');
const auth = require('../middleware/auth');

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * @route POST /api/skin-analysis/analyze
 * @desc Analyze skin image and return results
 * @access Private
 */
router.post('/analyze', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Get the image buffer and mimetype
    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // Analyze the skin image
    const analysisResult = await analyzeSkin(imageBuffer, mimeType);

    // Save the analysis to Firestore
    const skinAnalysisRef = await addDoc(collection(db, 'skinAnalyses'), {
      userId: req.user.uid,
      timestamp: Date.now(),
      imageUrl: req.body.imageUrl || null, // If image URL is provided from frontend
      skinType: analysisResult.skinType,
      overallScore: analysisResult.overallScore,
      metrics: analysisResult.metrics,
      conditions: analysisResult.conditions,
      recommendations: analysisResult.recommendations,
      modelVersion: '1.0.0',
      deviceInfo: {
        type: 'web',
        browser: req.headers['user-agent'],
        lightCondition: req.body.lightCondition || 'unknown'
      }
    });

    // Return the analysis result with the document ID
    res.json({
      id: skinAnalysisRef.id,
      ...analysisResult
    });
  } catch (error) {
    console.error('Error analyzing skin image:', error);
    res.status(500).json({ 
      message: 'Error analyzing skin image', 
      error: error.message 
    });
  }
});

/**
 * @route GET /api/skin-analysis/history
 * @desc Get user's skin analysis history
 * @access Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Query Firestore for user's skin analysis history
    const snapshot = await db.collection('skinAnalyses')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const history = [];
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching skin analysis history:', error);
    res.status(500).json({ 
      message: 'Error fetching skin analysis history', 
      error: error.message 
    });
  }
});

/**
 * @route GET /api/skin-analysis/:id
 * @desc Get a specific skin analysis by ID
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.uid;
    
    // Get the document
    const doc = await db.collection('skinAnalyses').doc(analysisId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    const analysis = doc.data();
    
    // Check if the analysis belongs to the user
    if (analysis.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to analysis' });
    }
    
    res.json({
      id: doc.id,
      ...analysis
    });
  } catch (error) {
    console.error('Error fetching skin analysis:', error);
    res.status(500).json({ 
      message: 'Error fetching skin analysis', 
      error: error.message 
    });
  }
});

module.exports = router;
