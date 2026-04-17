import TestAttempt from '../models/TestAttempt.js';
import Question from '../models/Question.js';
import MockTest from '../models/MockTest.js';
import { logger } from '../utils/logger.js';
import { calculateRemainingTime, validateSectionTiming, getSectionDuration } from './timerService.js';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Difficulty ratios for each test level and section
 * Adjusted based on available questions in database
 * 
 * Available questions:
 * - Advance Math: 332 easy, 383 medium, 270 hard
 * - Basic Math: 100 easy, 121 medium, 66 hard
 * - IQ & Logical: 38 easy, 38 medium, 24 hard
 * - English: 43 easy, 83 medium, 1 hard (LIMITED!)
 */
const DIFFICULTY_RATIOS = {
  easy: {
    'Advance Math': { easy: 30, medium: 15, hard: 5 },
    'Basic Math': { easy: 12, medium: 6, hard: 2 },
    'IQ & Logical': { easy: 12, medium: 6, hard: 2 },
    'English': { easy: 16, medium: 13, hard: 1 }  // Only 1 hard available
  },
  medium: {
    'Advance Math': { easy: 12, medium: 25, hard: 13 },
    'Basic Math': { easy: 5, medium: 10, hard: 5 },
    'IQ & Logical': { easy: 5, medium: 10, hard: 5 },
    'English': { easy: 8, medium: 21, hard: 1 }  // Adjusted: 21 medium, 1 hard (only 1 available)
  },
  hard: {
    'Advance Math': { easy: 5, medium: 15, hard: 30 },
    'Basic Math': { easy: 2, medium: 6, hard: 12 },
    'IQ & Logical': { easy: 2, medium: 6, hard: 12 },
    'English': { easy: 1, medium: 28, hard: 1 }  // Adjusted: 28 medium, 1 hard (only 1 available)
  }
};

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select random questions from question bank based on difficulty ratios
 * 
 * @param {string} sectionName - Section name
 * @param {string} testDifficulty - Test difficulty level (easy/medium/hard)
 * @returns {Array} Selected question IDs
 */
async function selectQuestionsForSection(sectionName, testDifficulty) {
  const ratios = DIFFICULTY_RATIOS[testDifficulty][sectionName];
  const selectedQuestions = [];

  // Select questions for each difficulty level
  for (const [difficulty, count] of Object.entries(ratios)) {
    // Fetch available questions from question bank (testId is null)
    const availableQuestions = await Question.find({
      section: sectionName,
      difficulty: difficulty,
      testId: null
    })
    .select('_id')
    .lean();

    if (availableQuestions.length < count) {
      logger.warn(
        `Not enough ${difficulty} questions for ${sectionName}. ` +
        `Need ${count}, have ${availableQuestions.length}`
      );
    }

    // Shuffle and select required count
    const shuffled = shuffleArray(availableQuestions);
    const selected = shuffled.slice(0, count);
    selectedQuestions.push(...selected.map(q => q._id.toString()));
  }

  return selectedQuestions;
}

/**
 * Fetch questions for a specific section.
 * If attempt has stored question order for this section, use it.
 * Otherwise, randomize and store the order.
 * Excludes correctAnswer so it is never sent to the client during a live test.
 * Requirements: 3.3, 21.1, 25.6
 * 
 * @param {string} sectionName - Section name
 * @param {Object} attempt - TestAttempt document (required for storing/retrieving order)
 */
export async function getQuestionsForSection(sectionName, attempt) {
  // Get stored question IDs for this section
  const questionIds = attempt.questionOrder.get(sectionName);
  
  if (!questionIds || questionIds.length === 0) {
    throw new Error(`No questions found for section: ${sectionName}`);
  }

  // Fetch questions in the stored order
  const questions = await Question.find({ _id: { $in: questionIds } })
    .select('-correctAnswer')
    .lean();

  // Reorder based on stored order
  const questionMap = new Map(questions.map(q => [q._id.toString(), q]));
  const orderedQuestions = questionIds.map(id => questionMap.get(id)).filter(Boolean);

  return orderedQuestions;
}

// ─────────────────────────────────────────────────────────────────
// Start Test  (Task 5.1)
// ─────────────────────────────────────────────────────────────────

/**
 * Create a new TestAttempt with dynamically generated questions.
 * Questions are selected from the question bank based on difficulty ratios.
 * Sets currentSection=0, status="in_progress", records startedAt,
 * and initialises the first section timestamp.
 *
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6
 * @param {string} testDifficulty - Test difficulty level (easy/medium/hard)
 * @param {string} userId
 * @param {string} userType  - "authenticated" | "guest"
 * @returns {Object} { attempt, questions, sectionName, sectionDuration }
 */
export async function startTest(testDifficulty, userId, userType) {
  // Validate difficulty
  if (!['easy', 'medium', 'hard'].includes(testDifficulty)) {
    const err = new Error('Invalid test difficulty. Must be easy, medium, or hard');
    err.code = 'INVALID_DIFFICULTY';
    err.status = 400;
    throw err;
  }

  // Define section structure (FAST exam format)
  const sections = [
    { name: 'Advance Math', duration: 50, order: 0 },
    { name: 'Basic Math', duration: 20, order: 1 },
    { name: 'IQ & Logical', duration: 20, order: 2 },
    { name: 'English', duration: 30, order: 3 }
  ];

  const now = new Date();
  const firstSection = sections[0];

  // Create attempt with empty questionOrder (will be populated below)
  const attempt = new TestAttempt({
    userId,
    userType,
    testId: null, // No template, dynamically generated
    testDifficulty, // Store difficulty level
    currentSection: 0,
    status: 'in_progress',
    answers: new Map(),
    markedForReview: [],
    questionOrder: new Map(),
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

  // Generate questions for all sections and store in questionOrder
  logger.info(`Generating ${testDifficulty} test for userId=${userId}`);
  
  for (const section of sections) {
    const questionIds = await selectQuestionsForSection(section.name, testDifficulty);
    attempt.questionOrder.set(section.name, questionIds);
    logger.info(
      `Selected ${questionIds.length} questions for ${section.name} ` +
      `(difficulty: ${testDifficulty})`
    );
  }

  await attempt.save();
  logger.info(
    `Test started: attemptId=${attempt._id} difficulty=${testDifficulty} userId=${userId}`
  );

  // Get questions for first section
  const questions = await getQuestionsForSection(firstSection.name, attempt);

  return {
    attempt: attempt.toObject(),
    questions,
    sectionName: firstSection.name,
    sectionDuration: firstSection.duration,
    testDifficulty,
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
  // Define section structure (FAST exam format)
  const sections = [
    { name: 'Advance Math', duration: 50, order: 0 },
    { name: 'Basic Math', duration: 20, order: 1 },
    { name: 'IQ & Logical', duration: 20, order: 2 },
    { name: 'English', duration: 30, order: 3 }
  ];

  const currentSectionMeta = sections[attempt.currentSection];

  const questions = await getQuestionsForSection(currentSectionMeta.name, attempt);
  const timeRemaining = calculateRemainingTime(attempt, attempt.currentSection);

  // Convert Map to plain object for JSON serialisation
  const answers = attempt.answers instanceof Map
    ? Object.fromEntries(attempt.answers)
    : attempt.answers ?? {};

  return {
    attemptId: attempt._id,
    testDifficulty: attempt.testDifficulty,
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
 * Validates that the questionId belongs to the current attempt.
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

  // Validate questionId belongs to this attempt's question set
  let isValidQuestion = false;
  for (const [sectionName, questionIds] of attempt.questionOrder.entries()) {
    if (questionIds.includes(questionId)) {
      isValidQuestion = true;
      break;
    }
  }

  if (!isValidQuestion) {
    const err = new Error('Question not found in this test attempt');
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

  // Define section structure (FAST exam format)
  const sections = [
    { name: 'Advance Math', duration: 50, order: 0 },
    { name: 'Basic Math', duration: 20, order: 1 },
    { name: 'IQ & Logical', duration: 20, order: 2 },
    { name: 'English', duration: 30, order: 3 }
  ];

  const totalSections = sections.length;

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
  const nextSectionMeta = sections[nextSectionIndex];

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

  const questions = await getQuestionsForSection(nextSectionMeta.name, attempt);

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
  // Collect all question IDs from the attempt
  const allQuestionIds = [];
  for (const [sectionName, questionIds] of attempt.questionOrder.entries()) {
    allQuestionIds.push(...questionIds);
  }

  // Fetch all questions for scoring
  const questions = await Question.find({ _id: { $in: allQuestionIds } }).lean();
  const score = calculateScore(attempt, questions);

  attempt.score = score;
  attempt.status = 'completed';
  attempt.completedAt = new Date();

  await attempt.save();
  logger.info(`Test completed: attemptId=${attempt._id} score=${score.total} (${score.percentage}%)`);

  return attempt.toObject();
}
