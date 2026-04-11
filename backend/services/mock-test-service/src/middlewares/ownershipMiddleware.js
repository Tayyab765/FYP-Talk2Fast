import TestAttempt from '../models/TestAttempt.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware: verify the authenticated user owns the test attempt.
 * Attaches the attempt to req.attempt so controllers don't re-fetch.
 * Requirements: 18.6, 25.4
 *
 * Usage:  router.get('/attempts/:attemptId', authenticateOrGuest, verifyAttemptOwnership, controller)
 */
export async function verifyAttemptOwnership(req, res, next) {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }

    const attempt = await TestAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        error: 'Test attempt not found',
        code: 'ATTEMPT_NOT_FOUND'
      });
    }

    // Enforce ownership — userId must match regardless of user type
    if (attempt.userId !== userId) {
      logger.warn(
        `Unauthorized attempt access: user=${userId} attempted to access attempt owned by ${attempt.userId}`
      );
      return res.status(403).json({
        error: 'You are not authorized to access this test attempt',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }

    // Attach attempt to request for downstream controllers
    req.attempt = attempt;
    next();
  } catch (err) {
    logger.error(`Ownership check error: ${err.message}`);
    return res.status(500).json({
      error: 'Failed to verify attempt ownership',
      code: 'DATABASE_ERROR'
    });
  }
}
