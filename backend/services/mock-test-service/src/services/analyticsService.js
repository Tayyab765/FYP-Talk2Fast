import TestAttempt from '../models/TestAttempt.js';
import MockTest from '../models/MockTest.js';
import Question from '../models/Question.js';
import { logger } from '../utils/logger.js';

// ─────────────────────────────────────────────────────────────────
// Test History  (Task 13.1)
// ─────────────────────────────────────────────────────────────────

/**
 * Get all completed test attempts for a user, sorted newest first.
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 *
 * @param {string} userId
 * @returns {Array} List of attempt summaries
 */
export async function getTestHistory(userId) {
  const attempts = await TestAttempt.find({ userId, status: 'completed' })
    .sort({ completedAt: -1 })
    .lean();

  // Enrich with test titles
  const testIds = [...new Set(attempts.map(a => a.testId.toString()))];
  const tests = await MockTest.find({ _id: { $in: testIds } }).select('title').lean();
  const testMap = Object.fromEntries(tests.map(t => [t._id.toString(), t.title]));

  return attempts.map(a => ({
    attemptId: a._id,
    testTitle: testMap[a.testId.toString()] ?? 'Unknown Test',
    score: a.score?.total ?? 0,
    percentage: a.score?.percentage ?? 0,
    completedAt: a.completedAt,
  }));
}

// ─────────────────────────────────────────────────────────────────
// Performance Analytics  (Task 13.3)
// ─────────────────────────────────────────────────────────────────

/**
 * Compute overall stats across all completed attempts.
 * Requirements: 14.1
 */
function computeOverallStats(attempts) {
  if (attempts.length === 0) {
    return { totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0 };
  }

  const scores = attempts.map(a => a.score?.total ?? 0);
  const sum = scores.reduce((acc, s) => acc + s, 0);

  return {
    totalAttempts: attempts.length,
    averageScore: Math.round((sum / scores.length) * 100) / 100,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
  };
}

/**
 * Compute section-wise average accuracy across all attempts.
 * Requirements: 14.2
 */
function computeSectionStats(attempts) {
  const sectionMap = new Map();

  for (const attempt of attempts) {
    for (const ss of attempt.score?.sectionScores ?? []) {
      if (!sectionMap.has(ss.section)) {
        sectionMap.set(ss.section, { section: ss.section, totalCorrect: 0, totalQuestions: 0, totalAttempts: 0 });
      }
      const s = sectionMap.get(ss.section);
      s.totalCorrect += ss.correct;
      s.totalQuestions += ss.total;
      s.totalAttempts++;
    }
  }

  return Array.from(sectionMap.values()).map(s => ({
    section: s.section,
    totalAttempts: s.totalAttempts,
    averageAccuracy: s.totalQuestions > 0
      ? Math.round((s.totalCorrect / s.totalQuestions) * 10000) / 100
      : 0,
    totalQuestions: s.totalQuestions,
    correctAnswers: s.totalCorrect,
  }));
}

/**
 * Compute topic-wise accuracy and categorise as weak/average/strong.
 * Requirements: 14.3, 14.4
 */
async function computeTopicStats(attempts) {
  if (attempts.length === 0) return [];

  const testIds = [...new Set(attempts.map(a => a.testId.toString()))];
  const questions = await Question.find({ testId: { $in: testIds } }).lean();

  const topicMap = new Map();

  for (const attempt of attempts) {
    const answers = attempt.answers instanceof Map
      ? Object.fromEntries(attempt.answers)
      : attempt.answers ?? {};

    const attemptQuestions = questions.filter(q => q.testId.toString() === attempt.testId.toString());

    for (const q of attemptQuestions) {
      if (!topicMap.has(q.topic)) {
        topicMap.set(q.topic, { topic: q.topic, totalQuestions: 0, correctAnswers: 0 });
      }
      const t = topicMap.get(q.topic);
      t.totalQuestions++;
      if (answers[q._id.toString()] === q.correctAnswer) {
        t.correctAnswers++;
      }
    }
  }

  return Array.from(topicMap.values()).map(t => {
    const accuracy = t.totalQuestions > 0
      ? Math.round((t.correctAnswers / t.totalQuestions) * 10000) / 100
      : 0;

    let category;
    if (accuracy < 60) category = 'weak';
    else if (accuracy > 80) category = 'strong';
    else category = 'average';

    return { topic: t.topic, accuracy, totalQuestions: t.totalQuestions, correctAnswers: t.correctAnswers, category };
  }).sort((a, b) => a.accuracy - b.accuracy);
}

/**
 * Build score trend array (one entry per attempt, chronological).
 */
function generateScoreTrend(attempts) {
  return attempts
    .slice()
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
    .map((a, i) => ({
      attemptNumber: i + 1,
      attemptId: a._id,
      score: a.score?.total ?? 0,
      percentage: a.score?.percentage ?? 0,
      completedAt: a.completedAt,
    }));
}

/**
 * Generate personalised recommendations.
 * Requirements: 15.1–15.5
 */
function generateRecommendations(overallStats, sectionStats, topicStats, scoreTrend) {
  const recs = [];

  // Weak topics
  const weakTopics = topicStats.filter(t => t.category === 'weak');
  weakTopics.slice(0, 3).forEach(t => {
    recs.push(`Focus on ${t.topic} — current accuracy ${t.accuracy.toFixed(1)}%`);
  });

  // Not enough attempts
  if (overallStats.totalAttempts < 3) {
    recs.push('Take more practice tests for accurate performance analysis');
  }

  // Score trend
  if (scoreTrend.length >= 3) {
    const recent = scoreTrend.slice(-3).map(t => t.score);
    if (recent[2] > recent[0]) {
      recs.push('Great progress! Your scores are improving consistently');
    } else {
      recs.push('Review your weak topics and practice more regularly');
    }
  }

  // Weakest section
  if (sectionStats.length > 0) {
    const weakest = sectionStats.reduce((min, s) => s.averageAccuracy < min.averageAccuracy ? s : min);
    if (weakest.averageAccuracy < 65) {
      recs.push(`Strengthen ${weakest.section} — current accuracy ${weakest.averageAccuracy.toFixed(1)}%`);
    }
  }

  return recs;
}

/**
 * Compute full performance analytics for a user.
 * Requirements: 14.1–14.8, 15.1–15.5
 *
 * @param {string} userId
 * @returns {Object} Full analytics payload
 */
export async function computeAnalytics(userId) {
  const attempts = await TestAttempt.find({ userId, status: 'completed' })
    .sort({ completedAt: 1 })
    .lean();

  if (attempts.length === 0) {
    return {
      overallStats: { totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0 },
      sectionWisePerformance: [],
      topicWisePerformance: [],
      scoreTrend: [],
      recommendations: ['Take your first practice test to get started!'],
    };
  }

  const overallStats = computeOverallStats(attempts);
  const sectionStats = computeSectionStats(attempts);
  const topicStats = await computeTopicStats(attempts);
  const scoreTrend = generateScoreTrend(attempts);
  const recommendations = generateRecommendations(overallStats, sectionStats, topicStats, scoreTrend);

  logger.info(`Analytics computed for userId=${userId}: ${attempts.length} attempts`);

  return {
    overallStats,
    sectionWisePerformance: sectionStats,
    topicWisePerformance: topicStats,
    scoreTrend,
    recommendations,
  };
}
