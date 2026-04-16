/**
 * Scoring Service
 * Calculates scores for completed test attempts.
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

/**
 * Group an array of items by a key function.
 * @param {Array} arr
 * @param {Function} keyFn
 * @returns {Object}
 */
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Calculate the full score breakdown for a completed test attempt.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 * @param {Object} attempt  - TestAttempt document (with answers Map)
 * @param {Array}  questions - All Question documents for the test (with correctAnswer)
 * @returns {{ total: number, percentage: number, sectionScores: Array }}
 */
export function calculateScore(attempt, questions) {
  // Normalise answers to a plain object regardless of Map or plain object
  const answers = attempt.answers instanceof Map
    ? Object.fromEntries(attempt.answers)
    : attempt.answers ?? {};

  const questionsBySection = groupBy(questions, q => q.section);
  const sectionScores = [];
  let totalCorrect = 0;

  for (const [sectionName, sectionQuestions] of Object.entries(questionsBySection)) {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    for (const question of sectionQuestions) {
      const userAnswer = answers[question._id.toString()];

      if (!userAnswer) {
        unattempted++;
      } else if (userAnswer === question.correctAnswer) {
        correct++;
        totalCorrect++;
      } else {
        incorrect++;
      }
    }

    const sectionTotal = sectionQuestions.length;
    const percentage = sectionTotal > 0 ? (correct / sectionTotal) * 100 : 0;

    sectionScores.push({
      section: sectionName,
      correct,
      incorrect,
      unattempted,
      total: sectionTotal,
      percentage: Math.round(percentage * 100) / 100,
    });
  }

  const totalQuestions = questions.length;
  const overallPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return {
    total: totalCorrect,
    percentage: Math.round(overallPercentage * 100) / 100,
    sectionScores,
  };
}
