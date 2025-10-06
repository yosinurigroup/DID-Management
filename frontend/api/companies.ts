import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'Y3K-DID-Management';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in Vercel dashboard');
}

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection('Companies');

    switch (req.method) {
      case 'GET':
        const { id } = req.query;
        if (id) {
          const company = await collection.findOne({ _id: new ObjectId(id as string) });
          if (company) {
            res.status(200).json({ ...company, id: company._id.toString() });
          } else {
            res.status(404).json({ error: 'Company not found' });
          }
        } else {
          const companies = await collection.find({}).toArray();
          const companiesWithId = companies.map((company: any) => ({ ...company, id: company._id.toString() }));
          res.status(200).json(companiesWithId);
        }
        break;

      case 'POST':
        const newCompany = {
          ...req.body,
          createdAt: new Date().toISOString(),
          didCount: 0,
          status: 'active'
        };
        const insertResult = await collection.insertOne(newCompany);
        res.status(201).json({ ...newCompany, id: insertResult.insertedId.toString() });
        break;

      case 'PUT':
      case 'PATCH':
        const updateId = req.query.id as string;
        const updateData = {
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        await collection.updateOne(
          { _id: new ObjectId(updateId) },
          { $set: updateData }
        );
        res.status(200).json({ ...updateData, id: updateId });
        break;

      case 'DELETE':
        const deleteId = req.query.id as string;
        await collection.deleteOne({ _id: new ObjectId(deleteId) });
        res.status(200).json({ message: 'Company deleted successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}