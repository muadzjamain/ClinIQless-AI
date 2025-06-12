const express = require('express');
const { db } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');
const { evaluateDoctorAdvice } = require('../services/ai');
const router = express.Router();

/**
 * @route   POST /api/doctor/advice
 * @desc    Add and evaluate doctor advice
 * @access  Private
 */
router.post('/advice', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { 
      doctorName,
      specialization,
      advice,
      visitDate = new Date().toISOString(),
      notes
    } = req.body;
    
    if (!advice) {
      return res.status(400).json({
        status: 'error',
        message: 'Doctor advice is required'
      });
    }
    
    // Evaluate advice reliability using AI
    const evaluation = await evaluateDoctorAdvice(advice);
    
    // Create advice record in Firestore
    const adviceDoc = await db.collection('doctorAdvice').add({
      userId,
      doctorName,
      specialization,
      advice,
      visitDate,
      notes,
      evaluation,
      createdAt: new Date().toISOString()
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Doctor advice added and evaluated successfully',
      data: {
        id: adviceDoc.id,
        doctorName,
        specialization,
        advice,
        visitDate,
        evaluation
      }
    });
  } catch (error) {
    console.error('Add doctor advice error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add doctor advice',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/doctor/advice
 * @desc    Get user's doctor advice history
 * @access  Private
 */
router.get('/advice', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { doctorName, specialization, limit = 10, page = 1 } = req.query;
    
    // Build query
    let query = db.collection('doctorAdvice').where('userId', '==', userId);
    
    if (doctorName) {
      query = query.where('doctorName', '==', doctorName);
    }
    
    if (specialization) {
      query = query.where('specialization', '==', specialization);
    }
    
    // Order by date
    query = query.orderBy('visitDate', 'desc');
    
    // Apply pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;
    
    query = query.limit(limitNum).offset(offset);
    
    // Execute query
    const adviceSnapshot = await query.get();
    
    const adviceHistory = [];
    adviceSnapshot.forEach(doc => {
      adviceHistory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get total count for pagination
    let countQuery = db.collection('doctorAdvice').where('userId', '==', userId);
    
    if (doctorName) {
      countQuery = countQuery.where('doctorName', '==', doctorName);
    }
    
    if (specialization) {
      countQuery = countQuery.where('specialization', '==', specialization);
    }
    
    const countSnapshot = await countQuery.count().get();
    const totalItems = countSnapshot.data().count;
    const totalPages = Math.ceil(totalItems / limitNum);
    
    return res.status(200).json({
      status: 'success',
      data: {
        adviceHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get doctor advice history error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch doctor advice history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/doctor/advice/:id
 * @desc    Get specific doctor advice by ID
 * @access  Private
 */
router.get('/advice/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const adviceId = req.params.id;
    
    // Get advice document from Firestore
    const adviceDoc = await db.collection('doctorAdvice').doc(adviceId).get();
    
    if (!adviceDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor advice not found'
      });
    }
    
    const adviceData = adviceDoc.data();
    
    // Check if the advice belongs to the user
    if (adviceData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to doctor advice'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        id: adviceDoc.id,
        ...adviceData
      }
    });
  } catch (error) {
    console.error('Get doctor advice error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch doctor advice',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/doctor/advice/:id
 * @desc    Update doctor advice
 * @access  Private
 */
router.put('/advice/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const adviceId = req.params.id;
    const { doctorName, specialization, advice, visitDate, notes } = req.body;
    
    // Check if advice exists and belongs to user
    const adviceDoc = await db.collection('doctorAdvice').doc(adviceId).get();
    
    if (!adviceDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor advice not found'
      });
    }
    
    const adviceData = adviceDoc.data();
    
    if (adviceData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to doctor advice'
      });
    }
    
    // Update data
    const updateData = {};
    if (doctorName) updateData.doctorName = doctorName;
    if (specialization) updateData.specialization = specialization;
    if (notes !== undefined) updateData.notes = notes;
    if (visitDate) updateData.visitDate = visitDate;
    
    // If advice content changed, re-evaluate
    if (advice && advice !== adviceData.advice) {
      updateData.advice = advice;
      updateData.evaluation = await evaluateDoctorAdvice(advice);
    }
    
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection('doctorAdvice').doc(adviceId).update(updateData);
    
    return res.status(200).json({
      status: 'success',
      message: 'Doctor advice updated successfully',
      data: {
        id: adviceId,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Update doctor advice error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update doctor advice',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/doctor/advice/:id
 * @desc    Delete doctor advice
 * @access  Private
 */
router.delete('/advice/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const adviceId = req.params.id;
    
    // Check if advice exists and belongs to user
    const adviceDoc = await db.collection('doctorAdvice').doc(adviceId).get();
    
    if (!adviceDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor advice not found'
      });
    }
    
    const adviceData = adviceDoc.data();
    
    if (adviceData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to doctor advice'
      });
    }
    
    // Delete advice
    await db.collection('doctorAdvice').doc(adviceId).delete();
    
    return res.status(200).json({
      status: 'success',
      message: 'Doctor advice deleted successfully'
    });
  } catch (error) {
    console.error('Delete doctor advice error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete doctor advice',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/doctor/doctors
 * @desc    Get list of doctors the user has recorded advice from
 * @access  Private
 */
router.get('/doctors', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get all advice documents for the user
    const adviceSnapshot = await db.collection('doctorAdvice')
      .where('userId', '==', userId)
      .get();
    
    // Extract unique doctors
    const doctorsMap = new Map();
    
    adviceSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.doctorName) {
        doctorsMap.set(data.doctorName, {
          name: data.doctorName,
          specialization: data.specialization || null,
          lastVisit: data.visitDate || null
        });
      }
    });
    
    const doctors = Array.from(doctorsMap.values());
    
    return res.status(200).json({
      status: 'success',
      data: {
        doctors
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch doctors list',
      error: error.message
    });
  }
});

module.exports = router;
