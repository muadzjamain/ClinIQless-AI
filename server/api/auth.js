const express = require('express');
const { auth, db } = require('../config/firebase');
const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, language = 'en' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      });
    }
    
    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: false
    });
    
    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName: displayName || email.split('@')[0],
      createdAt: new Date().toISOString(),
      language,
      isAdmin: false,
      preferences: {
        notifications: true,
        theme: 'light',
        language
      }
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to register user',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (client-side auth handled by Firebase SDK)
 * @access  Public
 * @note    This endpoint is for documentation purposes only
 *          Actual authentication is handled client-side with Firebase Auth SDK
 */
router.post('/login', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Login should be handled client-side with Firebase Auth SDK'
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email is required' 
      });
    }
    
    await auth.generatePasswordResetLink(email);
    
    return res.status(200).json({
      status: 'success',
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send password reset email',
      error: error.message
    });
  }
});

module.exports = router;
