require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const routes = require('./routes');
const { 
  errorHandler, 
  notFoundHandler, 
  requestLogger, 
  apiLimiter 
} = require('./middleware');
const logger = require('./utils/logger');

/**
 * Express Application Setup
 * Main server configuration and initialization
 */

const app = express();

// ========== SECURITY MIDDLEWARE ==========
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// ========== BODY PARSING ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== LOGGING ==========
app.use(requestLogger);

// ========== RATE LIMITING ==========
// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// ========== ROUTES ==========
// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Career Counseling API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      questions: '/api/career/questions',
      profile: '/api/career/profile',
      recommend: '/api/career/recommend',
      chat: '/api/career/chat/:sessionId',
      session: '/api/career/session/:sessionId'
    }
  });
});

// ========== ERROR HANDLING ==========
// Handle 404 errors
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ========== SERVER INITIALIZATION ==========
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/`);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection', { error: err.message });
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { error: err.message });
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
