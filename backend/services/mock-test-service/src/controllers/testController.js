import * as testService from '../services/testService.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/mock-tests
 * List all active test templates.
 * Optional query param: ?difficulty=easy|medium|hard
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 20.4
 */
export async function listTests(req, res) {
  try {
    const { difficulty } = req.query;
    const userId = req.user?.userId; // may be undefined for unauthenticated requests

    const tests = await testService.getActiveTests({ difficulty, userId });

    logger.info(`Listed ${tests.length} tests for user=${userId ?? 'anonymous'}`);
    return res.json({ tests });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'DATABASE_ERROR';
    logger.error(`listTests error: ${err.message}, status: ${status}, code: ${code}`);
    return res.status(status).json({
      error: err.message || 'Failed to retrieve tests',
      code,
    });
  }
}

/**
 * GET /api/mock-tests/:testId
 * Get details for a single test (sections, duration — NO correct answers).
 * Requirements: 1.2, 20.4
 */
export async function getTest(req, res) {
  try {
    const { testId } = req.params;
    const test = await testService.getTestById(testId);

    return res.json({ test });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'DATABASE_ERROR';
    logger.error(`getTest error: ${err.message}, status: ${status}, code: ${code}, testId: ${req.params.testId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to retrieve test',
      code 
    });
  }
}

/**
 * POST /api/mock-tests
 * Create a new test template — admin only.
 * Body: { title, description, difficulty, sections }
 * Requirements: 16.1, 16.2, 16.3, 20.4
 */
export async function createTest(req, res) {
  try {
    const { title, description, difficulty, sections } = req.body;
    const createdBy = req.user.userId;

    const test = await testService.createTest({
      title,
      description,
      difficulty,
      sections,
      createdBy,
    });

    logger.info(`Test created: ${test._id} by ${createdBy}`);
    return res.status(201).json({ testId: test._id, test });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'DATABASE_ERROR';
    logger.error(`createTest error: ${err.message}, status: ${status}, code: ${code}, userId: ${req.user?.userId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to create test',
      code 
    });
  }
}

/**
 * PUT /api/mock-tests/:testId
 * Update a test template — admin only.
 * Body: any combination of { title, description, difficulty, sections, isActive }
 * Requirements: 16.6
 */
export async function updateTest(req, res) {
  try {
    const { testId } = req.params;
    const test = await testService.updateTest(testId, req.body);

    logger.info(`Test updated: ${testId} by ${req.user?.userId}`);
    return res.json({ test });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'DATABASE_ERROR';
    logger.error(`updateTest error: ${err.message}, status: ${status}, code: ${code}, testId: ${req.params.testId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to update test',
      code 
    });
  }
}

/**
 * DELETE /api/mock-tests/:testId
 * Soft-deactivate a test template — admin only.
 * Requirements: 16.7
 */
export async function deactivateTest(req, res) {
  try {
    const { testId } = req.params;
    const test = await testService.deactivateTest(testId);

    logger.info(`Test deactivated: ${testId} by ${req.user?.userId}`);
    return res.json({ message: 'Test deactivated successfully', test });
  } catch (err) {
    const status = err.status ?? 500;
    const code = err.code ?? 'DATABASE_ERROR';
    logger.error(`deactivateTest error: ${err.message}, status: ${status}, code: ${code}, testId: ${req.params.testId}`);
    return res.status(status).json({ 
      error: err.message || 'Failed to deactivate test',
      code 
    });
  }
}
