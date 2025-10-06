import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// NEW IMPORTS for path resolution in ES Modules
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
import { getAdminDashboard } from './controllers/adminController.js';
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

// CORS setup (Unchanged, looks good)
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
// Example of protected routes using a combination of middleware
app.get('/api/admin', protect, subscriptionGuard, requireRole('admin'), getAdminDashboard);

// Test route
app.post('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});


// -----------------------------------------------------
// STATIC FILE SERVING / CATCH-ALL ROUTE (Deployment Fix)
// -----------------------------------------------------

// Helper for __dirname in ES Modules (needed for path resolution)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This logic ensures that in production, any request that did NOT match
// an API route above is assumed to be a client-side route and serves index.html.
if (process.env.NODE_ENV === 'production') {
  // Assume the client build files are located in a 'client/build' directory relative to the server folder
  const buildPath = path.join(__dirname, '..', 'client', 'build');

  // Serve static assets (JS, CSS, images)
  console.log(`[Prod Config] Serving static files from: ${buildPath}`);
  app.use(express.static(buildPath));

  // FIX: Changed '*' to '/*' to resolve the PathError on Render/Express
  app.get('/*', (req, res) => {
    res.sendFile(path.resolve(buildPath, 'index.html'));
  });
}

// -----------------------------------------------------
// END STATIC FILE SERVING
// -----------------------------------------------------


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
