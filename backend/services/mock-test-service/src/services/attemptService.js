import TestAttempt from '../models/TestAttempt.js';
import Question from '../models/Question.js';
import MockTest from '../models/MockTest.js';
import { logger } from '../utils/logger.js';
import { calculateRemainingTime, validateSectionTiming, getSectionDuration } from './timerService.js';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch questions for a specific section, sorted by order.
 * Excludes correctAnswer so it is never sent to the client during a live test.
 * Requirements: 3.3, 21.1, 25.6
 */
export async function getQuestionsForSection(testId, sectionName) {
  return Question.find({ testId, section: sectionName })
    .select('-correctAnswer')
    .sort({ order: 1 })
    .lean();
}

// ─────────────────────────────────────────────────────────────────
// Start Test  (Task 5.1)
// ─────────────────────────────────────────────────────────────────

/**
 * Create a new TestAttempt for the given test and user.
 * Sets currentSection=0, status="in_progress", records startedAt,
 * and initialises the first section timestamp.
 *
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6
 * @param {string} testId
 * @param {string} userId
 * @param {string} userType  - "authenticated" | "guest"
 * @returns {Object} { attempt, questions, sectionName, sectionDuration }
 */
export async function startTest(testId, userId, userType) {
  const test = await MockTest.findById(testId).lean();
  if (!test) {
    const err = new Error('Test not found');
    err.code = 'TEST_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (!test.isActive) {
    const err = new Error('Test is not available');
    err.code = 'TEST_INACTIVE';
    err.status = 400;
    throw err;
  }

  // Sort sections by order to get the first one
  const sortedSections = [...test.sections].sort((a, b) => a.order - b.order);
  const firstSection = sortedSections[0];
  const now = new Date();

  const attempt = new TestAttempt({
    userId,
    userType,
    testId,
    currentSection: 0,
    status: 'in_progress',
    answers: new Map(),
    markedForReview: [],
    sectionTimestamps: [
      {
        sectionIndex: 0,
        sectionName: firstSection.name,
        startedAt: now,
        submittedAt: null,
        timeSpent: 0,
      },
    ],
    startedAt: now,
  });

  await attempt.save();
  logger.info(`Test started: attemptId=${attempt._id} testId=${testId} userId=${userId}`);

  const questions = await getQuestionsForSection(testId, firstSection.name);

  return {
    attempt: attempt.toObject(),
    questions,
    sectionName: firstSection.name,
    sectionDuration: firstSection.duration,
  };
}

// ─────────────────────────────────────────────────────────────────
// Get Attempt State  (Task 7.1)
// ─────────────────────────────────────────────────────────────────

/**
 * Return the full current state of an attempt (for resuming).
 * Calculates remaining time server-side.
 *
 * Requirements: 4.1–4.6, 22.3, 22.4, 22.5
 * @param {Object} attempt - TestAttempt document (already fetched by ownership middleware)
 * @returns {Object} Attempt state with questions and timeRemaining
 */
export async function getAttemptState(attempt) {
  const test = await MockTest.findById(attempt.testId).lean();
  if (!test) {
    const err = new Error('Test not found');
    err.code = 'TEST_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const sortedSections = [...test.sections].sort((a, b) => a.order - b.order);
  const currentSectionMeta = sortedSections[attempt.currentSection];

  const questions = await getQuestionsForSection(attempt.testId, currentSectionMeta.name);
  const timeRemaining = calculateRemainingTime(attempt, attempt.currentSection);

  // Convert Map to plain object for JSON serialisation
  const answers = attempt.answers instanceof Map
    ? Object.fromEntries(attempt.answers)
    : attempt.answers ?? {};

  return {
    attemptId: attempt._id,
    testId: attempt.testId,
    currentSection: attempt.currentSection,
    sectionName: currentSectionMeta.name,
    sectionDuration: currentSectionMeta.duration,
    questions,
    answers,
    markedForReview: attempt.markedForReview ?? [],
    timeRemaining,
    serverTime: new Date().toISOString(),
    status: attempt.status,
  };
}

// ─────────────────────────────────────────────────────────────────
// Save Answer  (Task 6.1)
// ─────────────────────────────────────────────────────────────────

/**
 * Persist a single answer for the given question.
 * Validates that the questionId belongs to the current section.
 *
 * Requirements: 5.2, 5.4, 5.5, 5.6, 22.1
 * @param {Object} attempt - TestAttempt document
 * @param {string} questionId
 * @param {string} answer  - "A" | "B" | "C" | "D"
 * @returns {Object} { questionId, answer, savedAt }
 */
export async function saveAnswer(attempt, questionId, answer) {
  if (attempt.status !== 'in_progress') {
    const err = new Error('Cannot save answer: test is not in progress');
    err.code = 'TEST_NOT_IN_PROGRESS';
    err.status = 400;
    throw err;
  }

  // Validate questionId belongs to the current test
  const question = await Question.findOne({ _id: questionId, testId: attempt.testId }).lean();
  if (!question) {
    const err = new Error('Question not found in this test');
    err.code = 'QUESTION_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  attempt.answers.set(questionId, answer);
  attempt.lastSyncedAt = new Date();
  await attempt.save();

  const savedAt = new Date().toISOString();
  logger.info(`Answer saved: attemptId=${attempt._id} questionId=${questionId} answer=${answer}`);

  return { questionId, answer, savedAt };
}

// ─────────────────────────────────────────────────────────────────
// Mark for Review  (Task 6.6)
// ─────────────────────────────────────────────────────────────────

/**
 * Toggle the mark-for-review status of a question.
 *
 * Requirements: 7.1–7.6
 * @param {Object} attempt - TestAttempt document
 * @param {string} questionId
 * @param {boolean} marked
 * @returns {Object} Updated markedForReview array
 */
export async function markForReview(attempt, questionId, marked) {
  if (attempt.status !== 'in_progress') {
    const err = new Error('Cannot mark for review: test is not in progress');
    err.code = 'TEST_NOT_IN_PROGRESS';
    err.status = 400;
    throw err;
  }

  const idx = attempt.markedForReview.indexOf(questionId);

  if (marked && idx === -1) {
    attempt.markedForReview.push(questionId);
  } else if (!marked && idx !== -1) {
    attempt.markedForReview.splice(idx, 1);
  }

  await attempt.save();
  logger.info(`Mark for review: attemptId=${attempt._id} questionId=${questionId} marked=${marked}`);

  return { markedForReview: attempt.markedForReview };
}

// ─────────────────────────────────────────────────────────────────
// Submit Section  (Task 10.3)
// ─────────────────────────────────────────────────────────────────

/**
 * Submit the current section and advance to the next one.
 * Validates that sectionIndex matches currentSection.
 * Handles auto-submit on timeout.
 *
 * Requirements: 9.1–9.8
 * @param {Object} attempt - TestAttempt document
 * @param {number} sectionIndex - Must equal attempt.currentSection
 * @returns {Object} { sectionSubmitted, nextSection, sectionName, sectionDuration, questions, serverTime }
 *                   or { completed: true, ... } if this was the last section
 */
export async function submitSection(attempt, sectionIndex) {
  // Validate it's the current section (Req 9.7, 25.3)
  if (attempt.currentSection !== sectionIndex) {
    const err = new Error('Can only submit the current active section');
    err.code = 'INVALID_SECTION';
    err.status = 400;
    throw err;
  }

  if (attempt.status !== 'in_progress') {
    const err = new Error('Test is not in progress');
    err.code = 'TEST_NOT_IN_PROGRESS';
    err.status = 400;
    throw err;
  }

  const test = await MockTest.findById(attempt.testId).lean();
  const sortedSections = [...test.sections].sort((a, b) => a.order - b.order);
  const totalSections = sortedSections.length;

  // Validate timing and record timeSpent
  const timing = validateSectionTiming(attempt, sectionIndex);
  const sectionTs = attempt.sectionTimestamps[sectionIndex];
  sectionTs.submittedAt = new Date();
  sectionTs.timeSpent = timing.timeSpent;

  const isLastSection = sectionIndex === totalSections - 1;

  if (isLastSection) {
    // Delegate to completeTest — caller handles this
    await attempt.save();
    return { isLastSection: true, attempt };
  }

  // Advance to next section
  const nextSectionIndex = sectionIndex + 1;
  const nextSectionMeta = sortedSections[nextSectionIndex];

  attempt.currentSection = nextSectionIndex;
  attempt.sectionTimestamps.push({
    sectionIndex: nextSectionIndex,
    sectionName: nextSectionMeta.name,
    startedAt: new Date(),
    submittedAt: null,
    timeSpent: 0,
  });

  await attempt.save();
  logger.info(`Section ${sectionIndex} submitted for attempt=${attempt._id}, advancing to section ${nextSectionIndex}`);

  const questions = await getQuestionsForSection(attempt.testId, nextSectionMeta.name);

  return {
    isLastSection: false,
    sectionSubmitted: sectionIndex,
    nextSection: nextSectionIndex,
    sectionName: nextSectionMeta.name,
    sectionDuration: nextSectionMeta.duration,
    questions,
    serverTime: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────
// Complete Test  (Task 11.5)
// ─────────────────────────────────────────────────────────────────

/**
 * Finalise the test: calculate scores, mark as completed.
 * Called after the last section is submitted.
 *
 * Requirements: 10.1–10.6
 * @param {Object} attempt - TestAttempt document (already saved with last section ts)
 * @param {Function} calculateScore - Injected from scoringService to avoid circular deps
 * @returns {Object} Completed attempt with score
 */
export async function completeTest(attempt, calculateScore) {
  const questions = await Question.find({ testId: attempt.testId }).lean();
  const score = calculateScore(attempt, questions);

  attempt.score = score;
  attempt.status = 'completed';
  attempt.completedAt = new Date();

  await attempt.save();
  logger.info(`Test completed: attemptId=${attempt._id} score=${score.total} (${score.percentage}%)`);

  return attempt.toObject();
}
