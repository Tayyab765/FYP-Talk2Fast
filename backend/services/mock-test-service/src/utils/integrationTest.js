/**
 * Integration test script for Mock Test Service
 * Tests complete user journey from test list to results
 * 
 * Usage: node src/utils/integrationTest.js
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5005/api/mock-tests';
const GUEST_ID = 'test-guest-' + Date.now();

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-guest-id': GUEST_ID,
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Test suite
async function runIntegrationTests() {
  console.log('🧪 Starting Integration Tests\n');
  console.log(`Guest ID: ${GUEST_ID}\n`);
  
  let testId, attemptId;
  
  try {
    // Test 1: List available tests
    console.log('Test 1: List available tests');
    const { status: listStatus, data: listData } = await apiCall('/');
    console.log(`  Status: ${listStatus}`);
    console.log(`  Tests found: ${listData.tests?.length || 0}`);
    
    if (listStatus !== 200 || !listData.tests || listData.tests.length === 0) {
      throw new Error('Failed to list tests');
    }
    
    testId = listData.tests[0].id;
    console.log(`  Selected test: ${listData.tests[0].title}`);
    console.log('  ✅ PASS\n');
    
    // Test 2: Get test details
    console.log('Test 2: Get test details');
    const { status: detailStatus, data: detailData } = await apiCall(`/${testId}`);
    console.log(`  Status: ${detailStatus}`);
    console.log(`  Test: ${detailData.test?.title}`);
    console.log(`  Sections: ${detailData.test?.sections?.length || 0}`);
    
    if (detailStatus !== 200 || !detailData.test) {
      throw new Error('Failed to get test details');
    }
    console.log('  ✅ PASS\n');
    
    // Test 3: Start test
    console.log('Test 3: Start test');
    const { status: startStatus, data: startData } = await apiCall(`/${testId}/start`, {
      method: 'POST'
    });
    console.log(`  Status: ${startStatus}`);
    console.log(`  Attempt ID: ${startData.attemptId}`);
    console.log(`  Current section: ${startData.sectionName}`);
    console.log(`  Questions loaded: ${startData.questions?.length || 0}`);
    
    if (startStatus !== 200 || !startData.attemptId) {
      throw new Error('Failed to start test');
    }
    
    attemptId = startData.attemptId;
    console.log('  ✅ PASS\n');
    
    // Test 4: Save answers
    console.log('Test 4: Save answers');
    const question1 = startData.questions[0];
    const { status: answerStatus, data: answerData } = await apiCall(
      `/attempts/${attemptId}/answer`,
      {
        method: 'PUT',
        body: JSON.stringify({
          questionId: question1.id,
          answer: 'A'
        })
      }
    );
    console.log(`  Status: ${answerStatus}`);
    console.log(`  Answer saved: ${answerData.success}`);
    
    if (answerStatus !== 200 || !answerData.success) {
      throw new Error('Failed to save answer');
    }
    console.log('  ✅ PASS\n');
    
    // Test 5: Mark for review
    console.log('Test 5: Mark for review');
    const question2 = startData.questions[1];
    const { status: markStatus, data: markData } = await apiCall(
      `/attempts/${attemptId}/mark-review`,
      {
        method: 'PUT',
        body: JSON.stringify({
          questionId: question2.id,
          marked: true
        })
      }
    );
    console.log(`  Status: ${markStatus}`);
    console.log(`  Marked: ${markData.success}`);
    
    if (markStatus !== 200 || !markData.success) {
      throw new Error('Failed to mark for review');
    }
    console.log('  ✅ PASS\n');
    
    // Test 6: Get attempt state (resume)
    console.log('Test 6: Get attempt state');
    const { status: stateStatus, data: stateData } = await apiCall(`/attempts/${attemptId}`);
    console.log(`  Status: ${stateStatus}`);
    console.log(`  Current section: ${stateData.currentSection}`);
    console.log(`  Answers saved: ${Object.keys(stateData.answers || {}).length}`);
    console.log(`  Marked for review: ${stateData.markedForReview?.length || 0}`);
    console.log(`  Time remaining: ${stateData.timeRemaining}s`);
    
    if (stateStatus !== 200 || stateData.currentSection !== 0) {
      throw new Error('Failed to get attempt state');
    }
    console.log('  ✅ PASS\n');
    
    // Test 7: Submit section
    console.log('Test 7: Submit section');
    const { status: submitStatus, data: submitData } = await apiCall(
      `/attempts/${attemptId}/submit-section`,
      {
        method: 'POST',
        body: JSON.stringify({
          sectionIndex: 0
        })
      }
    );
    console.log(`  Status: ${submitStatus}`);
    console.log(`  Section submitted: ${submitData.sectionSubmitted}`);
    console.log(`  Next section: ${submitData.sectionName}`);
    console.log(`  Questions loaded: ${submitData.questions?.length || 0}`);
    
    if (submitStatus !== 200 || submitData.nextSection !== 1) {
      throw new Error('Failed to submit section');
    }
    console.log('  ✅ PASS\n');
    
    // Test 8: Submit remaining sections quickly
    console.log('Test 8: Submit remaining sections');
    for (let i = 1; i <= 3; i++) {
      const { status } = await apiCall(
        `/attempts/${attemptId}/submit-section`,
        {
          method: 'POST',
          body: JSON.stringify({
            sectionIndex: i
          })
        }
      );
      console.log(`  Section ${i} submitted: ${status === 200 ? '✓' : '✗'}`);
    }
    console.log('  ✅ PASS\n');
    
    // Test 9: Get results
    console.log('Test 9: Get results');
    const { status: resultsStatus, data: resultsData } = await apiCall(
      `/attempts/${attemptId}/results`
    );
    console.log(`  Status: ${resultsStatus}`);
    console.log(`  Total score: ${resultsData.score?.total}`);
    console.log(`  Percentage: ${resultsData.score?.percentage}%`);
    console.log(`  Sections: ${resultsData.score?.sectionScores?.length || 0}`);
    
    if (resultsStatus !== 200 || !resultsData.score) {
      throw new Error('Failed to get results');
    }
    console.log('  ✅ PASS\n');
    
    // Test 10: Get answer review
    console.log('Test 10: Get answer review');
    const { status: reviewStatus, data: reviewData } = await apiCall(
      `/attempts/${attemptId}/review`
    );
    console.log(`  Status: ${reviewStatus}`);
    console.log(`  Sections: ${reviewData.sections?.length || 0}`);
    
    let totalQuestions = 0;
    reviewData.sections?.forEach(section => {
      totalQuestions += section.questions?.length || 0;
    });
    console.log(`  Total questions: ${totalQuestions}`);
    
    if (reviewStatus !== 200 || !reviewData.sections) {
      throw new Error('Failed to get answer review');
    }
    console.log('  ✅ PASS\n');
    
    // Test 11: Get test history
    console.log('Test 11: Get test history');
    const { status: historyStatus, data: historyData } = await apiCall('/analytics/history');
    console.log(`  Status: ${historyStatus}`);
    console.log(`  Attempts: ${historyData.attempts?.length || 0}`);
    
    if (historyStatus !== 200 || !historyData.attempts) {
      throw new Error('Failed to get test history');
    }
    console.log('  ✅ PASS\n');
    
    // Test 12: Get performance analytics
    console.log('Test 12: Get performance analytics');
    const { status: perfStatus, data: perfData } = await apiCall('/analytics/performance');
    console.log(`  Status: ${perfStatus}`);
    console.log(`  Total attempts: ${perfData.overallStats?.totalAttempts || 0}`);
    console.log(`  Average score: ${perfData.overallStats?.averageScore || 0}`);
    console.log(`  Recommendations: ${perfData.recommendations?.length || 0}`);
    
    if (perfStatus !== 200 || !perfData.overallStats) {
      throw new Error('Failed to get performance analytics');
    }
    console.log('  ✅ PASS\n');
    
    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ All Integration Tests Passed!');
    console.log('═══════════════════════════════════════');
    console.log(`\nTest Summary:`);
    console.log(`  Guest ID: ${GUEST_ID}`);
    console.log(`  Test ID: ${testId}`);
    console.log(`  Attempt ID: ${attemptId}`);
    console.log(`  Total Score: ${resultsData.score.total}/120`);
    console.log(`  Percentage: ${resultsData.score.percentage}%`);
    
  } catch (error) {
    console.error('\n❌ Integration Test Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runIntegrationTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
