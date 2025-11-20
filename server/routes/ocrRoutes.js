// server/routes/ocrRoutes.js - UPDATED WITH SCORE EXTRACTION

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { 
  extractTextFromImage, 
  extractTextFromBase64,
  extractScoresFromImage,
  extractScoresFromBase64,
  upload 
} from '../controllers/ocrController.js';

const router = express.Router();

// Student registration OCR
router.post('/extract', protect, upload.single('image'), extractTextFromImage);
router.post('/extract-base64', protect, extractTextFromBase64);

// ✅ NEW: Result sheet score extraction
router.post('/extract-scores', protect, upload.single('image'), extractScoresFromImage);
router.post('/extract-scores-base64', protect, extractScoresFromBase64);

export default router;