import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple mock data that saves to memory (for testing)
let memoryData: any[] = [
  {
    id: '1',
    didNumber: '+12125551001',
    provider: 'Test Provider',
    status: 'active',
    assignedTo: 'Test Company',
    areaCode: '212',
    state: 'NY',
    notes: 'Test DID from live app'
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('🔍 DIDs API called:', req.method, 'MongoDB URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING');

  try {
    switch (req.method) {
      case 'GET':
        const { id } = req.query;
        if (id) {
          const did = memoryData.find(d => d.id === id);
          if (did) {
            res.status(200).json(did);
          } else {
            res.status(404).json({ error: 'DID not found' });
          }
        } else {
          console.log('📊 Returning DIDs data:', memoryData.length, 'items');
          res.status(200).json(memoryData);
        }
        break;

      case 'POST':
        const newDID = {
          id: Date.now().toString(),
          ...req.body,
          createdAt: new Date().toISOString(),
          source: 'live-api'
        };
        memoryData.push(newDID);
        console.log('✅ Created new DID:', newDID.id);
        res.status(201).json(newDID);
        break;

      case 'PUT':
      case 'PATCH':
        const updateId = req.query.id as string;
        const index = memoryData.findIndex(d => d.id === updateId);
        if (index !== -1) {
          memoryData[index] = { ...memoryData[index], ...req.body, updatedAt: new Date().toISOString() };
          console.log('📝 Updated DID:', updateId);
          res.status(200).json(memoryData[index]);
        } else {
          res.status(404).json({ error: 'DID not found' });
        }
        break;

      case 'DELETE':
        const deleteId = req.query.id as string;
        const deleteIndex = memoryData.findIndex(d => d.id === deleteId);
        if (deleteIndex !== -1) {
          memoryData.splice(deleteIndex, 1);
          console.log('🗑️ Deleted DID:', deleteId);
          res.status(200).json({ message: 'DID deleted successfully' });
        } else {
          res.status(404).json({ error: 'DID not found' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: String(error) });
  }
}