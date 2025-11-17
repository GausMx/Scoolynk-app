import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Security
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

dotenv.config();
connectDB();

const app = express();

// Resolve dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------
// 🔐 SECURITY MIDDLEWARE
// -----------------------------------------------------

// Helmet basics (CSP removed for now so API won’t break)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Prevent HTTP parameter pollution
app.use(hpp());

// XSS cleaning
app.use(xss());

// Fix mongo-sanitize bug (Express 5 read-only req.query)
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

// Rate limiter
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: { message: "Too many requests." },
  })
);

// -----------------------------------------------------
// 📦 BODY PARSER
// -----------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// -----------------------------------------------------
// 🌐 CORS CONFIG (stable + predictable)
// -----------------------------------------------------
const allowedOrigins = [
  "https://scoolynk-app.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

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

// -----------------------------------------------------
// API ROUTES
// -----------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/subaccount", subaccountRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/payments", paymentRoutes);

// Test
app.post("/test", (req, res) => {
  res.json({ message: "Test route working!" });
});

// -----------------------------------------------------
// 🔥 GLOBAL ERROR HANDLER
// -----------------------------------------------------
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err.message);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// -----------------------------------------------------
// 🚀 START SERVER
// -----------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
