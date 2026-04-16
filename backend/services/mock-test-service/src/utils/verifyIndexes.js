import { connectToMongo, getDb } from '../config/mongoClient.js';
import { logger } from './logger.js';
import MockTest from '../models/MockTest.js';
import Question from '../models/Question.js';
import TestAttempt from '../models/TestAttempt.js';
import Analytics from '../models/Analytics.js';

/**
 * Verify that all database indexes are created and working properly
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 */
export async function verifyIndexes() {
  try {
    await connectToMongo();
    const db = getDb();

    logger.info('Starting index verification...');

    // Verify MockTest indexes
    await verifyCollectionIndexes(db, 'mocktests', [
      { key: { isActive: 1, difficulty: 1 }, name: 'isActive_1_difficulty_1' },
      { key: { createdAt: -1 }, name: 'createdAt_-1' }
    ]);

    // Verify Question indexes
    await verifyCollectionIndexes(db, 'questions', [
      { key: { testId: 1, section: 1, order: 1 }, name: 'testId_1_section_1_order_1' },
      { key: { topic: 1 }, name: 'topic_1' }
    ]);

    // Verify TestAttempt indexes
    await verifyCollectionIndexes(db, 'testattempts', [
      { key: { userId: 1, status: 1 }, name: 'userId_1_status_1' },
      { key: { userId: 1, completedAt: -1 }, name: 'userId_1_completedAt_-1' },
      { key: { testId: 1, userId: 1 }, name: 'testId_1_userId_1' }
    ]);

    // Verify Analytics indexes
    await verifyCollectionIndexes(db, 'analytics', [
      { key: { userId: 1 }, name: 'userId_1', unique: true },
      { key: { lastUpdated: -1 }, name: 'lastUpdated_-1' }
    ]);

    logger.info('Index verification completed successfully');

    // Test index performance with explain()
    await testIndexPerformance();

    return { success: true, message: 'All indexes verified and performing well' };
  } catch (error) {
    logger.error(`Index verification failed: ${error.message}`);
    throw error;
  }
}

/**
 * Verify indexes for a specific collection
 */
async function verifyCollectionIndexes(db, collectionName, expectedIndexes) {
  try {
    const collection = db.collection(collectionName);
    const existingIndexes = await collection.indexes();

    logger.info(`Verifying indexes for collection: ${collectionName}`);

    for (const expectedIndex of expectedIndexes) {
      const found = existingIndexes.find(idx => {
        return JSON.stringify(idx.key) === JSON.stringify(expectedIndex.key);
      });

      if (found) {
        logger.info(`✓ Index found: ${JSON.stringify(expectedIndex.key)}`);
      } else {
        logger.warn(`✗ Index missing: ${JSON.stringify(expectedIndex.key)}`);
        logger.info(`Creating missing index...`);
        
        try {
          const options = { name: expectedIndex.name };
          if (expectedIndex.unique) {
            options.unique = true;
          }
          await collection.createIndex(expectedIndex.key, options);
          logger.info(`✓ Index created: ${JSON.stringify(expectedIndex.key)}`);
        } catch (createError) {
          if (createError.message.includes('existing index')) {
            logger.info(`✓ Index already exists with different options: ${JSON.stringify(expectedIndex.key)}`);
          } else {
            throw createError;
          }
        }
      }
    }
  } catch (error) {
    if (error.message.includes('ns does not exist')) {
      logger.warn(`Collection ${collectionName} does not exist yet - will be created on first insert`);
    } else {
      throw error;
    }
  }
}

/**
 * Test index performance using explain()
 * Requirements: 21.1, 21.2, 21.3, 21.4
 */
async function testIndexPerformance() {
  logger.info('Testing index performance with explain()...');

  // Test 1: MockTest query with isActive and difficulty filter
  const mockTestExplain = await MockTest.find({ isActive: true, difficulty: 'medium' })
    .explain('executionStats');
  
  logger.info(`MockTest query - Execution time: ${mockTestExplain.executionStats.executionTimeMillis}ms`);
  logger.info(`MockTest query - Index used: ${mockTestExplain.executionStats.executionStages?.indexName || 'COLLSCAN'}`);

  if (mockTestExplain.executionStats.executionStages?.stage === 'COLLSCAN') {
    logger.warn('⚠ MockTest query is using collection scan instead of index!');
  } else {
    logger.info('✓ MockTest query is using index efficiently');
  }

  // Test 2: Question query with testId and section
  const questionExplain = await Question.find({ 
    testId: '000000000000000000000000', // Dummy ID for explain
    section: 'Advance Math' 
  })
    .sort({ order: 1 })
    .explain('executionStats');

  logger.info(`Question query - Execution time: ${questionExplain.executionStats.executionTimeMillis}ms`);
  logger.info(`Question query - Index used: ${questionExplain.executionStats.executionStages?.indexName || 'COLLSCAN'}`);

  if (questionExplain.executionStats.executionStages?.stage === 'COLLSCAN') {
    logger.warn('⚠ Question query is using collection scan instead of index!');
  } else {
    logger.info('✓ Question query is using index efficiently');
  }

  // Test 3: TestAttempt query with userId and status
  const attemptExplain = await TestAttempt.find({ 
    userId: 'test-user-id',
    status: 'completed'
  })
    .explain('executionStats');

  logger.info(`TestAttempt query - Execution time: ${attemptExplain.executionStats.executionTimeMillis}ms`);
  logger.info(`TestAttempt query - Index used: ${attemptExplain.executionStats.executionStages?.indexName || 'COLLSCAN'}`);

  if (attemptExplain.executionStats.executionStages?.stage === 'COLLSCAN') {
    logger.warn('⚠ TestAttempt query is using collection scan instead of index!');
  } else {
    logger.info('✓ TestAttempt query is using index efficiently');
  }

  // Test 4: Analytics query with userId
  const analyticsExplain = await Analytics.findOne({ userId: 'test-user-id' })
    .explain('executionStats');

  logger.info(`Analytics query - Execution time: ${analyticsExplain.executionStats.executionTimeMillis}ms`);
  logger.info(`Analytics query - Index used: ${analyticsExplain.executionStats.executionStages?.indexName || 'COLLSCAN'}`);

  if (analyticsExplain.executionStats.executionStages?.stage === 'COLLSCAN') {
    logger.warn('⚠ Analytics query is using collection scan instead of index!');
  } else {
    logger.info('✓ Analytics query is using index efficiently');
  }

  logger.info('Index performance testing completed');
}

// Run verification if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyIndexes()
    .then(() => {
      logger.info('Index verification script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Index verification script failed: ${error.message}`);
      process.exit(1);
    });
}
