import express from 'express';
import { authenticate, authenticateOrGuest } from '../middlewares/authMiddleware.js';
import { verifyAttemptOwnership }            from '../middlewares/ownershipMiddleware.js';
import {
  validateAnswerSubmission,
  validateMarkForReview,
  validateSectionSubmission,
  validateTestStart,
  validateAttemptId,
  validateTestCreation,
  sanitizeInputs,
} from '../middlewares/validationMiddleware.js';
import {
  testStartLimiter,
  answerSubmissionLimiter,
  generalLimiter
} from '../middlewares/rateLimitMiddleware.js';

// Controllers
import * as testController     from '../controllers/testController.js';
import * as attemptController  from '../controllers/attemptController.js';
import * as resultController   from '../controllers/resultController.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

// ──────────────────────────────────────────────────────────────────
// Global middleware: sanitize all string inputs on every route
// ──────────────────────────────────────────────────────────────────
router.use(sanitizeInputs);

// ──────────────────────────────────────────────────────────────────
// Rate limiting disabled for development
// ──────────────────────────────────────────────────────────────────
// router.use(generalLimiter);

// ──────────────────────────────────────────────────────────────────
// Test Management (Task 4)
// ──────────────────────────────────────────────────────────────────

/**
 * GET /api/mock-tests
 * List active tests — public (optional auth for per-user stats)
 */
router.get('/', authenticateOrGuest, testController.listTests);

/**
 * POST /api/mock-tests
 * Create a new test template — authenticated admin only
 */
router.post('/', authenticate, validateTestCreation, testController.createTest);

/**
 * GET /api/mock-tests/:testId
 * Get single test details — public
 */
router.get('/:testId', testController.getTest);

/**
 * PUT /api/mock-tests/:testId
 * Update a test — authenticated admin only
 */
router.put('/:testId', authenticate, testController.updateTest);

/**
 * DELETE /api/mock-tests/:testId
 * Deactivate a test — authenticated admin only
 */
router.delete('/:testId', authenticate, testController.deactivateTest);

// ──────────────────────────────────────────────────────────────────
// Test Taking Flow (Tasks 5–11 — controllers wired in as they are built)
// ──────────────────────────────────────────────────────────────────

/**
 * POST /api/mock-tests/:testId/start
 * Start a new test attempt
 * Task 5.6 — stub wired here, replace with attemptController.startTest when ready
 * Rate limiting disabled for development
 */
router.post(
  '/:testId/start',
  // testStartLimiter,
  authenticateOrGuest,
  validateTestStart,
  attemptController.startTest
);

/**
 * GET /api/mock-tests/attempts/:attemptId
 * Get current attempt state (resume)
 * Task 7.3
 */
router.get(
  '/attempts/:attemptId',
  authenticateOrGuest,
  validateAttemptId,
  verifyAttemptOwnership,
  attemptController.getAttempt
);

/**
 * PUT /api/mock-tests/attempts/:attemptId/answer
 * Auto-save an answer
 * Task 6.4
 * Rate limiting disabled for development
 */
router.put(
  '/attempts/:attemptId/answer',
  // answerSubmissionLimiter,
  authenticateOrGuest,
  validateAnswerSubmission,
  verifyAttemptOwnership,
  attemptController.saveAnswer
);

/**
 * PUT /api/mock-tests/attempts/:attemptId/mark-review
 * Mark / unmark a question for review
 * Task 6.8
 */
router.put(
  '/attempts/:attemptId/mark-review',
  authenticateOrGuest,
  validateMarkForReview,
  verifyAttemptOwnership,
  attemptController.markForReview
);

/**
 * POST /api/mock-tests/attempts/:attemptId/submit-section
 * Submit current section and advance to next
 * Task 10.5
 */
router.post(
  '/attempts/:attemptId/submit-section',
  authenticateOrGuest,
  validateSectionSubmission,
  verifyAttemptOwnership,
  attemptController.submitSection
);

/**
 * POST /api/mock-tests/attempts/:attemptId/submit
 * Submit the entire test (final section)
 * Task 11.7
 */
router.post(
  '/attempts/:attemptId/submit',
  authenticateOrGuest,
  validateAttemptId,
  verifyAttemptOwnership,
  attemptController.submitTest
);

// ──────────────────────────────────────────────────────────────────
// Results & Analytics (Tasks 12–13 — wired in when built)
// ──────────────────────────────────────────────────────────────────

/**
 * GET /api/mock-tests/attempts/:attemptId/results
 * Detailed results for a completed attempt
 * Task 12.2
 */
router.get(
  '/attempts/:attemptId/results',
  authenticateOrGuest,
  validateAttemptId,
  verifyAttemptOwnership,
  resultController.getResults
);

/**
 * GET /api/mock-tests/attempts/:attemptId/review
 * All questions with correct answers for post-test review
 * Task 12.4
 */
router.get(
  '/attempts/:attemptId/review',
  authenticateOrGuest,
  validateAttemptId,
  verifyAttemptOwnership,
  resultController.getReview
);

/**
 * GET /api/mock-tests/analytics/history
 * User's past test attempts list
 * Task 13.2
 */
router.get(
  '/analytics/history',
  authenticateOrGuest,
  analyticsController.getHistory
);

/**
 * GET /api/mock-tests/analytics/performance
 * Full performance analytics for the user
 * Task 13.9
 */
router.get(
  '/analytics/performance',
  authenticateOrGuest,
  analyticsController.getPerformance
);

export default router;
