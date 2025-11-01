// server/services/ocrService.js - Google Cloud Vision API

import vision from '@google-cloud/vision';

class OCRService {
  constructor() {
    try {
      if (!process.env.GOOGLE_VISION_KEY) {
        throw new Error('GOOGLE_VISION_KEY not set in environment variables');
      }

      // Parse only the required fields from env
      const { type, project_id, private_key, client_email } = JSON.parse(process.env.GOOGLE_VISION_KEY);

      this.client = new vision.ImageAnnotatorClient({
        credentials: { type, project_id, private_key, client_email }
      });

      this.enabled = true;
      console.log('[OCR Service] Google Cloud Vision initialized successfully');
    } catch (error) {
      this.enabled = false;
      console.warn('[OCR Service] Google Vision not configured:', error.message);
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
      console.error('[OCR Service] Extraction error:', error);
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
      console.error('[OCR Service] Base64 extraction error:', error);
      return {
        success: false,
        message: 'Failed to process base64 image'
      };
    }
  }
}

export default new OCRService();
