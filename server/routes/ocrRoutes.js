// server/routes/ocrRoutes.js - NEW FILE

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import { extractTextFromImage, extractTextFromBase64, upload } from '../controllers/ocrController.js';

const router = express.Router();

// OCR endpoints (protected - only teachers and admins)
router.post(
  '/extract', 
  protect, 
  requireRole(['teacher', 'admin']), 
  upload.single('image'), 
  extractTextFromImage
);

router.post(
  '/extract-base64', 
  protect, 
  requireRole(['teacher', 'admin']), 
  extractTextFromBase64
);

export default router;