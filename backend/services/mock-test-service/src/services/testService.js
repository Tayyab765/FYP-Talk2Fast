import MockTest from '../models/MockTest.js';
import TestAttempt from '../models/TestAttempt.js';
import { logger } from '../utils/logger.js';
import NodeCache from 'node-cache';

// Initialize cache with 10-minute TTL (600 seconds)
// Requirements: 21.1, 21.5
const testCache = new NodeCache({ 
  stdTTL: 600,  // 10 minutes
  checkperiod: 120,  // Check for expired keys every 2 minutes
  useClones: false  // Return references for better performance
});

/**
 * FAST entry test section definitions (fixed structure)
 */
export const FAST_SECTIONS = [
  { name: 'Advance Math', questionCount: 50, duration: 50, order: 0 },
  { name: 'Basic Math',   questionCount: 20, duration: 20, order: 1 },
  { name: 'IQ & Logical', questionCount: 20, duration: 20, order: 2 },
  { name: 'English',      questionCount: 30, duration: 30, order: 3 },
];

// ──────────────────────────────────────────────────────────
// READ operations
// ──────────────────────────────────────────────────────────

/**
 * Get all active test templates.
 * Optionally filter by difficulty.
 * For each test, append the requesting user's attempt count + highest score.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 21.1, 21.5
 * @param {Object} options
 * @param {string} [options.difficulty]  - 'easy' | 'medium' | 'hard' | undefined (all)
 * @param {string} [options.userId]      - Supabase/guest userId for attempt stats
 * @returns {Array} Array of test objects with userAttempts and highestScore
 */
export async function getActiveTests({ difficulty, userId } = {}) {
  const filter = { isActive: true };
  if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
    filter.difficulty = difficulty;
  }

  // Create cache key based on filter
  const cacheKey = `tests:${difficulty || 'all'}`;
  
  // Try to get from cache
  let tests = testCache.get(cacheKey);
  
  if (!tests) {
    // Cache miss - fetch from database
    tests = await MockTest.find(filter).sort({ createdAt: -1 }).lean();
    
    // Store in cache
    testCache.set(cacheKey, tests);
    logger.info(`Cache miss for ${cacheKey} - fetched ${tests.length} tests from database`);
  } else {
    logger.info(`Cache hit for ${cacheKey} - returned ${tests.length} tests from cache`);
  }

  if (!userId) {
    return tests.map(t => ({ ...t, userAttempts: 0, highestScore: null }));
  }

  // Enrich with per-user attempt stats (not cached as it's user-specific)
  const enriched = await Promise.all(
    tests.map(async (test) => {
      const attempts = await TestAttempt.find({
        userId,
        testId: test._id,
        status: 'completed',
      })
        .select('score.total')
        .lean();

      const userAttempts = attempts.length;
      const highestScore =
        userAttempts > 0 ? Math.max(...attempts.map(a => a.score?.total ?? 0)) : null;

      return { ...test, userAttempts, highestScore };
    })
  );

  return enriched;
}

/**
 * Get a single test template by ID (without correct answers in questions).
 * Requirements: 1.2, 21.1, 21.5
 * @param {string} testId
 * @returns {Object} MockTest document
 */
export async function getTestById(testId) {
  const cacheKey = `test:${testId}`;
  
  // Try to get from cache
  let test = testCache.get(cacheKey);
  
  if (!test) {
    // Cache miss - fetch from database
    test = await MockTest.findById(testId).lean();
    
    if (!test) {
      const err = new Error('Test not found');
      err.code = 'TEST_NOT_FOUND';
      err.status = 404;
      throw err;
    }
    
    // Store in cache
    testCache.set(cacheKey, test);
    logger.info(`Cache miss for ${cacheKey} - fetched test from database`);
  } else {
    logger.info(`Cache hit for ${cacheKey} - returned test from cache`);
  }
  
  return test;
}

// ──────────────────────────────────────────────────────────
// WRITE operations (admin)
// ──────────────────────────────────────────────────────────

/**
 * Create a new test template.
 * Validates that sections match the FAST format exactly.
 * Requirements: 16.1, 16.2, 16.3, 21.1, 21.5
 * @param {Object} data  - { title, description, difficulty, sections, createdBy }
 * @returns {Object} Created MockTest document
 */
export async function createTest({ title, description, difficulty, sections, createdBy }) {
  // Validate section structure
  _validateSections(sections);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questionCount, 0);
  const totalDuration   = sections.reduce((sum, s) => sum + s.duration, 0);

  const test = new MockTest({
    title,
    description,
    difficulty,
    sections,
    totalQuestions,
    totalDuration,
    isActive: true,
    createdBy,
  });

  await test.save();
  logger.info(`Test created: ${test._id} by ${createdBy}`);
  
  // Invalidate cache for test lists
  _invalidateTestListCache();
  
  return test.toObject();
}

/**
 * Update an existing test template (admin).
 * Requirements: 16.6, 21.1, 21.5
 * @param {string} testId
 * @param {Object} updates  - Partial fields to update
 * @returns {Object} Updated MockTest document
 */
export async function updateTest(testId, updates) {
  const allowed = ['title', 'description', 'difficulty', 'sections', 'isActive'];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }

  if (filtered.sections) {
    _validateSections(filtered.sections);
    filtered.totalQuestions = filtered.sections.reduce((s, sec) => s + sec.questionCount, 0);
    filtered.totalDuration   = filtered.sections.reduce((s, sec) => s + sec.duration, 0);
  }

  const test = await MockTest.findByIdAndUpdate(testId, filtered, {
    new: true,
    runValidators: true,
  }).lean();

  if (!test) {
    const err = new Error('Test not found');
    err.code = 'TEST_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  logger.info(`Test updated: ${testId}`);
  
  // Invalidate cache for this test and test lists
  testCache.del(`test:${testId}`);
  _invalidateTestListCache();
  
  return test;
}

/**
 * Deactivate a test template (soft delete).
 * Requirements: 16.7, 21.1, 21.5
 * @param {string} testId
 * @returns {Object} Updated MockTest document
 */
export async function deactivateTest(testId) {
  const test = await MockTest.findByIdAndUpdate(
    testId,
    { isActive: false },
    { new: true, runValidators: true }
  ).lean();

  if (!test) {
    const err = new Error('Test not found');
    err.code = 'TEST_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  logger.info(`Test deactivated: ${testId}`);
  
  // Invalidate cache for this test and test lists
  testCache.del(`test:${testId}`);
  _invalidateTestListCache();
  
  return test;
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

/**
 * Validate that sections array has exactly 4 sections with orders 0-3.
 * Throws a 400-class error if invalid.
 * @param {Array} sections
 */
function _validateSections(sections) {
  if (!Array.isArray(sections) || sections.length !== 4) {
    const err = new Error('Test must have exactly 4 sections');
    err.code = 'INVALID_SECTIONS';
    err.status = 400;
    throw err;
  }

  const orders = sections.map(s => s.order).sort((a, b) => a - b);
  if (orders.join(',') !== '0,1,2,3') {
    const err = new Error('Sections must have sequential order values (0, 1, 2, 3)');
    err.code = 'INVALID_SECTIONS';
    err.status = 400;
    throw err;
  }
}

/**
 * Invalidate all test list cache entries
 * Requirements: 21.1, 21.5
 */
function _invalidateTestListCache() {
  const keys = testCache.keys();
  const listKeys = keys.filter(key => key.startsWith('tests:'));
  
  if (listKeys.length > 0) {
    testCache.del(listKeys);
    logger.info(`Invalidated ${listKeys.length} test list cache entries`);
  }
}
