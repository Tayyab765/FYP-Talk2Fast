const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Database Configuration
 * MongoDB connection setup with error handling
 */

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_counseling';
    
    const options = {
      // useNewUrlParser and useUnifiedTopology are default in Mongoose 6+
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`, {
      database: conn.connection.name,
      port: conn.connection.port
    });
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    return conn;
    
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;
