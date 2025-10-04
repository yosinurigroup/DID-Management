import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data for companies
const mockCompanies = [
  {
    id: '1',
    companyId: 'COMP001',
    companyName: 'Y2K Group IT',
    description: 'Technology Solutions Provider'
  },
  {
    id: '2',
    companyId: 'COMP002',
    companyName: 'Digital Solutions Inc',
    description: 'Digital transformation services'
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
      const { id } = req.query;
      if (id) {
        const company = mockCompanies.find(c => c.id === id);
        if (company) {
          res.status(200).json(company);
        } else {
          res.status(404).json({ error: 'Company not found' });
        }
      } else {
        res.status(200).json(mockCompanies);
      }
      break;

    case 'POST':
      const newCompany = {
        id: Date.now().toString(),
        ...req.body
      };
      mockCompanies.push(newCompany);
      res.status(201).json(newCompany);
      break;

    case 'PUT':
    case 'PATCH':
      const updateId = req.query.id as string;
      const companyIndex = mockCompanies.findIndex(c => c.id === updateId);
      if (companyIndex !== -1) {
        mockCompanies[companyIndex] = { ...mockCompanies[companyIndex], ...req.body };
        res.status(200).json(mockCompanies[companyIndex]);
      } else {
        res.status(404).json({ error: 'Company not found' });
      }
      break;

    case 'DELETE':
      const deleteId = req.query.id as string;
      const deleteIndex = mockCompanies.findIndex(c => c.id === deleteId);
      if (deleteIndex !== -1) {
        mockCompanies.splice(deleteIndex, 1);
        res.status(200).json({ message: 'Company deleted successfully' });
      } else {
        res.status(404).json({ error: 'Company not found' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}