import express from 'express';
const router = express.Router();
import careerController from '../controllers/careerController.js';
import { validateRequest, schemas } from '../validators/careerValidator.js';
import { authenticateOrGuest, optionalAuth } from '../middlewares/authMiddleware.js';

/**
 * Career Counseling Routes
 * All routes under /api/career
 */

/**
 * @route   GET /api/career/questions
 * @desc    Get all assessment questions
 * @access  Public (but can include user context if authenticated)
 */
router.get('/questions', optionalAuth, careerController.getQuestions);

/**
 * @route   POST /api/career/profile
 * @desc    Submit student career profile
 * @access  Private (authenticated user or guest session)
 * @body    { answers: {...} }
 */
router.post(
  '/profile',
  authenticateOrGuest,
  validateRequest(schemas.profileSubmissionSchema),
  careerController.submitProfile
);

/**
 * @route   POST /api/career/recommend
 * @desc    Generate AI recommendations for user
 * @access  Private (authenticated user or guest session)
 * @body    No userId needed - extracted from auth context
 */
router.post(
  '/recommend',
  authenticateOrGuest,
  careerController.generateRecommendations
);

/**
 * @route   POST /api/career/chat/:sessionId
 * @desc    Send follow-up chat message
 * @access  Private (authenticated user or guest session)
 * @params  sessionId
 * @body    { message }
 */
router.post(
  '/chat/:sessionId',
  authenticateOrGuest,
  validateRequest(schemas.chatMessageSchema),
  careerController.sendChatMessage
);

/**
 * @route   GET /api/career/session/:sessionId
 * @desc    Get session details
 * @access  Private (authenticated user or guest session)
 * @params  sessionId
 */
router.get(
  '/session/:sessionId',
  authenticateOrGuest,
  careerController.getSession
);

/**
 * @route   GET /api/career/profile
 * @desc    Get user's career profile
 * @access  Private (authenticated user or guest session)
 */
router.get(
  '/profile',
  authenticateOrGuest,
  careerController.getUserProfile
);

/**
 * @route   GET /api/career/session/active
 * @desc    Get active session for current user
 * @access  Private (authenticated user or guest session)
 */
router.get(
  '/session/active',
  authenticateOrGuest,
  careerController.getActiveSession
);

/**
 * @route   GET /api/career/analytics/:sessionId
 * @desc    Get session analytics
 * @access  Private (authenticated user or guest session)
 * @params  sessionId
 */
router.get(
  '/analytics/:sessionId',
  authenticateOrGuest,
  careerController.getSessionAnalytics
);

/**
 * @route   GET /api/career/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'career-counselling',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
