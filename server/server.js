import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import teacherRoutes from './routes/teacherRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import connectDB from './config/db.js';
import subaccountRoutes from './routes/subaccountRoutes.js';
import ocrRoutes from './routes/ocrRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ✅ REMOVE THIS LINE - It's allowing all origins before your custom logic
// app.use(cors()); // ❌ DELETE THIS

// Parse JSON with increased limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS setup - ✅ SIMPLIFIED AND FIXED
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/$/, ''))
  : ['http://localhost:3000', 'https://scoolynk-app.netlify.app'];

console.log('[CORS] Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    console.log('[CORS] Request from:', origin);
    
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      console.log('[CORS] No origin header - allowing');
      return callback(null, true);
    }
    
    const cleanOrigin = origin.replace(/\/$/, '');
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(cleanOrigin)) {
      console.log('[CORS] Origin allowed:', cleanOrigin);
      return callback(null, true);
    }
    
    // Check for Netlify deploy previews (branch deploys)
    const netlifyRegex = /^https:\/\/(?:[a-z0-9-]+\.)?scoolynk-app\.netlify\.app$/;
    if (netlifyRegex.test(cleanOrigin)) {
      console.log('[CORS] Netlify deploy preview allowed:', cleanOrigin);
      return callback(null, true);
    }
    
    // Reject
    console.error('[CORS] BLOCKED:', cleanOrigin);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400
};

// ✅ Apply CORS with custom options
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  next();
});

// Helper for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------
// API ROUTES
// -----------------------------------------------------

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'School Management API Running',
    cors: 'Configured',
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString()
  });
});

// Mount all API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/subaccount', subaccountRoutes); 
app.use('/api/ocr', ocrRoutes);
app.use('/api/payments', paymentRoutes);

// Test route
app.post('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

console.log('[Server] Frontend hosted on Netlify');

// -----------------------------------------------------
// ERROR HANDLING MIDDLEWARE
// -----------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.stack);
  
  // Handle CORS errors specifically
  if (err.message && err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({
      message: 'CORS policy violation',
      error: err.message
    });
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// -----------------------------------------------------
// START SERVER
// -----------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS enabled for:', allowedOrigins);
});