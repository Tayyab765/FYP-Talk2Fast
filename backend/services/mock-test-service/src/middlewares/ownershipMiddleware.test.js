/**
 * Unit tests for ownership middleware
 * Tests authorization enforcement to prevent cross-user data access
 * Requirements: 18.6, 25.4
 */

import { verifyAttemptOwnership } from './ownershipMiddleware.js';
import TestAttempt from '../models/TestAttempt.js';

// Mock TestAttempt model
const mockAttempts = new Map();

TestAttempt.findById = async (id) => {
  return mockAttempts.get(id) || null;
};

// Helper to create mock request
function createMockReq(attemptId, userId) {
  return {
    params: { attemptId },
    user: { userId }
  };
}

// Helper to create mock response
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

// Test suite
console.log('Testing ownership middleware...\n');

// Setup test data
mockAttempts.set('attempt_user1', {
  _id: 'attempt_user1',
  userId: 'user1',
  testId: 'test1',
  status: 'in_progress'
});

mockAttempts.set('attempt_user2', {
  _id: 'attempt_user2',
  userId: 'user2',
  testId: 'test1',
  status: 'in_progress'
});

mockAttempts.set('attempt_guest1', {
  _id: 'attempt_guest1',
  userId: 'guest_abc123',
  userType: 'guest',
  testId: 'test1',
  status: 'in_progress'
});

// Test 1: User can access their own attempt
console.log('Test 1: User can access their own attempt');
let req = createMockReq('attempt_user1', 'user1');
let res = createMockRes();
let nextCalled = false;
await verifyAttemptOwnership(req, res, () => { nextCalled = true; });
console.log(nextCalled ? '✓ PASS' : '✗ FAIL');
console.log(`  Status: ${res.statusCode || 'next() called'}`);
console.log(`  Attempt attached: ${req.attempt ? 'Yes' : 'No'}\n`);

// Test 2: User cannot access another user's attempt
console.log('Test 2: User cannot access another user\'s attempt');
req = createMockReq('attempt_user2', 'user1');
res = createMockRes();
nextCalled = false;
await verifyAttemptOwnership(req, res, () => { nextCalled = true; });
console.log(!nextCalled && res.statusCode === 403 ? '✓ PASS' : '✗ FAIL');
console.log(`  Status: ${res.statusCode}`);
console.log(`  Error: ${res.jsonData?.error}`);
console.log(`  Code: ${res.jsonData?.code}\n`);

// Test 3: Guest can access their own attempt
console.log('Test 3: Guest can access their own attempt');
req = createMockReq('attempt_guest1', 'guest_abc123');
res = createMockRes();
nextCalled = false;
await verifyAttemptOwnership(req, res, () => { nextCalled = true; });
console.log(nextCalled ? '✓ PASS' : '✗ FAIL');
console.log(`  Status: ${res.statusCode || 'next() called'}`);
console.log(`  Attempt attached: ${req.attempt ? 'Yes' : 'No'}\n`);

// Test 4: Guest cannot access another guest's attempt
console.log('Test 4: Guest cannot access another guest\'s attempt');
req = createMockReq('attempt_guest1', 'guest_xyz789');
res = createMockRes();
nextCalled = false;
await verifyAttemptOwnership(req, res, () => { nextCalled = true; });
console.log(!nextCalled && res.statusCode === 403 ? '✓ PASS' : '✗ FAIL');
console.log(`  Status: ${res.statusCode}`);
console.log(`  Error: ${res.jsonData?.error}`);
console.log(`  Code: ${res.jsonData?.code}\n`);

// Test 5: Authenticated user cannot access guest attempt
console.log('Test 5: Authenticated user cannot access guest attempt');
req = createMockReq('attempt_guest1', 'user1');
res = createMockRes();
nextCalled = false;
await verifyAttemptOwnership(req, res, () => { nextCalled = true; });
console.log(!nextCalled && res.statusCode === 403 ? '✓ PASS' : '✗ FAIL');
console.log(`  Status: ${res.statusCode}`);
console.log(`  Error: ${res.jsonData?.error}\n`);

// Test 6: Guest cannot access authenticated user's attempt
console.log('Test 6: Guest cannot access authenticated user\'s attempt');
req = createMockReq('attempt_user1', 'guest_abc123');
res = createMockRes();
nextCalled = false;
await verifyAttemptOwnership(req, res, () => { nextCalled = true; });
console.log(!nextCalled && res.statusCode === 403 ? '✓ PASS' : '✗ FAIL');
console.log(`  Status: ${res.statusCode}`);
console.log(`  Error: ${res.jsonData?.error}\n`);

// Test 7: Non-existent attempt returns 404
console.log('Test 7: Non-existent attempt returns 404');
req = createMockReq('attempt_nonexistent', 'user1');
res = createMockRes();
nextCalled = false;
await verifyAttemptOwnership(req, res, () => { nextCalled = true; });
console.log(!nextCalled && res.statusCode === 404 ? '✓ PASS' : '✗ FAIL');
console.log(`  Status: ${res.statusCode}`);
console.log(`  Error: ${res.jsonData?.error}`);
console.log(`  Code: ${res.jsonData?.code}\n`);

// Test 8: Missing authentication returns 401
console.log('Test 8: Missing authentication returns 401');
req = createMockReq('attempt_user1', null);
req.user = null;
res = createMockRes();
nextCalled = false;
await verifyAttemptOwnership(req, res, () => { nextCalled = true; });
console.log(!nextCalled && res.statusCode === 401 ? '✓ PASS' : '✗ FAIL');
console.log(`  Status: ${res.statusCode}`);
console.log(`  Error: ${res.jsonData?.error}`);
console.log(`  Code: ${res.jsonData?.code}\n`);

console.log('✅ All ownership middleware tests completed!');
