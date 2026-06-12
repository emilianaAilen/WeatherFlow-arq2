import mongoose from 'mongoose';

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
      console.info('MongoDB connected successfully');
      return this.instance;
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await mongoose.disconnect();
      this.instance = null;
      console.info('MongoDB disconnected');
    }
  }

  static getInstance(): mongoose.Connection {
    if (!this.instance) {
      throw new Error('MongoDB is not connected');
    }
    return this.instance;
  }
}
