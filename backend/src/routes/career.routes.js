const express = require('express');
const router = express.Router();
const careerController = require('../controllers/career.controller');
const { validateRequest, schemas } = require('../validators/careerValidator');

/**
 * Career Counseling Routes
 * All routes under /api/career
 */

/**
 * @route   GET /api/career/questions
 * @desc    Get all assessment questions
 * @access  Public
 */
router.get('/questions', careerController.getQuestions);

/**
 * @route   POST /api/career/profile
 * @desc    Submit student career profile
 * @access  Private (should add auth middleware)
 * @body    { userId, answers: {...} }
 */
router.post(
  '/profile',
  validateRequest(schemas.profileSubmissionSchema),
  careerController.submitProfile
);

/**
 * @route   POST /api/career/recommend
 * @desc    Generate AI recommendations for user
 * @access  Private
 * @body    { userId }
 */
router.post(
  '/recommend',
  validateRequest(schemas.recommendationRequestSchema),
  careerController.generateRecommendations
);

/**
 * @route   POST /api/career/chat/:sessionId
 * @desc    Send follow-up chat message
 * @access  Private
 * @params  sessionId
 * @body    { message }
 */
router.post(
  '/chat/:sessionId',
  validateRequest(schemas.chatMessageSchema),
  careerController.sendChatMessage
);

/**
 * @route   GET /api/career/session/:sessionId
 * @desc    Get session details
 * @access  Private
 * @params  sessionId
 */
router.get('/session/:sessionId', careerController.getSession);

/**
 * @route   GET /api/career/profile/:userId
 * @desc    Get user's career profile
 * @access  Private
 * @params  userId
 */
router.get('/profile/:userId', careerController.getUserProfile);

/**
 * @route   GET /api/career/session/active/:userId
 * @desc    Get active session for user
 * @access  Private
 * @params  userId
 */
router.get('/session/active/:userId', careerController.getActiveSession);

/**
 * @route   GET /api/career/analytics/:sessionId
 * @desc    Get session analytics
 * @access  Private
 * @params  sessionId
 */
router.get('/analytics/:sessionId', careerController.getSessionAnalytics);

module.exports = router;
