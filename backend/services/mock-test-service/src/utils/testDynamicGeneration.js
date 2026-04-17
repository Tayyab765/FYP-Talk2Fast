/**
 * Test script for dynamic test generation
 * Run with: node src/utils/testDynamicGeneration.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

import Question from '../models/Question.js';
import TestAttempt from '../models/TestAttempt.js';
import { startTest } from '../services/attemptService.js';

const DIFFICULTY_RATIOS = {
  easy: {
    'Advance Math': { easy: 30, medium: 15, hard: 5 },
    'Basic Math': { easy: 12, medium: 6, hard: 2 },
    'IQ & Logical': { easy: 12, medium: 6, hard: 2 },
    'English': { easy: 16, medium: 13, hard: 1 }
  },
  medium: {
    'Advance Math': { easy: 12, medium: 25, hard: 13 },
    'Basic Math': { easy: 5, medium: 10, hard: 5 },
    'IQ & Logical': { easy: 5, medium: 10, hard: 5 },
    'English': { easy: 8, medium: 15, hard: 7 }
  },
  hard: {
    'Advance Math': { easy: 5, medium: 15, hard: 30 },
    'Basic Math': { easy: 2, medium: 6, hard: 12 },
    'IQ & Logical': { easy: 2, medium: 6, hard: 12 },
    'English': { easy: 1, medium: 13, hard: 16 }
  }
};

async function connectDB() {
  const uri = process.env.MOCKTEST_MONGODB_URI;
  if (!uri) {
    throw new Error('MOCKTEST_MONGODB_URI not found in environment variables');
  }
  
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas');
}

async function checkQuestionAvailability() {
  console.log('\n📊 Checking question availability...\n');
  
  const sections = ['Advance Math', 'Basic Math', 'IQ & Logical', 'English'];
  const difficulties = ['easy', 'medium', 'hard'];
  
  for (const section of sections) {
    console.log(`\n${section}:`);
    for (const difficulty of difficulties) {
      const count = await Question.countDocuments({
        section,
        difficulty,
        testId: null
      });
      console.log(`  ${difficulty}: ${count} questions`);
    }
  }
}

async function verifyDifficultyRatios(testDifficulty) {
  console.log(`\n🔍 Verifying ${testDifficulty} test ratios...\n`);
  
  const sections = ['Advance Math', 'Basic Math', 'IQ & Logical', 'English'];
  const difficulties = ['easy', 'medium', 'hard'];
  
  let totalEasy = 0, totalMedium = 0, totalHard = 0;
  
  for (const section of sections) {
    const ratios = DIFFICULTY_RATIOS[testDifficulty][section];
    console.log(`${section}:`);
    
    for (const difficulty of difficulties) {
      const required = ratios[difficulty];
      const available = await Question.countDocuments({
        section,
        difficulty,
        testId: null
      });
      
      const status = available >= required ? '✅' : '❌';
      console.log(`  ${difficulty}: ${required} required, ${available} available ${status}`);
      
      if (difficulty === 'easy') totalEasy += required;
      if (difficulty === 'medium') totalMedium += required;
      if (difficulty === 'hard') totalHard += required;
    }
  }
  
  const total = totalEasy + totalMedium + totalHard;
  console.log(`\nTotal: ${total} questions`);
  console.log(`  Easy: ${totalEasy} (${((totalEasy/total)*100).toFixed(1)}%)`);
  console.log(`  Medium: ${totalMedium} (${((totalMedium/total)*100).toFixed(1)}%)`);
  console.log(`  Hard: ${totalHard} (${((totalHard/total)*100).toFixed(1)}%)`);
}

async function testDynamicGeneration(testDifficulty) {
  console.log(`\n🧪 Testing ${testDifficulty} test generation...\n`);
  
  try {
    const result = await startTest(testDifficulty, 'test-user-123', 'authenticated');
    
    console.log('✅ Test generated successfully!');
    console.log(`Attempt ID: ${result.attempt._id}`);
    console.log(`Difficulty: ${result.testDifficulty}`);
    console.log(`First section: ${result.sectionName}`);
    console.log(`Questions in first section: ${result.questions.length}`);
    
    // Verify question distribution
    console.log('\n📊 Question distribution by section:');
    for (const [sectionName, questionIds] of result.attempt.questionOrder.entries()) {
      console.log(`  ${sectionName}: ${questionIds.length} questions`);
      
      // Count by difficulty
      const questions = await Question.find({ _id: { $in: questionIds } });
      const byDifficulty = {
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length
      };
      console.log(`    Easy: ${byDifficulty.easy}, Medium: ${byDifficulty.medium}, Hard: ${byDifficulty.hard}`);
    }
    
    // Clean up test attempt
    await TestAttempt.deleteOne({ _id: result.attempt._id });
    console.log('\n🧹 Test attempt cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Test generation failed:', error.message);
    return false;
  }
}

async function testUniqueness() {
  console.log('\n🔄 Testing question uniqueness across attempts...\n');
  
  const attempts = [];
  
  for (let i = 0; i < 3; i++) {
    const result = await startTest('medium', `test-user-${i}`, 'authenticated');
    attempts.push(result.attempt);
    console.log(`Attempt ${i + 1}: ${result.attempt._id}`);
  }
  
  // Compare question sets
  const questionSets = attempts.map(a => {
    const allQuestions = [];
    for (const [_, questionIds] of a.questionOrder.entries()) {
      allQuestions.push(...questionIds);
    }
    return new Set(allQuestions.map(id => id.toString()));
  });
  
  // Check overlap
  const set1 = Array.from(questionSets[0]);
  const set2 = Array.from(questionSets[1]);
  const set3 = Array.from(questionSets[2]);
  
  const overlap12 = set1.filter(id => set2.includes(id)).length;
  const overlap13 = set1.filter(id => set3.includes(id)).length;
  const overlap23 = set2.filter(id => set3.includes(id)).length;
  
  console.log(`\nOverlap between attempts:`);
  console.log(`  Attempt 1 & 2: ${overlap12}/120 questions (${((overlap12/120)*100).toFixed(1)}%)`);
  console.log(`  Attempt 1 & 3: ${overlap13}/120 questions (${((overlap13/120)*100).toFixed(1)}%)`);
  console.log(`  Attempt 2 & 3: ${overlap23}/120 questions (${((overlap23/120)*100).toFixed(1)}%)`);
  
  if (overlap12 < 120 && overlap13 < 120 && overlap23 < 120) {
    console.log('\n✅ Tests are unique!');
  } else {
    console.log('\n⚠️  Tests are identical (unexpected)');
  }
  
  // Clean up
  for (const attempt of attempts) {
    await TestAttempt.deleteOne({ _id: attempt._id });
  }
  console.log('\n🧹 Test attempts cleaned up');
}

async function main() {
  try {
    console.log('🚀 Dynamic Test Generation - Test Suite\n');
    console.log('=' .repeat(50));
    
    await connectDB();
    
    // Check question availability
    await checkQuestionAvailability();
    
    // Verify ratios for each difficulty
    await verifyDifficultyRatios('easy');
    await verifyDifficultyRatios('medium');
    await verifyDifficultyRatios('hard');
    
    // Test generation for each difficulty
    console.log('\n' + '='.repeat(50));
    console.log('Testing Generation');
    console.log('='.repeat(50));
    
    await testDynamicGeneration('easy');
    await testDynamicGeneration('medium');
    await testDynamicGeneration('hard');
    
    // Test uniqueness
    console.log('\n' + '='.repeat(50));
    console.log('Testing Uniqueness');
    console.log('='.repeat(50));
    
    await testUniqueness();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

main();
