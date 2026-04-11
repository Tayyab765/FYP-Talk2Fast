import rateLimit from 'express-rate-limit';
import { warn } from '../utils/logger.js';

/**
 * Rate limiting middleware for the Mock Test Service
 * 
 * Implements three tiers of rate limiting:
 * 1. Strict rate limiting for test starts (5 per hour per user)
 * 2. Generous rate limiting for answer submissions (200 per minute per user)
 * 3. General rate limiting for other endpoints (100 per 15 minutes per user)
 */

/**
 * Key generator function that uses userId or guestId for rate limiting
 * This ensures rate limits are applied per user/guest
 */
const keyGenerator = (req) => {
  // Use userId from authenticated users, or guestId from guest sessions
  const userId = req.user?.userId || req.user?.guestId || req.ip;
  return userId;
};

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  const userId = keyGenerator(req);
  warn(`Rate limit exceeded for user: ${userId}, path: ${req.path}`);
  
  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After')
  });
};

/**
 * Strict rate limiter for test starts
 * Requirement 25.7: Maximum 5 test starts per hour per user
 * NOTE: Increased to 50 for development/testing
 */
export const testStartLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour (increased for development)
  message: 'Too many test starts. Maximum 50 test starts per hour allowed.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator,
  handler: rateLimitHandler
});

/**
 * Generous rate limiter for answer submissions
 * Allows frequent auto-save operations: 200 requests per minute
 */
export const answerSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  message: 'Too many answer submissions. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler
});

/**
 * General rate limiter for all other endpoints
 * Provides baseline protection: 100 requests per 15 minutes
 * NOTE: Increased to 1000 for development/testing
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes (increased for development)
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler
});
