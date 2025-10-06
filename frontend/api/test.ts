// Test API endpoint with simple logging
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Debug information
  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    mongoUri: process.env.MONGODB_URI ? 'CONNECTED' : 'MISSING',
    nodeEnv: process.env.NODE_ENV || 'NOT_SET',
    message: 'API Test Endpoint Working'
  };

  console.log('🔍 API Debug Info:', debugInfo);
  res.status(200).json(debugInfo);
}