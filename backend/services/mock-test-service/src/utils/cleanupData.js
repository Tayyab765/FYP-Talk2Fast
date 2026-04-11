/**
 * Cleanup script for development
 * Clears test attempts and analytics data while preserving test templates
 * 
 * Usage: node src/utils/cleanupData.js [--all]
 * 
 * Options:
 *   --all    Also delete test templates and questions (complete reset)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MockTest from '../models/MockTest.js';
import Question from '../models/Question.js';
import TestAttempt from '../models/TestAttempt.js';
import Analytics from '../models/Analytics.js';
import { logger } from './logger.js';

dotenv.config();

const MONGODB_URI = process.env.MOCKTEST_MONGODB_URI || 'mongodb://localhost:27017/hamza_mocktest';

async function cleanupData(options = {}) {
  const { deleteAll = false } = options;
  
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    
    // Always delete attempts and analytics
    logger.info('Deleting test attempts...');
    const attemptsResult = await TestAttempt.deleteMany({});
    logger.info(`Deleted ${attemptsResult.deletedCount} test attempts`);
    
    logger.info('Deleting analytics data...');
    const analyticsResult = await Analytics.deleteMany({});
    logger.info(`Deleted ${analyticsResult.deletedCount} analytics records`);
    
    // Optionally delete test templates and questions
    if (deleteAll) {
      logger.info('Deleting test templates...');
      const testsResult = await MockTest.deleteMany({});
      logger.info(`Deleted ${testsResult.deletedCount} test templates`);
      
      logger.info('Deleting questions...');
      const questionsResult = await Question.deleteMany({});
      logger.info(`Deleted ${questionsResult.deletedCount} questions`);
    }
    
    logger.info('✅ Cleanup completed successfully!');
    
    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`  Test Attempts: ${attemptsResult.deletedCount} deleted`);
    console.log(`  Analytics: ${analyticsResult.deletedCount} deleted`);
    if (deleteAll) {
      console.log(`  Test Templates: ${testsResult.deletedCount} deleted`);
      console.log(`  Questions: ${questionsResult.deletedCount} deleted`);
    } else {
      const testCount = await MockTest.countDocuments();
      const questionCount = await Question.countDocuments();
      console.log(`  Test Templates: ${testCount} preserved`);
      console.log(`  Questions: ${questionCount} preserved`);
    }
    
  } catch (error) {
    logger.error('Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const deleteAll = args.includes('--all');

// Run cleanup if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (deleteAll) {
    console.log('⚠️  WARNING: This will delete ALL data including test templates!');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    
    setTimeout(() => {
      cleanupData({ deleteAll: true })
        .then(() => process.exit(0))
        .catch((error) => {
          console.error('Cleanup failed:', error);
          process.exit(1);
        });
    }, 3000);
  } else {
    console.log('ℹ️  Cleaning up test attempts and analytics (preserving test templates)');
    console.log('Use --all flag to delete everything\n');
    
    cleanupData({ deleteAll: false })
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Cleanup failed:', error);
        process.exit(1);
      });
  }
}

export default cleanupData;
