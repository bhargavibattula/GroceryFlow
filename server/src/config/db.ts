import mongoose from 'mongoose';
import { env } from './env';

let memoryServer: any = null;

export async function connectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (env.NODE_ENV === 'test') {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const uri = memoryServer.getUri();
        await mongoose.connect(uri);
        console.log('[Database] Connected to In-Memory MongoDB (Test Mode)');
        return;
      } catch (err) {
        console.warn('[Database] MongoMemoryServer not available, falling back to MONGODB_URI');
      }
    }

    // Try standard MongoDB connection
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 2500,
      });
      console.log(`[Database] Connected to MongoDB at ${env.MONGODB_URI.split('@')[1] || env.MONGODB_URI}`);
    } catch (err: any) {
      // If local MongoDB is not running, spin up MongoMemoryServer for development fallback
      console.warn(`[Database] Could not connect to ${env.MONGODB_URI}: ${err.message}`);
      console.log('[Database] Starting embedded MongoMemoryServer for development...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`[Database] Connected to embedded development MongoMemoryServer at ${uri}`);
    }
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
}
