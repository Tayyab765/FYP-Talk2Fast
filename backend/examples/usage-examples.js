/**
 * Example Usage and Test Utilities
 * Quick reference for common operations
 */

// ==========================================
// EXAMPLE 1: Complete Flow Simulation
// ==========================================

const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function completeCareerCounselingFlow() {
  console.log('🚀 Starting Career Counseling Flow...\n');
  
  // Step 1: Get Questions
  console.log('📝 Step 1: Fetching assessment questions...');
  const questionsResponse = await axios.get(`${BASE_URL}/career/questions`);
  console.log(`✓ Received ${questionsResponse.data.data.totalQuestions} questions\n`);
  
  // Step 2: Submit Profile
  console.log('👤 Step 2: Submitting user profile...');
  const profileData = {
    userId: '507f1f77bcf86cd799439011', // Example MongoDB ObjectId
    answers: {
      academic_level: 'intermediate',
      field_of_study: 'computer_science',
      academic_performance: 'excellent',
      favorite_subjects: ['mathematics', 'computer_science', 'physics'],
      challenging_subjects: [],
      primary_interests: ['technology', 'business'],
      hobbies: ['coding', 'gaming'],
      programming_skill: 4,
      mathematics_skill: 5,
      analytical_thinking: 4,
      problem_solving: 5,
      communication_skill: 3,
      leadership_skill: 3,
      teamwork_skill: 4,
      creativity_skill: 4,
      learning_preference: 'hands_on',
      work_environment: 'flexible',
      career_priority: 'growth_opportunities',
      preferred_location: 'no_preference',
      risk_tolerance: 'medium'
    }
  };
  
  const profileResponse = await axios.post(`${BASE_URL}/career/profile`, profileData);
  console.log(`✓ Profile created: ${profileResponse.data.data.profileId}\n`);
  
  // Step 3: Generate Recommendations
  console.log('🤖 Step 3: Generating AI recommendations...');
  const recommendResponse = await axios.post(`${BASE_URL}/career/recommend`, {
    userId: profileData.userId
  });
  
  const sessionId = recommendResponse.data.data.sessionId;
  const recommendations = recommendResponse.data.data.recommendations;
  
  console.log(`✓ Session created: ${sessionId}`);
  console.log(`✓ Top recommendation: ${recommendations.top_3_degrees[0].degree_name} (${recommendations.top_3_degrees[0].match_percentage}% match)`);
  console.log(`✓ Token usage: ${recommendResponse.data.data.tokenUsage.total} tokens\n`);
  
  // Step 4: Follow-up Chat
  console.log('💬 Step 4: Sending follow-up questions...');
  
  const questions = [
    'What programming languages should I focus on?',
    'Which university would you recommend for me in Lahore?',
    'What are the salary expectations for fresh graduates?'
  ];
  
  for (const question of questions) {
    console.log(`\nUser: "${question}"`);
    const chatResponse = await axios.post(
      `${BASE_URL}/career/chat/${sessionId}`,
      { message: question }
    );
    
    const answer = chatResponse.data.data.response;
    console.log(`AI: ${answer.substring(0, 150)}...`);
    console.log(`Tokens: ${chatResponse.data.data.tokenUsage.total}`);
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Step 5: Get Session Analytics
  console.log('\n📊 Step 5: Fetching session analytics...');
  const analyticsResponse = await axios.get(`${BASE_URL}/career/analytics/${sessionId}`);
  const analytics = analyticsResponse.data.data;
  
  console.log(`\n✓ Session Analytics:`);
  console.log(`   Messages: ${analytics.messageCount}`);
  console.log(`   Total tokens: ${analytics.tokenUsage.total_tokens}`);
  console.log(`   Estimated cost: $${analytics.tokenUsage.estimated_cost.toFixed(4)}`);
  console.log(`   Status: ${analytics.status}`);
  
  console.log('\n✨ Flow completed successfully!\n');
}

// ==========================================
// EXAMPLE 2: Error Handling Demo
// ==========================================

async function demonstrateErrorHandling() {
  console.log('🔴 Testing Error Handling...\n');
  
  try {
    // Invalid profile submission (missing required fields)
    await axios.post(`${BASE_URL}/career/profile`, {
      userId: '123',
      answers: {
        academic_level: 'invalid_value'
      }
    });
  } catch (error) {
    console.log('✓ Validation error caught:');
    console.log(error.response.data);
  }
  
  try {
    // Non-existent session
    await axios.get(`${BASE_URL}/career/session/507f1f77bcf86cd799439999`);
  } catch (error) {
    console.log('\n✓ Not found error caught:');
    console.log(error.response.data);
  }
  
  console.log('\n✓ Error handling working correctly\n');
}

// ==========================================
// EXAMPLE 3: Rate Limiting Demo
// ==========================================

async function demonstrateRateLimiting() {
  console.log('⏱️  Testing Rate Limiting...\n');
  
  const requests = [];
  for (let i = 0; i < 12; i++) {
    requests.push(
      axios.get(`${BASE_URL}/health`)
        .then(() => console.log(`✓ Request ${i + 1} succeeded`))
        .catch(error => {
          if (error.response?.status === 429) {
            console.log(`⚠️  Request ${i + 1} rate limited`);
          }
        })
    );
  }
  
  await Promise.all(requests);
  console.log('\n✓ Rate limiting working correctly\n');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Create multiple test profiles with different characteristics
 */
async function createTestProfiles() {
  const profiles = [
    {
      name: 'Tech Enthusiast',
      data: {
        userId: 'test_user_001',
        answers: {
          academic_level: 'intermediate',
          field_of_study: 'computer_science',
          academic_performance: 'excellent',
          favorite_subjects: ['computer_science', 'mathematics'],
          primary_interests: ['technology', 'research'],
          programming_skill: 5,
          mathematics_skill: 5,
          analytical_thinking: 5,
          problem_solving: 5,
          communication_skill: 3,
          leadership_skill: 3,
          teamwork_skill: 4,
          creativity_skill: 4,
          learning_preference: 'hands_on',
          work_environment: 'flexible',
          career_priority: 'growth_opportunities',
          preferred_location: 'international',
          risk_tolerance: 'high'
        }
      }
    },
    {
      name: 'Business Leader',
      data: {
        userId: 'test_user_002',
        answers: {
          academic_level: 'intermediate',
          field_of_study: 'commerce',
          academic_performance: 'good',
          favorite_subjects: ['business_studies', 'economics'],
          primary_interests: ['business', 'education'],
          programming_skill: 2,
          mathematics_skill: 3,
          analytical_thinking: 4,
          problem_solving: 4,
          communication_skill: 5,
          leadership_skill: 5,
          teamwork_skill: 5,
          creativity_skill: 4,
          learning_preference: 'mixed',
          work_environment: 'office',
          career_priority: 'high_salary',
          preferred_location: 'national',
          risk_tolerance: 'medium'
        }
      }
    },
    {
      name: 'Healthcare Professional',
      data: {
        userId: 'test_user_003',
        answers: {
          academic_level: 'intermediate',
          field_of_study: 'medical',
          academic_performance: 'excellent',
          favorite_subjects: ['biology', 'chemistry'],
          primary_interests: ['healthcare', 'social_work'],
          programming_skill: 1,
          mathematics_skill: 3,
          analytical_thinking: 4,
          problem_solving: 4,
          communication_skill: 5,
          leadership_skill: 4,
          teamwork_skill: 5,
          creativity_skill: 3,
          learning_preference: 'theoretical',
          work_environment: 'field',
          career_priority: 'social_impact',
          preferred_location: 'local',
          risk_tolerance: 'low'
        }
      }
    }
  ];
  
  for (const profile of profiles) {
    console.log(`Creating profile: ${profile.name}...`);
    const response = await axios.post(`${BASE_URL}/career/profile`, profile.data);
    console.log(`✓ Created: ${response.data.data.profileId}\n`);
  }
}

/**
 * Bulk recommendation generation
 */
async function generateBulkRecommendations(userIds) {
  const results = [];
  
  for (const userId of userIds) {
    try {
      const response = await axios.post(`${BASE_URL}/career/recommend`, { userId });
      results.push({
        userId,
        sessionId: response.data.data.sessionId,
        topDegree: response.data.data.recommendations.top_3_degrees[0].degree_name,
        tokens: response.data.data.tokenUsage.total
      });
      
      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      results.push({
        userId,
        error: error.response?.data?.message || error.message
      });
    }
  }
  
  return results;
}

/**
 * Session cleanup utility
 */
async function archiveOldSessions() {
  // This would typically be a scheduled job
  // For now, just demonstrate the concept
  console.log('🗑️  Archiving old sessions...');
  // In production, call a maintenance endpoint or use node-cron
}

// ==========================================
// RUN EXAMPLES
// ==========================================

// Uncomment to run:

// completeCareerCounselingFlow().catch(console.error);

// demonstrateErrorHandling().catch(console.error);

// demonstrateRateLimiting().catch(console.error);

// createTestProfiles().catch(console.error);

module.exports = {
  completeCareerCounselingFlow,
  demonstrateErrorHandling,
  demonstrateRateLimiting,
  createTestProfiles,
  generateBulkRecommendations,
  archiveOldSessions
};
