/**
 * Unit tests for validation middleware
 * Tests answer validation, question ID validation, section index validation, and input sanitization
 */

import { 
  validateAnswerSubmission, 
  validateMarkForReview,
  validateSectionSubmission,
  validateTestStart,
  validateAttemptId,
  validateTestCreation,
  validateQuestionCreation,
  sanitizeInputs
} from './validationMiddleware.js';

// Mock request and response objects
function createMockReq(params = {}, body = {}) {
  return {
    params,
    body,
    headers: {}
  };
}

function createMockRes() {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
}

// Test answer validation
console.log('Testing answer validation...');

// Valid answer
let req = createMockReq(
  { attemptId: '507f1f77bcf86cd799439011' },
  { questionId: 'q1', answer: 'A' }
);
let res = createMockRes();
let nextCalled = false;
let next = () => { nextCalled = true; };

// Run validation chain manually
const answerValidators = validateAnswerSubmission.slice(0, -1); // Exclude handleValidationErrors
for (const validator of answerValidators) {
  await validator.run(req);
}

// Check if validation passed
const { validationResult } = await import('express-validator');
const errors = validationResult(req);
console.log('Valid answer (A):', errors.isEmpty() ? 'PASS' : 'FAIL', errors.array());

// Invalid answer
req = createMockReq(
  { attemptId: '507f1f77bcf86cd799439011' },
  { questionId: 'q1', answer: 'E' }
);
for (const validator of answerValidators) {
  await validator.run(req);
}
const errors2 = validationResult(req);
console.log('Invalid answer (E):', !errors2.isEmpty() ? 'PASS' : 'FAIL');

// Missing answer
req = createMockReq(
  { attemptId: '507f1f77bcf86cd799439011' },
  { questionId: 'q1' }
);
for (const validator of answerValidators) {
  await validator.run(req);
}
const errors3 = validationResult(req);
console.log('Missing answer:', !errors3.isEmpty() ? 'PASS' : 'FAIL');

// Test section index validation
console.log('\nTesting section index validation...');

// Valid section index
req = createMockReq(
  { attemptId: '507f1f77bcf86cd799439011' },
  { sectionIndex: 2 }
);
const sectionValidators = validateSectionSubmission.slice(0, -1);
for (const validator of sectionValidators) {
  await validator.run(req);
}
const errors4 = validationResult(req);
console.log('Valid section index (2):', errors4.isEmpty() ? 'PASS' : 'FAIL');

// Invalid section index (out of range)
req = createMockReq(
  { attemptId: '507f1f77bcf86cd799439011' },
  { sectionIndex: 5 }
);
for (const validator of sectionValidators) {
  await validator.run(req);
}
const errors5 = validationResult(req);
console.log('Invalid section index (5):', !errors5.isEmpty() ? 'PASS' : 'FAIL');

// Negative section index
req = createMockReq(
  { attemptId: '507f1f77bcf86cd799439011' },
  { sectionIndex: -1 }
);
for (const validator of sectionValidators) {
  await validator.run(req);
}
const errors6 = validationResult(req);
console.log('Negative section index (-1):', !errors6.isEmpty() ? 'PASS' : 'FAIL');

// Test question ID validation
console.log('\nTesting question ID validation...');

// Valid question ID
req = createMockReq(
  { attemptId: '507f1f77bcf86cd799439011' },
  { questionId: 'q123', answer: 'B' }
);
for (const validator of answerValidators) {
  await validator.run(req);
}
const errors7 = validationResult(req);
console.log('Valid question ID:', errors7.isEmpty() ? 'PASS' : 'FAIL');

// Empty question ID
req = createMockReq(
  { attemptId: '507f1f77bcf86cd799439011' },
  { questionId: '', answer: 'B' }
);
for (const validator of answerValidators) {
  await validator.run(req);
}
const errors8 = validationResult(req);
console.log('Empty question ID:', !errors8.isEmpty() ? 'PASS' : 'FAIL');

// Test input sanitization
console.log('\nTesting input sanitization...');

// Test HTML tag removal
req = createMockReq({}, { 
  title: '<script>alert("xss")</script>Test Title',
  description: 'Normal text with <b>bold</b> tags'
});
res = createMockRes();
nextCalled = false;
sanitizeInputs(req, res, () => { nextCalled = true; });
console.log('HTML tag removal:', 
  req.body.title === 'Test Title' && 
  req.body.description === 'Normal text with bold tags' ? 'PASS' : 'FAIL'
);
console.log('  Sanitized title:', req.body.title);
console.log('  Sanitized description:', req.body.description);

// Test MongoDB injection prevention
req = createMockReq({}, { 
  query: 'test$where',
  data: 'value{$ne:null}'
});
sanitizeInputs(req, res, () => {});
console.log('MongoDB injection prevention:', 
  !req.body.query.includes('$') && 
  !req.body.data.includes('$') ? 'PASS' : 'FAIL'
);
console.log('  Sanitized query:', req.body.query);
console.log('  Sanitized data:', req.body.data);

// Test SQL injection prevention
req = createMockReq({}, { 
  input: "test'; DROP TABLE users--",
  comment: "/* malicious */ SELECT * FROM users"
});
sanitizeInputs(req, res, () => {});
console.log('SQL injection prevention:', 
  !req.body.input.includes("'") && 
  !req.body.input.includes(';') &&
  !req.body.input.includes('--') &&
  !req.body.comment.includes('/*') ? 'PASS' : 'FAIL'
);
console.log('  Sanitized input:', req.body.input);
console.log('  Sanitized comment:', req.body.comment);

// Test nested object sanitization
req = createMockReq({}, { 
  user: {
    name: '<script>alert("xss")</script>John',
    email: 'test@example.com',
    metadata: {
      bio: 'Hello $where world'
    }
  }
});
sanitizeInputs(req, res, () => {});
console.log('Nested object sanitization:', 
  req.body.user.name === 'John' && 
  !req.body.user.metadata.bio.includes('$') ? 'PASS' : 'FAIL'
);
console.log('  Sanitized nested name:', req.body.user.name);
console.log('  Sanitized nested bio:', req.body.user.metadata.bio);

// Test array sanitization
req = createMockReq({}, { 
  tags: ['tag1<b>bold</b>', 'tag2$where', 'tag3']
});
sanitizeInputs(req, res, () => {});
console.log('Array sanitization:', 
  req.body.tags[0] === 'tag1bold' && 
  !req.body.tags[1].includes('$') ? 'PASS' : 'FAIL'
);
console.log('  Sanitized tags:', req.body.tags);

// Test prototype pollution prevention
req = createMockReq({}, { 
  '__proto__': { admin: true },
  'constructor': { admin: true },
  'normalKey': 'normalValue'
});
sanitizeInputs(req, res, () => {});
console.log('Prototype pollution prevention:', 
  !req.body.hasOwnProperty('__proto__') && 
  !req.body.hasOwnProperty('constructor') &&
  req.body.normalKey === 'normalValue' ? 'PASS' : 'FAIL'
);
console.log('  Sanitized keys:', Object.keys(req.body));

// Test null byte removal
req = createMockReq({}, { 
  filename: 'test\0.txt'
});
sanitizeInputs(req, res, () => {});
console.log('Null byte removal:', 
  !req.body.filename.includes('\0') ? 'PASS' : 'FAIL'
);
console.log('  Sanitized filename:', req.body.filename);

// Test control character removal
req = createMockReq({}, { 
  text: 'Hello\x00\x01\x02World\nNewline\tTab'
});
sanitizeInputs(req, res, () => {});
console.log('Control character removal:', 
  req.body.text.includes('\n') && 
  req.body.text.includes('\t') &&
  !req.body.text.includes('\x00') ? 'PASS' : 'FAIL'
);
console.log('  Sanitized text:', JSON.stringify(req.body.text));

// Test ObjectId validation
console.log('\nTesting ObjectId validation...');

// Valid ObjectId
req = createMockReq({ attemptId: '507f1f77bcf86cd799439011' });
const attemptValidators = validateAttemptId.slice(0, -1);
for (const validator of attemptValidators) {
  await validator.run(req);
}
const errors9 = validationResult(req);
console.log('Valid ObjectId:', errors9.isEmpty() ? 'PASS' : 'FAIL');

// Invalid ObjectId
req = createMockReq({ attemptId: 'invalid-id' });
for (const validator of attemptValidators) {
  await validator.run(req);
}
const errors10 = validationResult(req);
console.log('Invalid ObjectId:', !errors10.isEmpty() ? 'PASS' : 'FAIL');

console.log('\n✅ All validation tests completed!');
