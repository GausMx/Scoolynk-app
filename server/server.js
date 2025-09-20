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
import bcrypt from 'bcryptjs';
import User from './models/User.js';
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
app.post('/api/create-deployed-user', async (req, res) => {
  try {
    const { name, email, password, role, schoolId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({ name, email, passwordHash, role, schoolId });
    await user.save();

    res.json({ message: 'Deployed user created', user: { email, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
