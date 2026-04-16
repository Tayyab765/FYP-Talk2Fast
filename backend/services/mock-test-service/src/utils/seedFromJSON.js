/**
 * Seed script for importing MCQs from complete_fast_mcqs_collection.json
 * Clears existing data and creates tests with real FAST NUCES questions
 * 
 * Usage: node src/utils/seedFromJSON.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import MockTest from '../models/MockTest.js';
import Question from '../models/Question.js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const MONGODB_URI = process.env.MOCKTEST_MONGODB_URI || 'mongodb://localhost:27017/hamza_mocktest';

// Map JSON subjects to database sections
const SUBJECT_MAPPING = {
  'Advance Mathematics': 'Advance Math',
  'Basic Mathematics': 'Basic Math',
  'IQ & Logical Reasoning': 'IQ & Logical',
  'English': 'English'
};

// Test templates with different difficulty levels
const testTemplates = [
  {
    title: 'FAST Entry Test Practice #1 - Easy',
    description: 'Complete practice test covering all sections with easy to medium difficulty questions. Perfect for beginners starting their preparation.',
    difficulty: 'easy',
    sections: [
      { name: 'Advance Math', questionCount: 50, duration: 50, order: 0 },
      { name: 'Basic Math', questionCount: 20, duration: 20, order: 1 },
      { name: 'IQ & Logical', questionCount: 20, duration: 20, order: 2 },
      { name: 'English', questionCount: 30, duration: 30, order: 3 }
    ],
    totalQuestions: 120,
    totalDuration: 120,
    isActive: true
  },
  {
    title: 'FAST Entry Test Practice #2 - Medium',
    description: 'Intermediate level practice test with balanced difficulty. Ideal for students who have completed basic preparation.',
    difficulty: 'medium',
    sections: [
      { name: 'Advance Math', questionCount: 50, duration: 50, order: 0 },
      { name: 'Basic Math', questionCount: 20, duration: 20, order: 1 },
      { name: 'IQ & Logical', questionCount: 20, duration: 20, order: 2 },
      { name: 'English', questionCount: 30, duration: 30, order: 3 }
    ],
    totalQuestions: 120,
    totalDuration: 120,
    isActive: true
  },
  {
    title: 'FAST Entry Test Practice #3 - Hard',
    description: 'Advanced practice test with challenging questions. Recommended for final preparation before the actual exam.',
    difficulty: 'hard',
    sections: [
      { name: 'Advance Math', questionCount: 50, duration: 50, order: 0 },
      { name: 'Basic Math', questionCount: 20, duration: 20, order: 1 },
      { name: 'IQ & Logical', questionCount: 20, duration: 20, order: 2 },
      { name: 'English', questionCount: 30, duration: 30, order: 3 }
    ],
    totalQuestions: 120,
    totalDuration: 120,
    isActive: true
  }
];

/**
 * Load MCQs from JSON file
 */
function loadMCQsFromJSON() {
  try {
    // Go up from utils to service root, then to workspace root
    const jsonPath = join(__dirname, '../../../../../complete_fast_mcqs_collection.json');
    logger.info(`Loading MCQs from: ${jsonPath}`);
    
    const jsonData = readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(jsonData);
    
    logger.info(`Loaded ${data.total_mcqs} MCQs from JSON`);
    logger.info(`Subjects: ${data.statistics.by_subject.map(s => `${s.subject} (${s.count})`).join(', ')}`);
    
    return data.mcqs;
  } catch (error) {
    logger.error('Error loading JSON file:', error);
    throw error;
  }
}

/**
 * Validate MCQ has all required fields
 */
function isValidMCQ(mcq) {
  // Check if MCQ has all required fields
  if (!mcq.question || !mcq.options || !mcq.correct_answer || !mcq.topic || !mcq.difficulty) {
    return false;
  }
  
  // Check if options array has at least 4 elements
  if (!Array.isArray(mcq.options) || mcq.options.length < 4) {
    return false;
  }
  
  // Check if correct answer is valid (A, B, C, or D)
  if (!['A', 'B', 'C', 'D'].includes(mcq.correct_answer)) {
    return false;
  }
  
  // Check if all options are non-empty strings
  for (let i = 0; i < 4; i++) {
    if (!mcq.options[i] || typeof mcq.options[i] !== 'string' || mcq.options[i].trim() === '') {
      return false;
    }
  }
  
  return true;
}

/**
 * Convert JSON MCQ format to database format
 */
function convertMCQToDBFormat(mcq, testId, section, order) {
  // Convert options array to object format
  const optionsObj = {
    A: mcq.options[0],
    B: mcq.options[1],
    C: mcq.options[2],
    D: mcq.options[3]
  };
  
  return {
    testId,
    section,
    questionText: mcq.question,
    options: optionsObj,
    correctAnswer: mcq.correct_answer,
    topic: mcq.topic,
    difficulty: mcq.difficulty,
    order
  };
}

/**
 * Filter and select MCQs for a specific test
 */
function selectMCQsForTest(allMCQs, testDifficulty) {
  const selectedMCQs = {
    'Advance Math': [],
    'Basic Math': [],
    'IQ & Logical': [],
    'English': []
  };
  
  // Group MCQs by subject and filter valid ones
  const mcqsBySubject = {};
  for (const mcq of allMCQs) {
    // Validate MCQ before using it
    if (!isValidMCQ(mcq)) {
      continue; // Skip invalid MCQs
    }
    
    const section = SUBJECT_MAPPING[mcq.subject];
    if (!section) continue;
    
    if (!mcqsBySubject[section]) {
      mcqsBySubject[section] = [];
    }
    mcqsBySubject[section].push(mcq);
  }
  
  logger.info(`Valid MCQs by section:`);
  for (const [section, mcqs] of Object.entries(mcqsBySubject)) {
    logger.info(`  - ${section}: ${mcqs.length} valid MCQs`);
  }
  
  // Select MCQs based on test difficulty
  for (const [section, mcqs] of Object.entries(mcqsBySubject)) {
    let filtered = mcqs;
    
    // Filter by difficulty preference
    if (testDifficulty === 'easy') {
      // Prefer easy and medium questions
      filtered = mcqs.filter(m => m.difficulty === 'easy' || m.difficulty === 'medium');
      if (filtered.length < 50) filtered = mcqs; // Fallback to all if not enough
    } else if (testDifficulty === 'medium') {
      // Prefer medium questions, mix of easy and hard
      const mediumMCQs = mcqs.filter(m => m.difficulty === 'medium');
      const easyMCQs = mcqs.filter(m => m.difficulty === 'easy');
      const hardMCQs = mcqs.filter(m => m.difficulty === 'hard');
      filtered = [...mediumMCQs, ...easyMCQs, ...hardMCQs];
    } else if (testDifficulty === 'hard') {
      // Prefer hard and medium questions
      filtered = mcqs.filter(m => m.difficulty === 'hard' || m.difficulty === 'medium');
      if (filtered.length < 50) filtered = mcqs; // Fallback to all if not enough
    }
    
    // Shuffle and select required count
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    
    // Determine how many questions needed for this section
    let requiredCount = 0;
    if (section === 'Advance Math') requiredCount = 50;
    else if (section === 'Basic Math') requiredCount = 20;
    else if (section === 'IQ & Logical') requiredCount = 20;
    else if (section === 'English') requiredCount = 30;
    
    selectedMCQs[section] = shuffled.slice(0, requiredCount);
    
    logger.info(`Selected ${selectedMCQs[section].length} questions for ${section} (${testDifficulty})`);
  }
  
  return selectedMCQs;
}

/**
 * Create questions for a test
 */
function createQuestionsForTest(testId, selectedMCQs) {
  const questions = [];
  
  for (const [section, mcqs] of Object.entries(selectedMCQs)) {
    mcqs.forEach((mcq, index) => {
      questions.push(convertMCQToDBFormat(mcq, testId, section, index + 1));
    });
  }
  
  return questions;
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');
    
    // Load MCQs from JSON
    logger.info('Loading MCQs from JSON file...');
    const allMCQs = loadMCQsFromJSON();
    logger.info(`✅ Loaded ${allMCQs.length} MCQs`);
    
    // Clear existing data
    logger.info('Clearing existing test data...');
    const deletedTests = await MockTest.deleteMany({});
    const deletedQuestions = await Question.deleteMany({});
    logger.info(`✅ Cleared ${deletedTests.deletedCount} tests and ${deletedQuestions.deletedCount} questions`);
    
    // Create test templates and questions
    let totalQuestionsCreated = 0;
    
    for (const template of testTemplates) {
      logger.info(`\n📝 Creating test: ${template.title}`);
      
      // Create test template
      const test = await MockTest.create(template);
      logger.info(`✅ Test created with ID: ${test._id}`);
      
      // Select MCQs for this test based on difficulty
      logger.info(`Selecting MCQs for ${template.difficulty} difficulty...`);
      const selectedMCQs = selectMCQsForTest(allMCQs, template.difficulty);
      
      // Create questions
      logger.info(`Creating questions...`);
      const questions = createQuestionsForTest(test._id, selectedMCQs);
      await Question.insertMany(questions);
      totalQuestionsCreated += questions.length;
      
      logger.info(`✅ Created ${questions.length} questions`);
      logger.info(`   - Advance Math: ${selectedMCQs['Advance Math'].length}`);
      logger.info(`   - Basic Math: ${selectedMCQs['Basic Math'].length}`);
      logger.info(`   - IQ & Logical: ${selectedMCQs['IQ & Logical'].length}`);
      logger.info(`   - English: ${selectedMCQs['English'].length}`);
    }
    
    logger.info('\n🎉 Database seeding completed successfully!');
    logger.info(`✅ Created ${testTemplates.length} test templates`);
    logger.info(`✅ Created ${totalQuestionsCreated} questions from real FAST NUCES MCQs`);
    logger.info(`\n📊 Source Data Statistics:`);
    logger.info(`   - Total MCQs in collection: ${allMCQs.length}`);
    logger.info(`   - Advance Mathematics: ${allMCQs.filter(m => m.subject === 'Advance Mathematics').length}`);
    logger.info(`   - Basic Mathematics: ${allMCQs.filter(m => m.subject === 'Basic Mathematics').length}`);
    logger.info(`   - IQ & Logical Reasoning: ${allMCQs.filter(m => m.subject === 'IQ & Logical Reasoning').length}`);
    logger.info(`   - English: ${allMCQs.filter(m => m.subject === 'English').length}`);
    
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('\n✅ Database connection closed');
  }
}

// Run seeding if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('\n✨ Seeding completed successfully! ✨');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;
