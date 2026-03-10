const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * Request Logging Middleware
 * Logs HTTP requests using Morgan and Winston
 */

// Create a stream object with a 'write' function that will be used by Morgan
const stream = {
  write: (message) => {
    // Use Winston to log the message (remove trailing newline)
    logger.http(message.trim());
  }
};

// Skip logging in test environment
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

// Morgan format
const format = process.env.NODE_ENV === 'production' 
  ? 'combined' 
  : ':method :url :status :res[content-length] - :response-time ms';

// Build the morgan middleware
const requestLogger = morgan(format, { stream, skip });

module.exports = requestLogger;
