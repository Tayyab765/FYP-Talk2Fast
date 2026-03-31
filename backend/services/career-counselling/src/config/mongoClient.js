import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * MongoDB Connection Configuration
 * Handles database connection with retry logic
 */

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/talk2fast';
    
    logger.info('Connecting to MongoDB...', { uri: mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') });
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    logger.info('MongoDB connected successfully', { 
      host: conn.connection.host,
      name: conn.connection.name
    });
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    return conn;
    
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    logger.error('Error during MongoDB disconnect', { error: err.message });
    process.exit(1);
  }
});

export default connectDB;
