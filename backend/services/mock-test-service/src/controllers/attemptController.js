import * as attemptService from '../services/attemptService.js';
import { completeTest } from '../services/attemptService.js';
import { calculateScore } from '../services/scoringService.js';
import { logger } from '../utils/logger.js';

// Simple in-memory rate limiter: userId -> [timestamps]
const startRateLimitMap = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(userId) {
  const now = Date.now();
  const timestamps = (startRateLimitMap.get(userId) ?? []).filter(
    t => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  startRateLimitMap.set(userId, timestamps);
  return false;
}

/**
 * POST /api/mock-tests/start
 * Start a new test attempt with specified difficulty.
 * Requirements: 3.1–3.6, 20.4, 25.7
 */
export async function startTest(req, res) {
  try {
    const { difficulty } = req.body;
    const { userId, userType } = req.user;

    // Validate difficulty
    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
      logger.warn(`Invalid difficulty provided: ${difficulty}`);
      return res.status(400).json({
        error: 'Invalid difficulty. Must be easy, medium, or hard.',
        code: 'INVALID_DIFFICULTY',
      });
    }

    // Rate limiting disabled for development
    // if (isRateLimited(userId)) {
    //   logger.warn(`Rate limit exceeded for user: ${userId}`);
    //   return res.status(429).json({
    //     error: 'Too many test starts. Maximum 5 per hour.',
    //     code: 'RATE_LIMIT_EXCEEDED',
    //   });
    // }

    const { attempt, questions, sectionName, sectionDuration, testDifficulty } =
      await attemptService.startTest(difficulty, userId, userType);

    logger.info(`POST start: attemptId=${attempt._id} userId=${userId} difficulty=${testDifficulty}`);

    return res.status(201).json({
      attemptId: attempt._id,
      testDifficulty,
      currentSection: attempt.currentSection,
      sectionName,
      sectionDuration,
      questions,
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`startTest error: ${err.message}, status: ${status}, code: ${code}, userId: ${req.user?.userId}, difficulty: ${req.body?.difficulty}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to start test',
      code 
    });
  }
}

/**
 * GET /api/mock-tests/attempts/:attemptId
 * Get current attempt state (for resuming).
 * Requirements: 4.1–4.6, 22.3–22.5
 */
export async function getAttempt(req, res) {
  try {
    // req.attempt is attached by verifyAttemptOwnership middleware
    const state = await attemptService.getAttemptState(req.attempt);
    logger.info(`GET attempt: attemptId=${req.attempt._id} userId=${req.user?.userId}`);
    return res.json(state);
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`getAttempt error: ${err.message}, status: ${status}, code: ${code}, attemptId: ${req.params.attemptId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to retrieve attempt',
      code 
    });
  }
}

/**
 * PUT /api/mock-tests/attempts/:attemptId/answer
 * Auto-save an answer.
 * Requirements: 5.1–5.5, 21.2
 */
export async function saveAnswer(req, res) {
  try {
    const { questionId, answer } = req.body;
    const result = await attemptService.saveAnswer(req.attempt, questionId, answer);
    logger.info(`Answer saved: attemptId=${req.attempt._id} questionId=${questionId} answer=${answer}`);
    return res.json({ success: true, ...result });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`saveAnswer error: ${err.message}, status: ${status}, code: ${code}, attemptId: ${req.params.attemptId}, questionId: ${req.body?.questionId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to save answer',
      code 
    });
  }
}

/**
 * PUT /api/mock-tests/attempts/:attemptId/mark-review
 * Mark / unmark a question for review.
 * Requirements: 7.1–7.5
 */
export async function markForReview(req, res) {
  try {
    const { questionId, marked } = req.body;
    const result = await attemptService.markForReview(req.attempt, questionId, marked);
    logger.info(`Mark for review: attemptId=${req.attempt._id} questionId=${questionId} marked=${marked}`);
    return res.json({ success: true, ...result });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`markForReview error: ${err.message}, status: ${status}, code: ${code}, attemptId: ${req.params.attemptId}, questionId: ${req.body?.questionId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to mark for review',
      code 
    });
  }
}

/**
 * POST /api/mock-tests/attempts/:attemptId/submit-section
 * Submit current section and advance to next (or complete test).
 * Requirements: 9.1–9.8
 */
export async function submitSection(req, res) {
  try {
    // Debug logging
    console.log('========== SUBMIT SECTION CONTROLLER ==========')
    console.log('Request headers:', req.headers)
    console.log('Request body (raw):', req.body)
    console.log('Request body type:', typeof req.body)
    console.log('Request body keys:', Object.keys(req.body || {}))
    console.log('sectionIndex value:', req.body?.sectionIndex)
    console.log('sectionIndex type:', typeof req.body?.sectionIndex)
    console.log('===============================================')
    
    const { sectionIndex } = req.body;
    const result = await attemptService.submitSection(req.attempt, sectionIndex);

    if (result.isLastSection) {
      // Complete the test
      const completedAttempt = await completeTest(result.attempt, calculateScore);
      logger.info(`Test completed: attemptId=${completedAttempt._id} userId=${req.user?.userId} score=${completedAttempt.score.total}`);
      return res.json({
        attemptId: completedAttempt._id,
        status: 'completed',
        score: completedAttempt.score,
        completedAt: completedAttempt.completedAt,
      });
    }

    logger.info(`Section submitted: attemptId=${req.attempt._id} sectionIndex=${sectionIndex} nextSection=${result.nextSection}`);
    return res.json(result);
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`submitSection error: ${err.message}, status: ${status}, code: ${code}, attemptId: ${req.params.attemptId}, sectionIndex: ${req.body?.sectionIndex}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to submit section',
      code 
    });
  }
}

/**
 * POST /api/mock-tests/attempts/:attemptId/submit
 * Submit the entire test (called after final section).
 * Requirements: 10.1–10.7, 21.4
 */
export async function submitTest(req, res) {
  try {
    const attempt = req.attempt;

    if (attempt.status === 'completed') {
      logger.info(`Test already completed: attemptId=${attempt._id}`);
      return res.json({
        attemptId: attempt._id,
        status: 'completed',
        score: attempt.score,
        completedAt: attempt.completedAt,
      });
    }

    const completedAttempt = await completeTest(attempt, calculateScore);
    logger.info(`Test submitted: attemptId=${completedAttempt._id} userId=${req.user?.userId} score=${completedAttempt.score.total}`);

    return res.json({
      attemptId: completedAttempt._id,
      status: 'completed',
      score: completedAttempt.score,
      completedAt: completedAttempt.completedAt,
    });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`submitTest error: ${err.message}, status: ${status}, code: ${code}, attemptId: ${req.params.attemptId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to submit test',
      code 
    });
  }
}
