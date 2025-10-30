// server/services/ocrService.js - Google Cloud Vision API

import vision from '@google-cloud/vision';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OCRService {
  constructor() {
    try {
      // Initialize Vision client with credentials
      this.client = new vision.ImageAnnotatorClient({
        keyFilename: path.join(__dirname, '../config/google-vision-key.json')
      });
      this.enabled = true;
      console.log('[OCR Service] Google Cloud Vision initialized successfully');
    } catch (error) {
      this.enabled = false;
      console.warn('[OCR Service] Google Vision not configured:', error.message);
    }
  }

  /**
   * Extract text from image buffer
   * @param {Buffer} imageBuffer - Image file buffer
   * @returns {Promise<Object>} Extracted text and parsed data
   */
  async extractText(imageBuffer) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'OCR service not configured. Add google-vision-key.json'
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
      console.error('[OCR Service] Extraction error:', error);
      return {
        success: false,
        message: error.message || 'Failed to extract text'
      };
    }
  }

  /**
   * Parse student data from extracted text lines
   * @param {Array} lines - Text lines from OCR
   * @returns {Array} Parsed student objects
   */
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
      
      // Skip empty or very short lines
      if (line.length < 2) continue;

      // Check if it's a name (alphabetic with spaces)
      if (patterns.name.test(line) && line.length > 3 && !currentStudent.name) {
        currentStudent.name = line;
      }
      // Check if it's a registration number
      else if (patterns.regNo.test(line) && line.length > 3 && !currentStudent.regNo) {
        currentStudent.regNo = line;
      }
      // Check if it's a phone number
      else if (patterns.phone.test(line) && !currentStudent.parentPhone) {
        currentStudent.parentPhone = line.replace(/[\s\-()]/g, '');
      }
      // Check if it's an email
      else if (patterns.email.test(line) && !currentStudent.parentEmail) {
        currentStudent.parentEmail = line.toLowerCase();
      }
      
      // If we have at least name and regNo, save student
      if (currentStudent.name && currentStudent.regNo) {
        students.push({ ...currentStudent });
        currentStudent = {};
      }
    }

    // Add last student if exists
    if (currentStudent.name && currentStudent.regNo) {
      students.push(currentStudent);
    }

    return students;
  }

  /**
   * Extract text from base64 image
   * @param {String} base64Image - Base64 encoded image
   * @returns {Promise<Object>}
   */
  async extractFromBase64(base64Image) {
    try {
      // Remove data:image/xxx;base64, prefix if present
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      return await this.extractText(imageBuffer);
    } catch (error) {
      console.error('[OCR Service] Base64 extraction error:', error);
      return {
        success: false,
        message: 'Failed to process base64 image'
      };
    }
  }
}

export default new OCRService();