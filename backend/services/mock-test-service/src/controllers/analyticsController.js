import * as analyticsService from '../services/analyticsService.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/mock-tests/analytics/history
 * User's past test attempts list.
 * Requirements: 13.1–13.5
 */
export async function getHistory(req, res) {
  try {
    const { userId } = req.user;
    const attempts = await analyticsService.getTestHistory(userId);
    logger.info(`GET history: userId=${userId}, attempts=${attempts.length}`);
    return res.json({ attempts });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`getHistory error: ${err.message}, status: ${status}, code: ${code}, userId: ${req.user?.userId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to retrieve test history',
      code 
    });
  }
}

/**
 * GET /api/mock-tests/analytics/performance
 * Full performance analytics for the user.
 * Requirements: 14.1–14.8, 15.1–15.5
 */
export async function getPerformance(req, res) {
  try {
    const { userId } = req.user;
    const analytics = await analyticsService.computeAnalytics(userId);
    logger.info(`GET performance: userId=${userId}, totalAttempts=${analytics.overallStats?.totalAttempts}`);
    return res.json(analytics);
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'SERVER_ERROR';
    logger.error(`getPerformance error: ${err.message}, status: ${status}, code: ${code}, userId: ${req.user?.userId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to retrieve performance analytics',
      code 
    });
  }
}
