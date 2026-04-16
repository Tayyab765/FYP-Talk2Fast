/**
 * Example routes file demonstrating how to use validation middleware
 * This file shows the proper integration of validators with route handlers
 */

import express from 'express';
import { authenticate, authenticateOrGuest } from '../middlewares/authMiddleware.js';
import {
  validateAnswerSubmission,
  validateMarkForReview,
  validateSectionSubmission,
  validateTestStart,
  validateAttemptId,
  validateTestCreation,
  validateQuestionCreation,
  sanitizeInputs
} from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInputs);

/**
 * Example: Save answer endpoint
 * Uses validateAnswerSubmission to ensure:
 * - attemptId is a valid MongoDB ObjectId
 * - questionId is provided and sanitized
 * - answer is one of A, B, C, D
 */
router.put(
  '/attempts/:attemptId/answer',
  authenticateOrGuest,
  validateAnswerSubmission,
  async (req, res) => {
    try {
      const { attemptId } = req.params;
      const { questionId, answer } = req.body;
      const userId = req.user.userId;
      
      // At this point, all inputs are validated and sanitized
      // Implement your business logic here
      
      res.json({
        success: true,
        questionId,
        answer,
        savedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to save answer',
        code: 'SAVE_ERROR'
      });
    }
  }
);

/**
 * Example: Mark for review endpoint
 * Uses validateMarkForReview to ensure:
 * - attemptId is valid
 * - questionId is provided and sanitized
 * - marked is a boolean
 */
router.put(
  '/attempts/:attemptId/mark-review',
  authenticateOrGuest,
  validateMarkForReview,
  async (req, res) => {
    try {
      const { attemptId } = req.params;
      const { questionId, marked } = req.body;
      
      // Validated inputs - implement business logic
      
      res.json({
        success: true,
        questionId,
        marked
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to update review status',
        code: 'REVIEW_ERROR'
      });
    }
  }
);

/**
 * Example: Submit section endpoint
 * Uses validateSectionSubmission to ensure:
 * - attemptId is valid
 * - sectionIndex is between 0 and 3
 */
router.post(
  '/attempts/:attemptId/submit-section',
  authenticateOrGuest,
  validateSectionSubmission,
  async (req, res) => {
    try {
      const { attemptId } = req.params;
      const { sectionIndex } = req.body;
      
      // Validated inputs - implement business logic
      
      res.json({
        sectionSubmitted: sectionIndex,
        nextSection: sectionIndex + 1,
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to submit section',
        code: 'SUBMIT_ERROR'
      });
    }
  }
);

/**
 * Example: Start test endpoint
 * Uses validateTestStart to ensure testId is valid
 */
router.post(
  '/:testId/start',
  authenticateOrGuest,
  validateTestStart,
  async (req, res) => {
    try {
      const { testId } = req.params;
      const userId = req.user.userId;
      
      // Validated inputs - implement business logic
      
      res.json({
        attemptId: 'new-attempt-id',
        currentSection: 0,
        sectionName: 'Advance Math',
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to start test',
        code: 'START_ERROR'
      });
    }
  }
);

/**
 * Example: Get attempt endpoint
 * Uses validateAttemptId to ensure attemptId is valid
 */
router.get(
  '/attempts/:attemptId',
  authenticateOrGuest,
  validateAttemptId,
  async (req, res) => {
    try {
      const { attemptId } = req.params;
      const userId = req.user.userId;
      
      // Validated inputs - implement business logic
      
      res.json({
        attemptId,
        currentSection: 0,
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get attempt',
        code: 'GET_ERROR'
      });
    }
  }
);

/**
 * Example: Create test endpoint (admin only)
 * Uses validateTestCreation to ensure:
 * - title, description are provided and sanitized
 * - difficulty is one of: easy, medium, hard
 * - sections array has exactly 4 sections
 * - all section fields are valid
 */
router.post(
  '/',
  authenticate, // Admin only - would need additional role check
  validateTestCreation,
  async (req, res) => {
    try {
      const { title, description, difficulty, sections } = req.body;
      
      // All inputs are validated and sanitized
      // Implement test creation logic
      
      res.status(201).json({
        success: true,
        testId: 'new-test-id',
        title,
        difficulty
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to create test',
        code: 'CREATE_ERROR'
      });
    }
  }
);

/**
 * Example: Create question endpoint (admin only)
 * Uses validateQuestionCreation to ensure:
 * - all required fields are present
 * - options A, B, C, D are all provided
 * - correctAnswer is one of A, B, C, D
 * - all text inputs are sanitized
 */
router.post(
  '/questions',
  authenticate, // Admin only
  validateQuestionCreation,
  async (req, res) => {
    try {
      const { testId, section, questionText, options, correctAnswer, topic, difficulty, order } = req.body;
      
      // All inputs are validated and sanitized
      // Implement question creation logic
      
      res.status(201).json({
        success: true,
        questionId: 'new-question-id',
        section,
        order
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to create question',
        code: 'CREATE_ERROR'
      });
    }
  }
);

export default router;
