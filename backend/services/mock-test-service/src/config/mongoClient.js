import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const uri = process.env.MOCKTEST_MONGODB_URI || 'mongodb://localhost:27017/hamza_mocktest';
let connectionPromise;

/**
 * Connect to MongoDB with optimized connection pooling
 * Requirements: 21.5
 */
export async function connectToMongo() {
  if (connectionPromise) return connectionPromise;

  mongoose.set('strictQuery', true);

  connectionPromise = mongoose
    .connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      
      // Connection pool configuration for optimal performance
      // Requirements: 21.5
      maxPoolSize: 50,           // Maximum number of connections in the pool
      minPoolSize: 10,           // Minimum number of connections to maintain
      
      // Timeout configurations
      socketTimeoutMS: 45000,    // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000,   // Give up initial connection after 10 seconds
      
      // Monitoring and health checks
      heartbeatFrequencyMS: 10000,  // Check server health every 10 seconds
      
      // Write concern for data durability
      w: 'majority',             // Wait for majority of replica set to acknowledge writes
      wtimeoutMS: 5000,          // Timeout for write concern
    })
    .then((mongooseInstance) => {
      logger.info('Connected to MongoDB (hamza_mocktest database)');
      logger.info(`Connection pool configured: minPoolSize=10, maxPoolSize=50`);
      
      mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
      mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
      
      // Log connection pool events for monitoring
      mongoose.connection.on('connectionPoolCreated', () => {
        logger.info('MongoDB connection pool created');
      });
      
      mongoose.connection.on('connectionPoolClosed', () => {
        logger.info('MongoDB connection pool closed');
      });
      
      return {
        connection: mongooseInstance.connection,
        db: mongooseInstance.connection.db,
      };
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}

export const connectMongo = connectToMongo;

export function getDb() {
  const db = mongoose.connection?.db;
  if (!db) throw new Error('MongoDB not initialized. Call connectToMongo first');
  return db;
}

export async function closeMongoConnection() {
  if (mongoose.connection) {
    await mongoose.connection.close();
    connectionPromise = null;
    logger.info('MongoDB connection closed');
  }
}
