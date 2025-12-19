import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import resultRoutes from './routes/resultRoutes.js';
import teacherRoutes from "./routes/teacherRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import subaccountRoutes from "./routes/subaccountRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// Security
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

// Resolve dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------
// 🌐 CORS CONFIG (MUST BE FIRST!)
// -----------------------------------------------------
const allowedOrigins = [
  "https://app.scoolynk.com.ng",
  "https://scoolynk.com.ng",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // Cache preflight for 10 minutes
  })
);

// Handle preflight requests explicitly for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '600');
    return res.status(200).end();
  }
  next();
});

// -----------------------------------------------------
// 📦 BODY PARSER (BEFORE OTHER MIDDLEWARE)
// -----------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// -----------------------------------------------------
// 🚫 PREVENT API CACHING (CRITICAL FOR PWA)
// -----------------------------------------------------
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

// -----------------------------------------------------
// 🔐 SECURITY MIDDLEWARE
// -----------------------------------------------------

// Helmet basics
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disable CSP for API
  })
);

// Prevent HTTP parameter pollution
app.use(hpp());

// Custom sanitization middleware to avoid Express 5+ read-only issue
app.use((req, res, next) => {
  // Simple sanitization function
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        // Remove keys with $ or . (NoSQL injection attempts)
        if (key.includes('$') || key.includes('.')) {
          continue;
        }
        
        // Recursively sanitize nested objects
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  };
  
  // Sanitize body and params (skip query due to Express 5+ read-only)
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
});

// Rate limiter - apply to API routes only
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Skip rate limiting for successful responses
  skip: (req, res) => res.statusCode < 400,
});

app.use("/api/", limiter);

// -----------------------------------------------------
// ROOT ROUTE
// -----------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    message: "School Management API Running",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// -----------------------------------------------------
// API ROUTES
// -----------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/subaccount", subaccountRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/payments", paymentRoutes);

// ✅ PUBLIC RESULT ROUTES (For parent PDF downloads - no auth required)
app.use("/api/results", resultRoutes);

// Test route
app.post("/test", (req, res) => {
  res.json({ message: "Test route working!", body: req.body });
});

// -----------------------------------------------------
// 404 HANDLER
// -----------------------------------------------------
app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// -----------------------------------------------------
// 🔥 GLOBAL ERROR HANDLER
// -----------------------------------------------------
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err.message);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(isDevelopment && { stack: err.stack }),
  });
});

// -----------------------------------------------------
// 🚀 START SERVER
// -----------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`📄 PDF storage: MongoDB (no file system)`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});