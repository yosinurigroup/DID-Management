import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data for DIDs (replace with your actual data source)
const mockDIDs = [
  {
    id: '1',
    didNumber: '+1234567890',
    provider: 'Provider A',
    status: 'active',
    assignedTo: 'Company 1',
    areaCode: '123',
    state: 'NY'
  },
  {
    id: '2',
    didNumber: '+1987654321',
    provider: 'Provider B',
    status: 'inactive',
    assignedTo: 'Company 2',
    areaCode: '987',
    state: 'CA'
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (req.method) {
    case 'GET':
      // Get all DIDs or specific DID by ID
      const { id } = req.query;
      if (id) {
        const did = mockDIDs.find(d => d.id === id);
        if (did) {
          res.status(200).json(did);
        } else {
          res.status(404).json({ error: 'DID not found' });
        }
      } else {
        res.status(200).json(mockDIDs);
      }
      break;

    case 'POST':
      // Create new DID
      const newDID = {
        id: Date.now().toString(),
        ...req.body
      };
      mockDIDs.push(newDID);
      res.status(201).json(newDID);
      break;

    case 'PUT':
    case 'PATCH':
      // Update DID
      const updateId = req.query.id as string;
      const didIndex = mockDIDs.findIndex(d => d.id === updateId);
      if (didIndex !== -1) {
        mockDIDs[didIndex] = { ...mockDIDs[didIndex], ...req.body };
        res.status(200).json(mockDIDs[didIndex]);
      } else {
        res.status(404).json({ error: 'DID not found' });
      }
      break;

    case 'DELETE':
      // Delete DID
      const deleteId = req.query.id as string;
      const deleteIndex = mockDIDs.findIndex(d => d.id === deleteId);
      if (deleteIndex !== -1) {
        mockDIDs.splice(deleteIndex, 1);
        res.status(200).json({ message: 'DID deleted successfully' });
      } else {
        res.status(404).json({ error: 'DID not found' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}