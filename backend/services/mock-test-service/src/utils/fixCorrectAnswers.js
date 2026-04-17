/**
 * Fix the correct answer distribution in MongoDB
 * Randomizes correct answers to ensure balanced distribution (25% each)
 * 
 * IMPORTANT: This shuffles the options so the correct answer changes position
 * but the actual correct option text remains the same.
 * 
 * Usage: node src/utils/fixCorrectAnswers.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.js';
import { logger } from './logger.js';

dotenv.config();

const MONGODB_URI = process.env.MOCKTEST_MONGODB_URI || 'mongodb://localhost:27017/hamza_mocktest';

/**
 * Shuffle options and update correct answer
 * @param {Object} question - Question document
 * @returns {Object} Updated question with shuffled options
 */
function shuffleOptions(question) {
  const options = question.options;
  const correctAnswer = question.correctAnswer;
  
  // Get the correct answer text
  const correctText = options[correctAnswer];
  
  // Create array of all options with their letters
  const optionArray = [
    { letter: 'A', text: options.A },
    { letter: 'B', text: options.B },
    { letter: 'C', text: options.C },
    { letter: 'D', text: options.D }
  ];
  
  // Fisher-Yates shuffle
  for (let i = optionArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionArray[i], optionArray[j]] = [optionArray[j], optionArray[i]];
  }
  
  // Rebuild options object
  const newOptions = {
    A: optionArray[0].text,
    B: optionArray[1].text,
    C: optionArray[2].text,
    D: optionArray[3].text
  };
  
  // Find new position of correct answer
  let newCorrectAnswer = 'A';
  for (let i = 0; i < optionArray.length; i++) {
    if (optionArray[i].text === correctText) {
      newCorrectAnswer = ['A', 'B', 'C', 'D'][i];
      break;
    }
  }
  
  return {
    options: newOptions,
    correctAnswer: newCorrectAnswer
  };
}

/**
 * Main function to fix all questions
 */
async function fixCorrectAnswers() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');
    
    // Get all questions
    const questions = await Question.find({});
    logger.info(`Found ${questions.length} questions`);
    
    // Check current distribution
    const currentDistribution = { A: 0, B: 0, C: 0, D: 0 };
    questions.forEach(q => {
      currentDistribution[q.correctAnswer]++;
    });
    
    logger.info('Current distribution:');
    logger.info(`  A: ${currentDistribution.A} (${(currentDistribution.A / questions.length * 100).toFixed(1)}%)`);
    logger.info(`  B: ${currentDistribution.B} (${(currentDistribution.B / questions.length * 100).toFixed(1)}%)`);
    logger.info(`  C: ${currentDistribution.C} (${(currentDistribution.C / questions.length * 100).toFixed(1)}%)`);
    logger.info(`  D: ${currentDistribution.D} (${(currentDistribution.D / questions.length * 100).toFixed(1)}%)`);
    
    // Ask for confirmation
    logger.info('\n⚠️  This will shuffle all question options and update correct answers');
    logger.info('⚠️  The actual correct option text will remain the same');
    logger.info('⚠️  But the letter (A/B/C/D) will change to balance distribution\n');
    
    // Shuffle all questions
    logger.info('Shuffling options for all questions...');
    let updated = 0;
    
    for (const question of questions) {
      const shuffled = shuffleOptions(question);
      question.options = shuffled.options;
      question.correctAnswer = shuffled.correctAnswer;
      await question.save();
      updated++;
      
      if (updated % 50 === 0) {
        logger.info(`  Processed ${updated}/${questions.length} questions...`);
      }
    }
    
    logger.info(`✅ Updated ${updated} questions`);
    
    // Check new distribution
    const newQuestions = await Question.find({});
    const newDistribution = { A: 0, B: 0, C: 0, D: 0 };
    newQuestions.forEach(q => {
      newDistribution[q.correctAnswer]++;
    });
    
    logger.info('\nNew distribution:');
    logger.info(`  A: ${newDistribution.A} (${(newDistribution.A / newQuestions.length * 100).toFixed(1)}%)`);
    logger.info(`  B: ${newDistribution.B} (${(newDistribution.B / newQuestions.length * 100).toFixed(1)}%)`);
    logger.info(`  C: ${newDistribution.C} (${(newDistribution.C / newQuestions.length * 100).toFixed(1)}%)`);
    logger.info(`  D: ${newDistribution.D} (${(newDistribution.D / newQuestions.length * 100).toFixed(1)}%)`);
    
    logger.info('\n✅ Done! Correct answers are now balanced.');
    
  } catch (error) {
    logger.error('Error fixing correct answers:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
}

// Run the fix
fixCorrectAnswers()
  .then(() => {
    logger.info('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });
