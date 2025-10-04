import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data for area codes
const mockAreaCodes = [
  {
    id: '1',
    areaCode: '212',
    state: 'NY',
    city: 'New York',
    didCount: 150,
    availableCount: 25
  },
  {
    id: '2',
    areaCode: '310',
    state: 'CA',
    city: 'Los Angeles',
    didCount: 200,
    availableCount: 45
  },
  {
    id: '3',
    areaCode: '305',
    state: 'FL',
    city: 'Miami',
    didCount: 80,
    availableCount: 15
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (req.method) {
    case 'GET':
      const { id } = req.query;
      if (id) {
        const areaCode = mockAreaCodes.find(ac => ac.id === id);
        if (areaCode) {
          res.status(200).json(areaCode);
        } else {
          res.status(404).json({ error: 'Area code not found' });
        }
      } else {
        res.status(200).json(mockAreaCodes);
      }
      break;

    case 'POST':
      const newAreaCode = {
        id: Date.now().toString(),
        ...req.body
      };
      mockAreaCodes.push(newAreaCode);
      res.status(201).json(newAreaCode);
      break;

    case 'PUT':
      const updateId = req.query.id as string;
      const areaCodeIndex = mockAreaCodes.findIndex(ac => ac.id === updateId);
      if (areaCodeIndex !== -1) {
        mockAreaCodes[areaCodeIndex] = { ...mockAreaCodes[areaCodeIndex], ...req.body };
        res.status(200).json(mockAreaCodes[areaCodeIndex]);
      } else {
        res.status(404).json({ error: 'Area code not found' });
      }
      break;

    case 'DELETE':
      const deleteId = req.query.id as string;
      const deleteIndex = mockAreaCodes.findIndex(ac => ac.id === deleteId);
      if (deleteIndex !== -1) {
        mockAreaCodes.splice(deleteIndex, 1);
        res.status(200).json({ message: 'Area code deleted successfully' });
      } else {
        res.status(404).json({ error: 'Area code not found' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}