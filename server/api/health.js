const express = require('express');
const { db } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

/**
 * @route   POST /api/health/record
 * @desc    Add a new health record
 * @access  Private
 */
router.post('/record', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { 
      recordType, // e.g., 'blood_sugar', 'weight', 'blood_pressure', etc.
      value,
      unit,
      notes,
      recordDate = new Date().toISOString()
    } = req.body;
    
    if (!recordType || value === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Record type and value are required'
      });
    }
    
    // Create health record in Firestore
    const recordDoc = await db.collection('healthRecords').add({
      userId,
      recordType,
      value,
      unit,
      notes,
      recordDate,
      createdAt: new Date().toISOString()
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Health record added successfully',
      data: {
        id: recordDoc.id,
        recordType,
        value,
        unit,
        recordDate
      }
    });
  } catch (error) {
    console.error('Add health record error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add health record',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/records
 * @desc    Get user's health records with filtering
 * @access  Private
 */
router.get('/records', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { recordType, startDate, endDate, limit = 50, page = 1 } = req.query;
    
    // Build query
    let query = db.collection('healthRecords').where('userId', '==', userId);
    
    if (recordType) {
      query = query.where('recordType', '==', recordType);
    }
    
    // Apply date filters if provided
    if (startDate && endDate) {
      query = query.where('recordDate', '>=', startDate)
                   .where('recordDate', '<=', endDate);
    } else if (startDate) {
      query = query.where('recordDate', '>=', startDate);
    } else if (endDate) {
      query = query.where('recordDate', '<=', endDate);
    }
    
    // Order by date
    query = query.orderBy('recordDate', 'desc');
    
    // Apply pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;
    
    query = query.limit(limitNum).offset(offset);
    
    // Execute query
    const recordsSnapshot = await query.get();
    
    const records = [];
    recordsSnapshot.forEach(doc => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get total count for pagination
    let countQuery = db.collection('healthRecords').where('userId', '==', userId);
    if (recordType) {
      countQuery = countQuery.where('recordType', '==', recordType);
    }
    
    const countSnapshot = await countQuery.count().get();
    const totalItems = countSnapshot.data().count;
    const totalPages = Math.ceil(totalItems / limitNum);
    
    return res.status(200).json({
      status: 'success',
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get health records error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health records',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/health/record/:id
 * @desc    Update a health record
 * @access  Private
 */
router.put('/record/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const recordId = req.params.id;
    const { value, unit, notes, recordDate } = req.body;
    
    // Check if record exists and belongs to user
    const recordDoc = await db.collection('healthRecords').doc(recordId).get();
    
    if (!recordDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Health record not found'
      });
    }
    
    const recordData = recordDoc.data();
    
    if (recordData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to health record'
      });
    }
    
    // Update record
    const updateData = {};
    if (value !== undefined) updateData.value = value;
    if (unit) updateData.unit = unit;
    if (notes !== undefined) updateData.notes = notes;
    if (recordDate) updateData.recordDate = recordDate;
    
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection('healthRecords').doc(recordId).update(updateData);
    
    return res.status(200).json({
      status: 'success',
      message: 'Health record updated successfully',
      data: {
        id: recordId,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Update health record error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update health record',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/health/record/:id
 * @desc    Delete a health record
 * @access  Private
 */
router.delete('/record/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const recordId = req.params.id;
    
    // Check if record exists and belongs to user
    const recordDoc = await db.collection('healthRecords').doc(recordId).get();
    
    if (!recordDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Health record not found'
      });
    }
    
    const recordData = recordDoc.data();
    
    if (recordData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to health record'
      });
    }
    
    // Delete record
    await db.collection('healthRecords').doc(recordId).delete();
    
    return res.status(200).json({
      status: 'success',
      message: 'Health record deleted successfully'
    });
  } catch (error) {
    console.error('Delete health record error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete health record',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/health/goal
 * @desc    Create a new health goal
 * @access  Private
 */
router.post('/goal', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { 
      goalType, // e.g., 'blood_sugar', 'weight', 'exercise', etc.
      targetValue,
      unit,
      startDate = new Date().toISOString(),
      endDate,
      description
    } = req.body;
    
    if (!goalType || targetValue === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Goal type and target value are required'
      });
    }
    
    // Create health goal in Firestore
    const goalDoc = await db.collection('healthGoals').add({
      userId,
      goalType,
      targetValue,
      unit,
      startDate,
      endDate,
      description,
      progress: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Health goal created successfully',
      data: {
        id: goalDoc.id,
        goalType,
        targetValue,
        unit,
        startDate,
        endDate,
        description
      }
    });
  } catch (error) {
    console.error('Create health goal error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create health goal',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/goals
 * @desc    Get user's health goals
 * @access  Private
 */
router.get('/goals', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status } = req.query;
    
    // Build query
    let query = db.collection('healthGoals').where('userId', '==', userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Execute query
    const goalsSnapshot = await query.get();
    
    const goals = [];
    goalsSnapshot.forEach(doc => {
      goals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        goals
      }
    });
  } catch (error) {
    console.error('Get health goals error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health goals',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/health/goal/:id
 * @desc    Update a health goal
 * @access  Private
 */
router.put('/goal/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const goalId = req.params.id;
    const { targetValue, unit, endDate, description, progress, status } = req.body;
    
    // Check if goal exists and belongs to user
    const goalDoc = await db.collection('healthGoals').doc(goalId).get();
    
    if (!goalDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Health goal not found'
      });
    }
    
    const goalData = goalDoc.data();
    
    if (goalData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to health goal'
      });
    }
    
    // Update goal
    const updateData = {};
    if (targetValue !== undefined) updateData.targetValue = targetValue;
    if (unit) updateData.unit = unit;
    if (endDate) updateData.endDate = endDate;
    if (description !== undefined) updateData.description = description;
    if (progress !== undefined) updateData.progress = progress;
    if (status) updateData.status = status;
    
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection('healthGoals').doc(goalId).update(updateData);
    
    return res.status(200).json({
      status: 'success',
      message: 'Health goal updated successfully',
      data: {
        id: goalId,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Update health goal error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update health goal',
      error: error.message
    });
  }
});

module.exports = router;
