// server/routes/resultRoutes.js - PUBLIC RESULT ROUTES

import express from 'express';
import { downloadResultPDF } from '../controllers/adminResultController.js';

const router = express.Router();

/**
 * @route   GET /api/results/download/:resultId
 * @desc    Download result PDF (PUBLIC - no auth required for parent access)
 * @access  Public
 */
router.get('/download/:resultId', downloadResultPDF);

export default router;  