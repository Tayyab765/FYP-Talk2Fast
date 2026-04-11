import { logger } from '../utils/logger.js';

/**
 * Section durations in minutes (FAST entry test format)
 */
const SECTION_DURATIONS = [50, 20, 20, 30]; // Advance Math, Basic Math, IQ & Logical, English

/**
 * Get the duration (in minutes) for a given section index.
 * @param {number} sectionIndex - 0-3
 * @returns {number} Duration in minutes
 */
export function getSectionDuration(sectionIndex) {
  return SECTION_DURATIONS[sectionIndex] ?? 0;
}

/**
 * Calculate remaining time in seconds for the current section.
 * Uses the section's startedAt timestamp from the attempt.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.5
 * @param {Object} attempt - TestAttempt document
 * @param {number} sectionIndex - Current section index
 * @returns {number} Remaining seconds (0 if expired)
 */
export function calculateRemainingTime(attempt, sectionIndex) {
  const sectionTimestamp = attempt.sectionTimestamps?.[sectionIndex];

  if (!sectionTimestamp || sectionTimestamp.submittedAt) {
    return 0;
  }

  const durationMs = getSectionDuration(sectionIndex) * 60 * 1000;
  const startTime = new Date(sectionTimestamp.startedAt).getTime();
  const elapsed = Date.now() - startTime;
  const remainingMs = Math.max(0, durationMs - elapsed);

  return Math.floor(remainingMs / 1000);
}

/**
 * Validate whether a section submission is within the allowed time window.
 * Allows a 5-second grace period for network latency.
 *
 * Requirements: 8.4, 9.8
 * @param {Object} attempt - TestAttempt document
 * @param {number} sectionIndex - Section being submitted
 * @returns {{ valid: boolean, autoSubmitted: boolean, timeSpent: number }}
 */
export function validateSectionTiming(attempt, sectionIndex) {
  const sectionTimestamp = attempt.sectionTimestamps?.[sectionIndex];

  if (!sectionTimestamp) {
    return { valid: false, autoSubmitted: false, timeSpent: 0 };
  }

  const durationMinutes = getSectionDuration(sectionIndex);
  const startTime = new Date(sectionTimestamp.startedAt);
  const submitTime = new Date();
  const elapsedMinutes = (submitTime - startTime) / (1000 * 60);

  // 5-second grace period
  const maxAllowedMinutes = durationMinutes + 5 / 60;
  const autoSubmitted = elapsedMinutes > maxAllowedMinutes;
  const timeSpent = Math.min(elapsedMinutes, durationMinutes);

  return {
    valid: true,
    autoSubmitted,
    timeSpent: Math.round(timeSpent * 100) / 100,
  };
}

/**
 * Check whether the current section has timed out.
 * Used to detect auto-submit conditions.
 *
 * Requirements: 8.4, 9.8
 * @param {Object} attempt - TestAttempt document
 * @returns {boolean}
 */
export function hasTimedOut(attempt) {
  const sectionIndex = attempt.currentSection;
  const remaining = calculateRemainingTime(attempt, sectionIndex);

  if (remaining === 0) {
    logger.info(`Auto-submit triggered for attempt=${attempt._id} section=${sectionIndex}`);
    return true;
  }
  return false;
}
