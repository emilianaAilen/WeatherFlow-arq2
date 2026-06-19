import mongoose from 'mongoose';
import { logger } from '@/infrastructure/logger';

export class MongoDBConnection {
  private static instance: mongoose.Connection | null = null;

  static async connect(): Promise<mongoose.Connection> {
    if (this.instance) {
      return this.instance;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
      const connection = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      this.instance = connection.connection;
      logger.info('MongoDB connected');
      return this.instance;
    } catch (error) {
      logger.error({ error }, 'MongoDB connection failed');
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await mongoose.disconnect();
      this.instance = null;
      logger.info('MongoDB disconnected');
    }
  }

  static getInstance(): mongoose.Connection {
    if (!this.instance) {
      throw new Error('MongoDB is not connected');
    }
    return this.instance;
  }
}
