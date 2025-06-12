const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./api/auth');
const userRoutes = require('./api/user');
const voiceRoutes = require('./api/voice');
const healthRoutes = require('./api/health');
const doctorRoutes = require('./api/doctor');
const conversationRoutes = require('./api/conversation');
const chatbotRoutes = require('./api/chatbot');
const skinRoutes = require('./api/skin');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/skin', skinRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ClinIQless AI server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ClinIQless AI server running on port ${PORT}`);
});

module.exports = app; // For testing
