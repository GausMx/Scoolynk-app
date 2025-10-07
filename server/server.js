import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import connectDB from './config/db.js';
import protect from './middleware/authMiddleware.js';
import subscriptionGuard from './middleware/subscriptionMiddleware.js';
import requireRole from './middleware/roleMiddleware.js';
// Note: getAdminDashboard moved to adminRoutes for cleaner structure
// import { getAdminDashboard } from './controllers/adminController.js'; 
import bcrypt from 'bcrypt';
import User from './models/User.js';
import testEmailRoutes from "./routes/test.js";


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
    
    const netlifyRegex = /^https:\/\/(?:[a-z0-9-]+\.)?scoolynk-app\.netlify\.app$/;
    const cleanOrigin = origin.replace(/\/$/, '');
    
    if (
      allowedOrigins.includes(cleanOrigin) ||
      netlifyRegex.test(cleanOrigin)
    ) {
      callback(null, true);
    } else {
      console.error('[CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // Cache preflight for 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Define API routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Mount all API routes first (This order is crucial!)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use("/api/test", testEmailRoutes);

// Test route
app.post('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});


// -----------------------------------------------------
// STATIC FILE SERVING / CATCH-ALL ROUTE (FINAL FIX)
// -----------------------------------------------------

// Helper for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  // Assume the client build files are located in a 'client/build' directory
  const buildPath = path.join(__dirname, '..', 'client', 'build');

  // 1. Serve static assets (JS, CSS, images). Must be before the catch-all.
  console.log(`[Prod Config] Serving static files from: ${buildPath}`);
  app.use(express.static(buildPath));

  // 2. FINAL FIX: Use app.use() without a path. This acts as terminal middleware
   // for all requests not handled by previous API routes or static files.
   // It completely bypasses the buggy path-to-regexp parser.
  app.use((req, res) => {
    res.sendFile(path.resolve(buildPath, 'index.html'));
  });
}

// -----------------------------------------------------
// END STATIC FILE SERVING
// -----------------------------------------------------


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
