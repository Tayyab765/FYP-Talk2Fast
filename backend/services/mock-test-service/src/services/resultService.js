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

  // For dynamic tests, generate title from difficulty
  let testTitle = 'FAST Entry Test';
  if (attempt.testDifficulty) {
    testTitle = `FAST Entry Test - ${attempt.testDifficulty.charAt(0).toUpperCase() + attempt.testDifficulty.slice(1)}`;
  } else if (attempt.testId) {
    // Legacy: fetch from MockTest if testId exists
    const test = await MockTest.findById(attempt.testId).lean();
    if (test) {
      testTitle = test.title;
    }
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

  // Calculate total questions from section scores
  const totalQuestions = attempt.score.sectionScores.reduce((sum, section) => sum + section.total, 0);

  return {
    attemptId: attempt._id,
    testTitle,
    testDifficulty: attempt.testDifficulty,
    score: attempt.score,
    totalQuestions,
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

  // Collect all question IDs from the attempt's questionOrder
  const allQuestionIds = [];
  for (const [sectionName, questionIds] of attempt.questionOrder.entries()) {
    allQuestionIds.push(...questionIds);
  }

  // Fetch all questions WITH correctAnswer (review mode)
  const questions = await Question.find({ _id: { $in: allQuestionIds } })
    .lean();

  // Group by section in FAST order
  const sectionOrder = ['Advance Math', 'Basic Math', 'IQ & Logical', 'English'];
  const sectionMap = {};

  // Organize questions by section, maintaining the order from questionOrder
  for (const sectionName of sectionOrder) {
    const questionIds = attempt.questionOrder.get(sectionName);
    if (!questionIds) continue;

    sectionMap[sectionName] = [];
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    for (const qId of questionIds) {
      const q = questionMap.get(qId);
      if (!q) continue;

      const userAnswer = answers[q._id.toString()] ?? null;
      sectionMap[sectionName].push({
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
  }

  const sections = sectionOrder
    .filter(name => sectionMap[name] && sectionMap[name].length > 0)
    .map(name => ({ name, questions: sectionMap[name] }));

  return { sections };
}
