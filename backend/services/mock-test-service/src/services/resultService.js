import TestAttempt from '../models/TestAttempt.js';
import MockTest from '../models/MockTest.js';
import Question from '../models/Question.js';
import { logger } from '../utils/logger.js';

/**
 * Get detailed results for a completed test attempt.
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 *
 * @param {Object} attempt - TestAttempt document
 * @returns {Object} Results with score breakdown and time analysis
 */
export async function getDetailedResults(attempt) {
  if (attempt.status !== 'completed') {
    const err = new Error('Results are only available for completed tests');
    err.code = 'TEST_NOT_COMPLETED';
    err.status = 400;
    throw err;
  }

  const test = await MockTest.findById(attempt.testId).lean();
  if (!test) {
    const err = new Error('Test not found');
    err.code = 'TEST_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Build time analysis from sectionTimestamps
  const timeAnalysis = {
    totalTime: 0,
    sections: [],
  };

  for (const ts of attempt.sectionTimestamps) {
    if (ts.submittedAt && ts.startedAt) {
      const spent = ts.timeSpent ?? 0;
      timeAnalysis.totalTime += spent;
      timeAnalysis.sections.push({
        section: ts.sectionName,
        timeSpent: spent,
      });
    }
  }

  timeAnalysis.totalTime = Math.round(timeAnalysis.totalTime * 100) / 100;

  return {
    attemptId: attempt._id,
    testTitle: test.title,
    score: attempt.score,
    timeAnalysis,
    completedAt: attempt.completedAt,
  };
}

/**
 * Get all questions with correct answers for post-test review.
 * Only available after the test is completed.
 * Requirements: 12.1–12.8, 25.6
 *
 * @param {Object} attempt - TestAttempt document
 * @returns {Object} Sections with questions, userAnswer, correctAnswer, isCorrect
 */
export async function getAnswerReview(attempt) {
  if (attempt.status !== 'completed') {
    const err = new Error('Review is only available for completed tests');
    err.code = 'TEST_NOT_COMPLETED';
    err.status = 400;
    throw err;
  }

  const answers = attempt.answers instanceof Map
    ? Object.fromEntries(attempt.answers)
    : attempt.answers ?? {};

  // Fetch all questions WITH correctAnswer (review mode)
  const questions = await Question.find({ testId: attempt.testId })
    .sort({ section: 1, order: 1 })
    .lean();

  // Group by section in FAST order
  const sectionOrder = ['Advance Math', 'Basic Math', 'IQ & Logical', 'English'];
  const sectionMap = {};

  for (const q of questions) {
    if (!sectionMap[q.section]) sectionMap[q.section] = [];
    const userAnswer = answers[q._id.toString()] ?? null;
    sectionMap[q.section].push({
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      order: q.order,
      userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: userAnswer === q.correctAnswer,
    });
  }

  const sections = sectionOrder
    .filter(name => sectionMap[name])
    .map(name => ({ name, questions: sectionMap[name] }));

  return { sections };
}
