const { auth } = require('../config/firebase');

/**
 * Authentication middleware to verify Firebase ID tokens
 * This middleware validates the user's Firebase ID token and adds the decoded token to the request object
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Unauthorized: No token provided' 
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Unauthorized: Invalid token' 
      });
    }
    
    // Add the user's ID to the request
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Authentication failed',
      error: error.message
    });
  }
};

module.exports = {
  authenticateUser
};
