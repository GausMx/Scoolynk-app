// server/services/ocrService.js - FINAL FIXED VERSION

import vision from '@google-cloud/vision';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OCRService {
  constructor() {
    try {
      let credentials;

      // ✅ Option 1: Base64 encoded (PRODUCTION - Render)
      if (process.env.GOOGLE_VISION_KEY_BASE64) {
        console.log('[OCR] Using GOOGLE_VISION_KEY_BASE64');
        const base64Key = process.env.GOOGLE_VISION_KEY_BASE64;
        const jsonKey = Buffer.from(base64Key, 'base64').toString('utf8');
        credentials = JSON.parse(jsonKey);
      }
      // ✅ Option 2: Direct JSON string (Alternative)
      else if (process.env.GOOGLE_VISION_KEY) {
        console.log('[OCR] Using GOOGLE_VISION_KEY');
        credentials = JSON.parse(process.env.GOOGLE_VISION_KEY);
      }
      // ✅ Option 3: File path (LOCAL DEVELOPMENT)
      else {
        console.log('[OCR] Using local file');
        const keyPath = path.join(__dirname, '../config/google-vision-key.json');
        this.client = new vision.ImageAnnotatorClient({ keyFilename: keyPath });
        this.enabled = true;
        console.log('[OCR] Google Vision initialized from file');
        return;
      }

      // Initialize client with credentials from env
      if (credentials) {
        this.client = new vision.ImageAnnotatorClient({ credentials });
        this.enabled = true;
        console.log('[OCR] Google Vision initialized successfully');
      } else {
        throw new Error('No credentials found');
      }

    } catch (error) {
      this.enabled = false;
      console.warn('[OCR] Not configured:', error.message);
      console.warn('[OCR] Add GOOGLE_VISION_KEY_BASE64 or GOOGLE_VISION_KEY to env');
    }
  }

  async extractText(imageBuffer) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'OCR service not configured. Add GOOGLE_VISION_KEY to env'
      };
    }

    try {
      const [result] = await this.client.textDetection(imageBuffer);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        return {
          success: false,
          message: 'No text detected in image'
        };
      }

      const fullText = detections[0].description;
      const lines = fullText.split('\n').filter(line => line.trim() !== '');

      return {
        success: true,
        fullText,
        lines,
        students: this.parseStudentData(lines)
      };
    } catch (error) {
      console.error('[OCR] Extraction error:', error);
      return {
        success: false,
        message: error.message || 'Failed to extract text'
      };
    }
  }

  parseStudentData(lines) {
    const students = [];
    const patterns = {
      name: /^[A-Za-z\s]+$/,
      regNo: /^[A-Z0-9\-\/]+$/i,
      phone: /^[\d\+\-\s()]{10,}$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };

    let currentStudent = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length < 2) continue;

      if (patterns.name.test(line) && line.length > 3 && !currentStudent.name) {
        currentStudent.name = line;
      } else if (patterns.regNo.test(line) && line.length > 3 && !currentStudent.regNo) {
        currentStudent.regNo = line;
      } else if (patterns.phone.test(line) && !currentStudent.parentPhone) {
        currentStudent.parentPhone = line.replace(/[\s\-()]/g, '');
      } else if (patterns.email.test(line) && !currentStudent.parentEmail) {
        currentStudent.parentEmail = line.toLowerCase();
      }

      if (currentStudent.name && currentStudent.regNo) {
        students.push({ ...currentStudent });
        currentStudent = {};
      }
    }

    if (currentStudent.name && currentStudent.regNo) {
      students.push(currentStudent);
    }

    return students;
  }

  async extractFromBase64(base64Image) {
    try {
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      return await this.extractText(imageBuffer);
    } catch (error) {
      console.error('[OCR] Base64 extraction error:', error);
      return {
        success: false,
        message: 'Failed to process base64 image'
      };
    }
  }
}

export default new OCRService();