/**
 * Check question count in MongoDB Atlas
 * Run with: node src/utils/checkQuestionCount.js
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

async function connectDB() {
  const uri = process.env.MOCKTEST_MONGODB_URI;
  if (!uri) {
    throw new Error('MOCKTEST_MONGODB_URI not found in environment variables');
  }
  
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas\n');
}

async function checkQuestions() {
  console.log('=' .repeat(60));
  console.log('QUESTION COUNT ANALYSIS');
  console.log('='.repeat(60));
  
  // Total count
  const totalCount = await Question.countDocuments({});
  console.log(`\n📊 Total Questions: ${totalCount}`);
  
  // Count by testId
  const withTestId = await Question.countDocuments({ testId: { $ne: null } });
  const withoutTestId = await Question.countDocuments({ testId: null });
  
  console.log(`\n🔍 By TestId:`);
  console.log(`  With testId (old fixed tests): ${withTestId}`);
  console.log(`  Without testId (question bank): ${withoutTestId}`);
  
  // Count by section
  console.log(`\n📚 By Section:`);
  const sections = ['Advance Math', 'Basic Math', 'IQ & Logical', 'English'];
  
  for (const section of sections) {
    const count = await Question.countDocuments({ section, testId: null });
    console.log(`  ${section}: ${count}`);
  }
  
  // Count by difficulty
  console.log(`\n⚡ By Difficulty (Question Bank only):`);
  const difficulties = ['easy', 'medium', 'hard'];
  
  for (const difficulty of difficulties) {
    const count = await Question.countDocuments({ difficulty, testId: null });
    console.log(`  ${difficulty}: ${count}`);
  }
  
  // Count by section and difficulty
  console.log(`\n📊 Detailed Breakdown (Question Bank):`);
  console.log('='.repeat(60));
  
  for (const section of sections) {
    console.log(`\n${section}:`);
    let sectionTotal = 0;
    
    for (const difficulty of difficulties) {
      const count = await Question.countDocuments({ 
        section, 
        difficulty, 
        testId: null 
      });
      console.log(`  ${difficulty}: ${count}`);
      sectionTotal += count;
    }
    console.log(`  Total: ${sectionTotal}`);
  }
  
  // Check answer distribution
  console.log(`\n\n✅ Answer Distribution (Question Bank):`);
  console.log('='.repeat(60));
  
  const answerCounts = {
    A: await Question.countDocuments({ correctAnswer: 'A', testId: null }),
    B: await Question.countDocuments({ correctAnswer: 'B', testId: null }),
    C: await Question.countDocuments({ correctAnswer: 'C', testId: null }),
    D: await Question.countDocuments({ correctAnswer: 'D', testId: null })
  };
  
  const totalQuestionBank = withoutTestId;
  
  for (const [answer, count] of Object.entries(answerCounts)) {
    const percentage = totalQuestionBank > 0 ? ((count / totalQuestionBank) * 100).toFixed(1) : 0;
    console.log(`  ${answer}: ${count} (${percentage}%)`);
  }
  
  // Sample questions
  console.log(`\n\n📝 Sample Questions (first 3 from question bank):`);
  console.log('='.repeat(60));
  
  const samples = await Question.find({ testId: null })
    .limit(3)
    .select('section difficulty topic correctAnswer')
    .lean();
  
  samples.forEach((q, i) => {
    console.log(`\n${i + 1}. Section: ${q.section}`);
    console.log(`   Difficulty: ${q.difficulty}`);
    console.log(`   Topic: ${q.topic}`);
    console.log(`   Correct Answer: ${q.correctAnswer}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Warning if only 360 questions
  if (totalCount === 360) {
    console.log('\n⚠️  WARNING: Only 360 questions found!');
    console.log('This suggests the seedAllQuestions.js script was not run.');
    console.log('Expected: 1499 questions in question bank');
    console.log('\nTo fix:');
    console.log('1. Run: node src/utils/seedAllQuestions.js');
    console.log('2. This will import all 1499 questions from complete_fast_mcqs_collection.json');
  } else if (withoutTestId === 0) {
    console.log('\n⚠️  WARNING: No question bank questions found!');
    console.log('All questions have testId assigned (old approach).');
    console.log('\nTo fix:');
    console.log('1. Run: node src/utils/seedAllQuestions.js');
    console.log('2. This will create question bank with testId: null');
  } else if (withoutTestId < 1400) {
    console.log(`\n⚠️  WARNING: Only ${withoutTestId} question bank questions found!`);
    console.log('Expected: ~1499 questions');
    console.log('\nTo fix:');
    console.log('1. Run: node src/utils/seedAllQuestions.js');
  } else {
    console.log('\n✅ Question bank looks good!');
    console.log(`${withoutTestId} questions available for dynamic test generation.`);
  }
  
  console.log('\n');
}

async function main() {
  try {
    await connectDB();
    await checkQuestions();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

main();
