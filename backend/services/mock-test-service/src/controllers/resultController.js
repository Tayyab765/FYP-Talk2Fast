import * as resultService from '../services/resultService.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/mock-tests/attempts/:attemptId/results
 * Detailed results for a completed attempt.
 * Requirements: 11.1–11.5
 */
export async function getResults(req, res) {
  try {
    const results = await resultService.getDetailedResults(req.attempt);
    logger.info(`GET results: attemptId=${req.attempt._id} userId=${req.user?.userId}`);
    return res.json(results);
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`getResults error: ${err.message}, status: ${status}, code: ${code}, attemptId: ${req.params.attemptId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to retrieve results',
      code 
    });
  }
}

/**
 * GET /api/mock-tests/attempts/:attemptId/review
 * All questions with correct answers for post-test review.
 * Requirements: 12.1–12.8
 */
export async function getReview(req, res) {
  try {
    const review = await resultService.getAnswerReview(req.attempt);
    logger.info(`GET review: attemptId=${req.attempt._id} userId=${req.user?.userId}`);
    return res.json(review);
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`getReview error: ${err.message}, status: ${status}, code: ${code}, attemptId: ${req.params.attemptId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to retrieve answer review',
      code 
    });
  }
}
