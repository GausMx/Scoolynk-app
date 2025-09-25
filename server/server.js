// server/server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import connectDB from './config/db.js';
import protect from './middleware/authMiddleware.js';
import subscriptionGuard from './middleware/subscriptionMiddleware.js';
import requireRole from './middleware/roleMiddleware.js';
import { getAdminDashboard } from './controllers/adminController.js';
import bcrypt from 'bcrypt';
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
const allowedOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    console.log('[CORS] Request origin:', origin);
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    // Allow *.netlify.app and Netlify preview URLs
    if (
      allowedOrigins.includes(cleanOrigin) ||
      /^https:\/\/[a-z0-9-]+--scoolynk-app\.netlify\.app$/.test(cleanOrigin) ||
      /^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(cleanOrigin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
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

app.use('/api/admin', adminRoutes);

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
