const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Stricter rate limiter for AI-powered endpoints (expensive operations)
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit to 10 AI requests per 15 minutes
  message: {
    success: false,
    message: 'Too many AI requests. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Chat rate limiter (prevent spam)
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit to 5 messages per minute
  message: {
    success: false,
    message: 'Please slow down. Wait a moment before sending another message.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  aiLimiter,
  chatLimiter
};
