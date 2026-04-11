import { httpJson } from './http'

/**
 * Mock Test API Client
 * Provides functions to interact with the Mock Test Service backend
 * All endpoints are prefixed with /api/mock-tests
 */

// ============================================================================
// Test Management APIs
// ============================================================================

/**
 * Get list of all available test templates
 * @param {Object} options - Optional filters
 * @param {string} options.difficulty - Filter by difficulty (easy, medium, hard)
 * @returns {Promise<Object>} List of tests with user attempt counts
 */
export async function getTests(options = {}) {
  const params = new URLSearchParams()
  if (options.difficulty) {
    params.append('difficulty', options.difficulty)
  }

  const queryString = params.toString()
  const path = `/api/mock-tests${queryString ? `?${queryString}` : ''}`

  return httpJson(path, { method: 'GET' })
}

/**
 * Get detailed information about a specific test
 * @param {string} testId - Test template ID
 * @returns {Promise<Object>} Test details without answers
 */
export async function getTest(testId) {
  return httpJson(`/api/mock-tests/${testId}`, { method: 'GET' })
}

// ============================================================================
// Test Taking APIs
// ============================================================================

/**
 * Start a new test attempt
 * @param {string} testId - Test template ID
 * @returns {Promise<Object>} Attempt details with first section questions
 */
export async function startTest(testId) {
  return httpJson(`/api/mock-tests/${testId}/start`, { method: 'POST' })
}

/**
 * Get current attempt state (for resuming)
 * @param {string} attemptId - Test attempt ID
 * @returns {Promise<Object>} Current attempt state with questions and timing
 */
export async function getAttempt(attemptId) {
  return httpJson(`/api/mock-tests/attempts/${attemptId}`, { method: 'GET' })
}

/**
 * Save answer for a question (auto-save)
 * @param {string} attemptId - Test attempt ID
 * @param {Object} data - Answer data
 * @param {string} data.questionId - Question ID
 * @param {string} data.answer - Selected answer (A, B, C, or D)
 * @returns {Promise<Object>} Save confirmation with timestamp
 */
export async function saveAnswer(attemptId, data) {
  return httpJson(`/api/mock-tests/attempts/${attemptId}/answer`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Mark or unmark a question for review
 * @param {string} attemptId - Test attempt ID
 * @param {Object} data - Mark for review data
 * @param {string} data.questionId - Question ID
 * @param {boolean} data.marked - True to mark, false to unmark
 * @returns {Promise<Object>} Update confirmation
 */
export async function markForReview(attemptId, data) {
  return httpJson(`/api/mock-tests/attempts/${attemptId}/mark-review`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Submit current section and move to next
 * @param {string} attemptId - Test attempt ID
 * @param {Object} data - Section submission data
 * @param {number} data.sectionIndex - Current section index (0-3)
 * @returns {Promise<Object>} Next section details with questions
 */
export async function submitSection(attemptId, data) {
  console.log('submitSection API called with:', attemptId, data)
  console.log('Data to stringify:', data)
  
  // Validate that sectionIndex is present and is a number
  if (data.sectionIndex === undefined || data.sectionIndex === null) {
    console.error('ERROR: sectionIndex is undefined or null!', data)
    throw new Error('sectionIndex is required for section submission')
  }
  
  if (typeof data.sectionIndex !== 'number') {
    console.error('ERROR: sectionIndex is not a number!', typeof data.sectionIndex, data.sectionIndex)
    throw new Error('sectionIndex must be a number')
  }
  
  const bodyString = JSON.stringify(data)
  console.log('Stringified body:', bodyString)
  
  return httpJson(`/api/mock-tests/attempts/${attemptId}/submit-section`, {
    method: 'POST',
    body: bodyString,
  })
}

/**
 * Submit entire test (final section)
 * @param {string} attemptId - Test attempt ID
 * @returns {Promise<Object>} Test completion status with score
 */
export async function submitTest(attemptId) {
  return httpJson(`/api/mock-tests/attempts/${attemptId}/submit`, {
    method: 'POST',
  })
}

// ============================================================================
// Results and Review APIs
// ============================================================================

/**
 * Get detailed test results
 * @param {string} attemptId - Test attempt ID
 * @returns {Promise<Object>} Score breakdown and time analysis
 */
export async function getResults(attemptId) {
  return httpJson(`/api/mock-tests/attempts/${attemptId}/results`, {
    method: 'GET',
  })
}

/**
 * Get all questions with answers for review
 * @param {string} attemptId - Test attempt ID
 * @returns {Promise<Object>} All questions organized by section with correct answers
 */
export async function getReview(attemptId) {
  return httpJson(`/api/mock-tests/attempts/${attemptId}/review`, {
    method: 'GET',
  })
}

// ============================================================================
// Analytics APIs
// ============================================================================

/**
 * Get user's test history
 * @returns {Promise<Object>} List of all completed test attempts
 */
export async function getHistory() {
  return httpJson('/api/mock-tests/analytics/history', { method: 'GET' })
}

/**
 * Get performance analytics
 * @returns {Promise<Object>} Comprehensive performance statistics and recommendations
 */
export async function getPerformance() {
  return httpJson('/api/mock-tests/analytics/performance', { method: 'GET' })
}
