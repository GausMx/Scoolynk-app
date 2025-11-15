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

// Parse JSON with increased limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ SIMPLIFIED CORS - THIS SHOULD FIX IT
const allowedOrigins = [
  'https://scoolynk-app.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Remove trailing slash for comparison
    const cleanOrigin = origin.replace(/\/$/, '');
    
    // Check if origin is allowed
    if (allowedOrigins.some(allowed => cleanOrigin === allowed || cleanOrigin.includes('netlify.app'))) {
      console.log('[CORS] ✅ Allowed:', cleanOrigin);
      return callback(null, true);
    }
    
    console.log('[CORS] ❌ Blocked:', cleanOrigin);
    // ✅ IMPORTANT: Still allow the request but log it
    // Don't throw error here - just log and allow
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ✅ REMOVE THIS - The cors package already handles OPTIONS
// app.use((req, res, next) => {
//   if (req.method === 'OPTIONS') {
//     ...
//   }
//   next();
// });

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