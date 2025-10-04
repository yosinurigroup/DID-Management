import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb://localhost:27017/dids-analytics') {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } else {
      console.log('MongoDB connection skipped - using mock data');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Continuing without database - using mock data');
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'DID Management API Server' });
});

// Import routes
import didsRoutes from './routes/dids';
import areacodesRoutes from './routes/areacodes';
import companiesRoutes from './routes/companies';
import uploadRoutes from './routes/upload';

// API Routes
app.use('/api/dids', didsRoutes);
app.use('/api/areacodes', areacodesRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/upload', uploadRoutes);

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();