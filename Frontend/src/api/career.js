/**
 * Career Counseling API Module
 * All career endpoint calls centralised here.
 * Builds on the existing httpJson utility (handles token, errors, JSON).
 */
import { httpJson } from './http'

// ─── Assessment Questions ───────────────────────────────────────────────────

/**
 * GET /api/career/questions
 * Returns { questions: [...], categories: [...], totalQuestions: number }
 * Public endpoint — no auth required.
 */
export async function fetchQuestions() {
  return httpJson('/api/career/questions', { method: 'GET' })
}

// ─── Career Profile ─────────────────────────────────────────────────────────

/**
 * GET /api/career/profile
 * Returns the current user's saved career profile (answers object).
 * Requires Bearer token (authenticateOrGuest middleware).
 */
export async function fetchProfile() {
  return httpJson('/api/career/profile', { method: 'GET' })
}

/**
 * POST /api/career/profile
 * Submit questionnaire answers as a new profile.
 * @param {Object} answers - flat map of questionId → answer value(s)
 */
export async function submitProfile(answers) {
  return httpJson('/api/career/profile', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

/**
 * PUT /api/career/profile
 * Overwrite existing profile with updated answers.
 * @param {Object} answers
 */
export async function updateProfile(answers) {
  return httpJson('/api/career/profile', {
    method: 'PUT',
    body: JSON.stringify({ answers }),
  })
}

// ─── AI Recommendations ─────────────────────────────────────────────────────

/**
 * POST /api/career/recommend
 * Trigger AI-powered degree recommendations based on the user's saved profile.
 * Returns { sessionId, recommendations: [...] }
 * Can take 10–30 s if Ollama is generating.
 */
export async function generateRecommendations() {
  return httpJson('/api/career/recommend', { method: 'POST' })
}

// ─── Career Chat ────────────────────────────────────────────────────────────

/**
 * GET /api/career/session/active
 * Returns the currently active counseling session (or 404).
 */
export async function getActiveSession() {
  return httpJson('/api/career/session/active', { method: 'GET' })
}

/**
 * POST /api/career/chat/:sessionId
 * Send a follow-up message in a counseling session.
 * @param {string} sessionId - 24-char hex MongoDB ObjectId
 * @param {string} message
 * Returns { response: string }
 */
export async function sendChatMessage(sessionId, message) {
  return httpJson(`/api/career/chat/${sessionId}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

// ─── Career Stats (career-stats-service :5004) ──────────────────────────────

/**
 * GET /api/careers
 * Returns full list of careers from pakistan_job_salaries.json
 * { success, count, careers: [...] }
 */
export async function fetchCareers(query = '') {
  const qs = query ? `?q=${encodeURIComponent(query)}` : ''
  const path = query ? `/api/careers/search${qs}` : '/api/careers'
  return httpJson(path, { method: 'GET' })
}

/**
 * GET /api/careers/stats
 * Returns salary statistics { total_jobs, min_salary, max_salary, avg_salary, median_salary }
 */
export async function fetchCareerStats() {
  return httpJson('/api/careers/stats', { method: 'GET' })
}
