/**
 * Middleware Index
 * Central export for all middleware
 */

const { errorHandler, notFoundHandler, AppError, catchAsync } = require('./errorHandler');
const { apiLimiter, aiLimiter, chatLimiter } = require('./rateLimiter');
const requestLogger = require('./requestLogger');

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
  catchAsync,
  apiLimiter,
  aiLimiter,
  chatLimiter,
  requestLogger
};
