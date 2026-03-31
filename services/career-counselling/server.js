import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/mongoClient.js';
import { logger } from './src/utils/logger.js';

/**
 * Career Counselling Service - Server Entry Point
 * Initializes database connection and starts HTTP server
 */

const PORT = process.env.PORT || 5003;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database connection
connectDB()
  .then(() => {
    logger.info('Database connection established');
    
    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`Career Counselling Service started`, {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });
      
      logger.info('Service endpoints:', {
        health: `http://${HOST}:${PORT}/health`,
        api: `http://${HOST}:${PORT}/api/career`,
        docs: `http://${HOST}:${PORT}/`
      });
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          logger.info('Closing database connections...');
          // MongoDB connection will be closed by the SIGINT handler in mongoClient.js
          process.exit(0);
        } catch (err) {
          logger.error('Error during graceful shutdown', { error: err.message });
          process.exit(1);
        }
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason,
        promise: promise
      });
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
  })
  .catch((error) => {
    logger.error('Failed to start service', { error: error.message });
    process.exit(1);
  });
