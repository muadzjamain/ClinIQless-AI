const express = require('express');
const { db } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found'
      });
    }
    
    const userData = userDoc.data();
    
    // Remove sensitive information
    delete userData.password;
    
    return res.status(200).json({
      status: 'success',
      data: {
        uid: userId,
        ...userData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { displayName, language, preferences } = req.body;
    
    const updateData = {};
    
    if (displayName) updateData.displayName = displayName;
    if (language) updateData.language = language;
    if (preferences) updateData.preferences = preferences;
    
    // Update user document in Firestore
    await db.collection('users').doc(userId).update({
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'User profile updated successfully',
      data: updateData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user profile',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/users/health-summary
 * @desc    Get user health summary data
 * @access  Private
 */
router.get('/health-summary', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get latest health records
    const healthRecordsSnapshot = await db.collection('healthRecords')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    // Get latest voice analysis
    const voiceAnalysisSnapshot = await db.collection('voiceAnalysis')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    // Get latest skin analysis
    const skinAnalysisSnapshot = await db.collection('skinAnalysis')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    // Format the data
    const healthRecords = [];
    healthRecordsSnapshot.forEach(doc => {
      healthRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const voiceAnalysis = [];
    voiceAnalysisSnapshot.forEach(doc => {
      voiceAnalysis.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const skinAnalysis = [];
    skinAnalysisSnapshot.forEach(doc => {
      skinAnalysis.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        healthRecords,
        voiceAnalysis,
        skinAnalysis
      }
    });
  } catch (error) {
    console.error('Get health summary error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health summary',
      error: error.message
    });
  }
});

module.exports = router;
