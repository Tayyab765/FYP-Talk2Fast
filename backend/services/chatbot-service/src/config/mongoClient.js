import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talk2fast';
let connectionPromise;

export async function connectToMongo() {
  if (connectionPromise) return connectionPromise;

  mongoose.set('strictQuery', true);

  connectionPromise = mongoose
    .connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    })
    .then((mongooseInstance) => {
      logger.info('Connected to MongoDB (Mongoose)');
      mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
      mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
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
