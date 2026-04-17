/**
 * Seed ALL questions from complete_fast_mcqs_collection.json to MongoDB Atlas
 * Creates a question bank instead of fixed test templates
 * 
 * Usage: node src/utils/seedAllQuestions.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
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
  
  // Check if correct answer is valid (A, B, C, or D only - no E!)
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
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get difficulty distribution for a test level
 */
function getDifficultyDistribution(testLevel, sectionName, questionCount) {
  const distributions = {
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
  
  return distributions[testLevel][sectionName] || { easy: 0, medium: 0, hard: 0 };
}

/**
 * Select questions with difficulty ratio
 */
function selectQuestionsWithRatio(mcqs, distribution) {
  const selected = [];
  
  // Group by difficulty
  const byDifficulty = {
    easy: mcqs.filter(m => m.difficulty === 'easy'),
    medium: mcqs.filter(m => m.difficulty === 'medium'),
    hard: mcqs.filter(m => m.difficulty === 'hard')
  };
  
  // Select from each difficulty level
  for (const [difficulty, count] of Object.entries(distribution)) {
    const available = byDifficulty[difficulty];
    const shuffled = shuffleArray(available);
    selected.push(...shuffled.slice(0, count));
  }
  
  // If we don't have enough, fill with any available
  if (selected.length < Object.values(distribution).reduce((a, b) => a + b, 0)) {
    const remaining = mcqs.filter(m => !selected.includes(m));
    const shuffled = shuffleArray(remaining);
    const needed = Object.values(distribution).reduce((a, b) => a + b, 0) - selected.length;
    selected.push(...shuffled.slice(0, needed));
  }
  
  return shuffleArray(selected);
}

/**
 * Shuffle options and update correct answer to balance distribution
 */
function shuffleOptions(mcq) {
  const options = mcq.options;
  const correctAnswer = mcq.correct_answer;
  
  // Get the correct answer text
  const correctText = options[correctAnswer.charCodeAt(0) - 65]; // A=0, B=1, C=2, D=3
  
  // Create array of all options
  const optionArray = [
    options[0], // A
    options[1], // B
    options[2], // C
    options[3]  // D
  ];
  
  // Shuffle options
  const shuffled = shuffleArray(optionArray);
  
  // Find new position of correct answer
  const newCorrectIndex = shuffled.indexOf(correctText);
  const newCorrectAnswer = String.fromCharCode(65 + newCorrectIndex); // 0=A, 1=B, 2=C, 3=D
  
  return {
    options: {
      A: shuffled[0],
      B: shuffled[1],
      C: shuffled[2],
      D: shuffled[3]
    },
    correctAnswer: newCorrectAnswer
  };
}

/**
 * Convert JSON MCQ format to database format
 */
function convertMCQToDBFormat(mcq, section, order) {
  // Shuffle options to balance correct answer distribution
  const shuffled = shuffleOptions(mcq);
  
  return {
    testId: null, // No fixed test - question bank approach
    section,
    questionText: mcq.question,
    options: shuffled.options,
    correctAnswer: shuffled.correctAnswer,
    topic: mcq.topic,
    difficulty: mcq.difficulty,
    order
  };
}

/**
 * Load MCQs from JSON file
 */
function loadMCQsFromJSON() {
  try {
    const jsonPath = join(__dirname, '../../../../../complete_fast_mcqs_collection.json');
    logger.info(`Loading MCQs from: ${jsonPath}`);
    
    const jsonData = readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(jsonData);
    
    logger.info(`Loaded ${data.total_mcqs} MCQs from JSON`);
    
    return data.mcqs;
  } catch (error) {
    logger.error('Error loading JSON file:', error);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedAllQuestions() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB Atlas');
    
    // Load MCQs from JSON
    logger.info('\n📥 Loading MCQs from JSON file...');
    const allMCQs = loadMCQsFromJSON();
    
    // Filter and group by section
    const mcqsBySection = {
      'Advance Math': [],
      'Basic Math': [],
      'IQ & Logical': [],
      'English': []
    };
    
    let validCount = 0;
    let invalidCount = 0;
    
    for (const mcq of allMCQs) {
      if (!isValidMCQ(mcq)) {
        invalidCount++;
        continue;
      }
      
      const section = SUBJECT_MAPPING[mcq.subject];
      if (!section) {
        invalidCount++;
        continue;
      }
      
      mcqsBySection[section].push(mcq);
      validCount++;
    }
    
    logger.info(`\n📊 Validation Results:`);
    logger.info(`  ✅ Valid MCQs: ${validCount}`);
    logger.info(`  ❌ Invalid MCQs: ${invalidCount} (skipped)`);
    
    logger.info(`\n📚 MCQs by Section:`);
    for (const [section, mcqs] of Object.entries(mcqsBySection)) {
      logger.info(`  - ${section}: ${mcqs.length} questions`);
    }
    
    // Clear existing questions
    logger.info('\n🗑️  Clearing existing questions from database...');
    const deleteResult = await Question.deleteMany({});
    logger.info(`  Deleted ${deleteResult.deletedCount} old questions`);
    
    // Insert all questions
    logger.info('\n📤 Inserting all questions to Atlas...');
    const questionsToInsert = [];
    
    for (const [section, mcqs] of Object.entries(mcqsBySection)) {
      mcqs.forEach((mcq, index) => {
        questionsToInsert.push(convertMCQToDBFormat(mcq, section, index + 1));
      });
    }
    
    logger.info(`  Preparing to insert ${questionsToInsert.length} questions...`);
    
    // Insert in batches of 100 for better performance
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < questionsToInsert.length; i += batchSize) {
      const batch = questionsToInsert.slice(i, i + batchSize);
      await Question.insertMany(batch);
      inserted += batch.length;
      logger.info(`  Inserted ${inserted}/${questionsToInsert.length} questions...`);
    }
    
    logger.info(`\n✅ Successfully inserted ${inserted} questions to Atlas!`);
    
    // Verify correct answer distribution
    logger.info('\n📊 Checking correct answer distribution...');
    const distribution = await Question.aggregate([
      { $group: { _id: '$correctAnswer', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    logger.info('  Distribution:');
    let total = 0;
    for (const item of distribution) {
      total += item.count;
      const percentage = (item.count / inserted * 100).toFixed(1);
      logger.info(`    ${item._id}: ${item.count} (${percentage}%)`);
    }
    
    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('✅ SEEDING COMPLETE!');
    logger.info('='.repeat(60));
    logger.info(`📚 Total Questions in Atlas: ${inserted}`);
    logger.info(`🎯 Question Bank Ready!`);
    logger.info(`🔀 Questions will be randomly selected for each test`);
    logger.info('='.repeat(60));
    
  } catch (error) {
    logger.error('\n❌ Error seeding questions:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('\nMongoDB connection closed');
  }
}

// Run the seeding
seedAllQuestions()
  .then(() => {
    logger.info('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n❌ Script failed:', error);
    process.exit(1);
  });
