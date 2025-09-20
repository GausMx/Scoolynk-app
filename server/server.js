// server/server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';
import protect from './middleware/authMiddleware.js';
import subscriptionGuard from './middleware/subscriptionMiddleware.js';
import requireRole from './middleware/roleMiddleware.js';
import { getAdminDashboard } from './controllers/adminController.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: false }));

// CORS setup
const allowedOrigins = process.env.CORS_ORIGIN.split(',');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Define routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Example of protected routes using a combination of middleware
app.get('/api/admin', protect, subscriptionGuard, requireRole('admin'), getAdminDashboard);

// Test route
app.post('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
