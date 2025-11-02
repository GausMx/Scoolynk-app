// server/routes/ocrRoutes.js - FIXED

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { extractTextFromImage, extractTextFromBase64, upload } from '../controllers/ocrController.js';

const router = express.Router();

// ✅ FIXED: Remove requireRole or fix it based on your middleware
router.post('/extract', protect, upload.single('image'), extractTextFromImage);
router.post('/extract-base64', protect, extractTextFromBase64);

export default router;