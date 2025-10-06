// MongoDB Atlas Connection Helper for Vercel Deployment
// This file shows how to connect your app to MongoDB Atlas

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in Vercel dashboard');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: {
  conn: MongoClient | null;
  promise: Promise<MongoClient> | null;
} = (global as any).mongo;

if (!cached) {
  cached = (global as any).mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = MongoClient.connect(MONGODB_URI!, opts);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

// Database name for your DID Management application
export const DB_NAME = 'did-management';

// Collection names
export const COLLECTIONS = {
  DIDS: 'dids',
  COMPANIES: 'companies', 
  AREA_CODES: 'areacodes',
  USERS: 'users'
};

// Example usage in API routes:
/*
import { connectToDatabase, DB_NAME, COLLECTIONS } from '../lib/mongodb';

export default async function handler(req, res) {
  const client = await connectToDatabase();
  const db = client.db(DB_NAME);
  
  const dids = await db.collection(COLLECTIONS.DIDS).find({}).toArray();
  res.json(dids);
}
*/