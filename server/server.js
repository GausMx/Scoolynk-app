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

// CORS setup for localhost:3000
const corsOptions = {
  // The CORS origin is from your environment variables.
  // This allows frontend apps at the specified URL to communicate with your backend.
  origin: process.env.CORS_ORIGIN,
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

// The PORT is from your environment variables.
// This allows you to configure the port without changing the code.
app.post('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
