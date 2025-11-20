// server/controllers/ocrController.js - ENHANCED FOR RESULT SHEETS

import ocrService from '../services/ocrService.js';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * Extract text from uploaded image (for student registration)
 * POST /api/ocr/extract
 */
export const extractTextFromImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const result = await ocrService.extractText(req.file.buffer);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      success: true,
      message: 'Text extracted successfully',
      data: {
        fullText: result.fullText,
        students: result.students,
        linesCount: result.lines.length
      }
    });
  } catch (error) {
    console.error('[OCR Extract Error]', error);
    res.status(500).json({ message: 'Failed to process image' });
  }
};

/**
 * Extract text from base64 image
 * POST /api/ocr/extract-base64
 */
export const extractTextFromBase64 = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const result = await ocrService.extractFromBase64(image);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      success: true,
      message: 'Text extracted successfully',
      data: {
        fullText: result.fullText,
        students: result.students,
        linesCount: result.lines?.length || 0
      }
    });
  } catch (error) {
    console.error('[OCR Base64 Extract Error]', error);
    res.status(500).json({ message: 'Failed to process image' });
  }
};

/**
 * NEW: Extract scores from result sheet image
 * POST /api/ocr/extract-scores
 */
export const extractScoresFromImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided' 
      });
    }

    console.log('[OCR] Processing result sheet image...');
    console.log('[OCR] File size:', req.file.size, 'bytes');

    const result = await ocrService.extractScores(req.file.buffer);

    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: result.message || 'Failed to extract scores' 
      });
    }

    console.log('[OCR] Extracted', result.scores?.length || 0, 'subjects');

    res.json({
      success: true,
      message: `Extracted ${result.scores.length} subject(s) successfully`,
      data: {
        scores: result.scores,
        confidence: result.confidence,
        rawText: result.fullText,
        linesCount: result.lines?.length || 0
      }
    });

  } catch (error) {
    console.error('[OCR Extract Scores Error]', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process result sheet',
      error: error.message 
    });
  }
};

/**
 * NEW: Extract scores from base64 image
 * POST /api/ocr/extract-scores-base64
 */
export const extractScoresFromBase64 = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ 
        success: false,
        message: 'No image data provided' 
      });
    }

    console.log('[OCR] Processing base64 result sheet...');

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const result = await ocrService.extractScores(imageBuffer);

    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: result.message || 'Failed to extract scores' 
      });
    }

    console.log('[OCR] Extracted', result.scores?.length || 0, 'subjects');

    res.json({
      success: true,
      message: `Extracted ${result.scores.length} subject(s) successfully`,
      data: {
        scores: result.scores,
        confidence: result.confidence,
        rawText: result.fullText,
        linesCount: result.lines?.length || 0
      }
    });

  } catch (error) {
    console.error('[OCR Extract Scores Base64 Error]', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process result sheet',
      error: error.message 
    });
  }
};