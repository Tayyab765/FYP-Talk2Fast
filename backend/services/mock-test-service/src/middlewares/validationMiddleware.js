/**
 * Validation Middleware for Mock Test Service
 * 
 * This middleware provides comprehensive input validation and sanitization
 * to prevent injection attacks and ensure data integrity.
 * 
 * Security Features:
 * - HTML/XSS Prevention: Removes all HTML tags including script tags
 * - MongoDB Injection Prevention: Removes MongoDB operators ($where, $ne, etc.) and special characters
 * - NoSQL Injection Prevention: Removes logical operators (||, &&)
 * - SQL Injection Prevention: Removes quotes, semicolons, and SQL comments (defense in depth)
 * - Prototype Pollution Prevention: Filters dangerous object keys (__proto__, constructor, prototype)
 * - Null Byte Injection Prevention: Removes null bytes
 * - Control Character Filtering: Removes control characters except newlines and tabs
 * - ObjectId Validation: Ensures MongoDB ObjectIds are valid hexadecimal strings
 * - Nested Object Sanitization: Recursively sanitizes nested objects and arrays
 * - Query Parameter Sanitization: Sanitizes URL query parameters in addition to request body
 * 
 * Requirements: 25.5 - Input sanitization to prevent injection attacks
 * 
 * Usage:
 * - Global sanitization is applied via sanitizeInputs middleware on all routes
 * - Specific validation chains are applied per endpoint for data type validation
 * - All string inputs are automatically sanitized before reaching controllers
 */

import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Middleware to handle validation errors
 * Should be used after validation chains
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
}

/**
 * Sanitize string input to prevent injection attacks
 * Removes HTML tags and special characters that could be used for injection
 * Requirements: 25.5
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  
  // Remove HTML tags (including script tags and their content)
  let sanitized = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove MongoDB injection operators
  sanitized = sanitized.replace(/\$\w+/g, ''); // Remove $where, $ne, $gt, etc.
  sanitized = sanitized.replace(/[{}]/g, ''); // Remove curly braces
  
  // Remove NoSQL injection patterns
  sanitized = sanitized.replace(/\|\|/g, ''); // Remove OR operators
  sanitized = sanitized.replace(/&&/g, ''); // Remove AND operators
  
  // Remove SQL injection patterns (defense in depth)
  sanitized = sanitized.replace(/['";]/g, ''); // Remove quotes and semicolons
  sanitized = sanitized.replace(/--/g, ''); // Remove SQL comments
  sanitized = sanitized.replace(/\/\*/g, ''); // Remove block comment start
  sanitized = sanitized.replace(/\*\//g, ''); // Remove block comment end
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Custom validator to check if value is a valid MongoDB ObjectId
 * Also sanitizes the input to prevent injection
 * Requirements: 25.5
 */
function isValidObjectId(value) {
  // First sanitize the value
  if (typeof value === 'string') {
    value = value.trim();
    // ObjectIds should only contain hexadecimal characters
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
      return false;
    }
  }
  return mongoose.Types.ObjectId.isValid(value);
}

/**
 * Validation chain for answer submission
 * Validates: answer (A, B, C, D), questionId (valid ObjectId)
 * Requirements: 25.1, 25.2
 */
export const validateAnswerSubmission = [
  param('attemptId')
    .custom(isValidObjectId)
    .withMessage('Invalid attempt ID'),
  
  body('questionId')
    .notEmpty()
    .withMessage('Question ID is required')
    .isString()
    .withMessage('Question ID must be a string')
    .customSanitizer(sanitizeString),
  
  body('answer')
    .notEmpty()
    .withMessage('Answer is required')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Answer must be one of: A, B, C, D'),
  
  handleValidationErrors
];

/**
 * Validation chain for mark for review
 * Validates: questionId, marked (boolean)
 * Requirements: 25.2
 */
export const validateMarkForReview = [
  param('attemptId')
    .custom(isValidObjectId)
    .withMessage('Invalid attempt ID'),
  
  body('questionId')
    .notEmpty()
    .withMessage('Question ID is required')
    .isString()
    .withMessage('Question ID must be a string')
    .customSanitizer(sanitizeString),
  
  body('marked')
    .isBoolean()
    .withMessage('Marked must be a boolean value'),
  
  handleValidationErrors
];

/**
 * Validation chain for section submission
 * Validates: sectionIndex (0-3)
 * Requirements: 25.3
 */
export const validateSectionSubmission = [
  param('attemptId')
    .custom(isValidObjectId)
    .withMessage('Invalid attempt ID'),
  
  body('sectionIndex')
    .exists()
    .withMessage('Section index is required')
    .custom((value) => {
      // Log the value for debugging
      console.log('Validating sectionIndex:', value, 'type:', typeof value);
      return true;
    })
    .isInt({ min: 0, max: 3 })
    .withMessage('Section index must be between 0 and 3'),
  
  handleValidationErrors
];

/**
 * Validation chain for test start
 * Validates: difficulty (easy, medium, hard)
 */
export const validateTestStart = [
  body('difficulty')
    .notEmpty()
    .withMessage('Difficulty is required')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be one of: easy, medium, hard'),
  
  handleValidationErrors
];

/**
 * Validation chain for getting attempt
 * Validates: attemptId (valid ObjectId)
 */
export const validateAttemptId = [
  param('attemptId')
    .custom(isValidObjectId)
    .withMessage('Invalid attempt ID'),
  
  handleValidationErrors
];

/**
 * Validation chain for test creation (admin)
 * Validates: title, description, difficulty, sections
 * Requirements: 25.5 (input sanitization)
 */
export const validateTestCreation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .customSanitizer(sanitizeString),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
    .customSanitizer(sanitizeString),
  
  body('difficulty')
    .notEmpty()
    .withMessage('Difficulty is required')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be one of: easy, medium, hard'),
  
  body('sections')
    .isArray({ min: 4, max: 4 })
    .withMessage('Test must have exactly 4 sections'),
  
  body('sections.*.name')
    .notEmpty()
    .withMessage('Section name is required')
    .customSanitizer(sanitizeString),
  
  body('sections.*.questionCount')
    .isInt({ min: 1 })
    .withMessage('Question count must be a positive integer'),
  
  body('sections.*.duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Validation chain for question creation
 * Validates: questionText, options, correctAnswer, topic, difficulty
 * Requirements: 25.5 (input sanitization)
 */
export const validateQuestionCreation = [
  body('testId')
    .custom(isValidObjectId)
    .withMessage('Invalid test ID'),
  
  body('section')
    .notEmpty()
    .withMessage('Section is required')
    .customSanitizer(sanitizeString),
  
  body('questionText')
    .notEmpty()
    .withMessage('Question text is required')
    .isString()
    .withMessage('Question text must be a string')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Question text must be between 5 and 1000 characters')
    .customSanitizer(sanitizeString),
  
  body('options')
    .isObject()
    .withMessage('Options must be an object'),
  
  body('options.A')
    .notEmpty()
    .withMessage('Option A is required')
    .customSanitizer(sanitizeString),
  
  body('options.B')
    .notEmpty()
    .withMessage('Option B is required')
    .customSanitizer(sanitizeString),
  
  body('options.C')
    .notEmpty()
    .withMessage('Option C is required')
    .customSanitizer(sanitizeString),
  
  body('options.D')
    .notEmpty()
    .withMessage('Option D is required')
    .customSanitizer(sanitizeString),
  
  body('correctAnswer')
    .notEmpty()
    .withMessage('Correct answer is required')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Correct answer must be one of: A, B, C, D'),
  
  body('topic')
    .notEmpty()
    .withMessage('Topic is required')
    .customSanitizer(sanitizeString),
  
  body('difficulty')
    .notEmpty()
    .withMessage('Difficulty is required')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be one of: easy, medium, hard'),
  
  body('order')
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Recursively sanitize an object or array
 * Requirements: 25.5
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  // Preserve numbers and booleans
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      // Sanitize the key itself to prevent prototype pollution
      const sanitizedKey = sanitizeString(key);
      
      // Skip dangerous keys
      if (sanitizedKey === '__proto__' || sanitizedKey === 'constructor' || sanitizedKey === 'prototype') {
        continue;
      }
      
      sanitized[sanitizedKey] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Middleware to sanitize all string inputs in request body
 * Applied globally to prevent injection attacks
 * Handles nested objects and arrays
 * Requirements: 25.5
 */
export function sanitizeInputs(req, res, next) {
  // Log the original body for debugging
  console.log('========== SANITIZE MIDDLEWARE ==========')
  console.log('Original request body:', JSON.stringify(req.body));
  console.log('Original body type:', typeof req.body);
  console.log('Original body keys:', Object.keys(req.body || {}));
  
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Also sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Log the sanitized body for debugging
  console.log('Sanitized request body:', JSON.stringify(req.body));
  console.log('Sanitized body keys:', Object.keys(req.body || {}));
  console.log('=========================================')
  
  next();
}
