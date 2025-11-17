import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Security middleware
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";

// Routes
import teacherRoutes from "./routes/teacherRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import subaccountRoutes from "./routes/subaccountRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

import connectDB from "./config/db.js";

// -----------------------------------------------------
// INITIAL SETUP
// -----------------------------------------------------
dotenv.config();
connectDB();

const app = express();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------
// SECURITY LAYER (🔥 PRODUCTION-GRADE)
// -----------------------------------------------------

// 1. Helmet (security headers)
app.use(
  helmet({
    crossOriginResourcePolicy: false, // needed for Netlify/React
  })
);

// 2. Content Security Policy (CSP)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "blob:"],
      "connect-src": ["'self'", "*"], // allow API calls
    },
  })
);

// 3. Prevent HTTP Parameter Pollution
app.use(hpp());

// 4. MongoDB Injection protection
app.use(mongoSanitize());

// 5. XSS Protection
app.use(xss());

// 6. Rate Limiting (protect API)
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Calm down. Too many requests." },
  })
);

// -----------------------------------------------------
// JSON + BODY PARSER
// -----------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// -----------------------------------------------------
// CORS CONFIG (STRICT & SAFE)
// -----------------------------------------------------
const allowedOrigins = [
  "https://scoolynk-app.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      console.log("[CORS BLOCKED]", cleanOrigin);
      return callback(null, false); // block silently
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// -----------------------------------------------------
// ROOT ROUTE
// -----------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    message: "School Management API Running",
    status: "OK",
    secure: true,
    timestamp: new Date().toISOString(),
  });
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

// Test route
app.post("/test", (req, res) => {
  res.json({ message: "Test route working!" });
});

// -----------------------------------------------------
// GLOBAL ERROR HANDLER
// -----------------------------------------------------
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// -----------------------------------------------------
// START SERVER
// -----------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running securely on port ${PORT}`);
  console.log("✔ Allowed origins:", allowedOrigins);
});
