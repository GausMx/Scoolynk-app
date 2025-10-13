import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import connectDB from './config/db.js';
import protect from './middleware/authMiddleware.js';
import subscriptionGuard from './middleware/subscriptionMiddleware.js';
import requireRole from './middleware/roleMiddleware.js';
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
    
    // Regex to match scoolynk-app.netlify.app and any subdomain/branch deploy
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

// Apply CORS middleware globally
app.use(cors(corsOptions));

// Handle preflight requests using middleware instead of app.options('*')
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Set CORS headers for preflight
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
// STATIC FILE SERVING (Production Only - Before Routes)
// -----------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'client', 'build');
  console.log(`[Prod Config] Serving static files from: ${buildPath}`);
  app.use(express.static(buildPath));
}

// -----------------------------------------------------
// API ROUTES (Must come AFTER static files, BEFORE catch-all)
// -----------------------------------------------------

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Mount all API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use("/api/test", testEmailRoutes);

// Test route
app.post('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

// -----------------------------------------------------
// CATCH-ALL ROUTE FOR CLIENT-SIDE ROUTING (Must be LAST)
// -----------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'client', 'build');
  
  // This MUST be the last middleware - catches all remaining requests
  // and serves index.html for client-side routing (React Router)
  // Using app.use() with custom logic to avoid path-to-regexp wildcard issues
  app.use((req, res, next) => {
    // Only handle GET requests that haven't been handled by API routes
    if (req.method === 'GET') {
      console.log(`[Catch-All] Serving index.html for: ${req.path}`);
      res.sendFile(path.resolve(buildPath, 'index.html'), (err) => {
        if (err) {
          console.error('[Catch-All Error]', err);
          res.status(500).send('Error loading page');
        }
      });
    } else {
      // For non-GET methods, pass to error handler
      next();
    }
  });
}

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));