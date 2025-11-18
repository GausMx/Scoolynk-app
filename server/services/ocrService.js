// server/services/ocrService.js - ENHANCED WITH IMAGE PREPROCESSING

import Tesseract from 'tesseract.js';
import sharp from 'sharp'; // Install: npm install sharp

class OCRService {
  constructor() {
    this.enabled = true;
    this.worker = null;
    this.initWorker();
    console.log('[OCR] Tesseract.js service initialized');
  }

  async initWorker() {
    try {
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      console.log('[OCR] Worker ready');
    } catch (error) {
      console.error('[OCR] Worker initialization failed:', error);
    }
  }

  async preprocessImage(imageBuffer) {
    try {
      // Use Sharp for professional image preprocessing
      const processedImage = await sharp(imageBuffer)
        .resize(2000, null, { // Resize to optimal width
          fit: 'inside',
          withoutEnlargement: true
        })
        .greyscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen() // Sharpen edges
        .threshold(128) // Binary threshold
        .png() // Convert to PNG
        .toBuffer();

      console.log('[OCR] Image preprocessed successfully');
      return processedImage;
    } catch (error) {
      console.error('[OCR] Preprocessing error:', error);
      // Return original if preprocessing fails
      return imageBuffer;
    }
  }

  async extractText(imageBuffer) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'OCR service not available'
      };
    }

    try {
      console.log('[OCR] Starting text extraction...');

      // Preprocess image
      const processedImage = await this.preprocessImage(imageBuffer);

      // Perform OCR with optimized settings
      const result = await this.worker.recognize(processedImage, {
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-@.',
      });

      const fullText = result.data.text;
      const lines = fullText.split('\n').filter(line => line.trim() !== '');
      const confidence = result.data.confidence;

      console.log('[OCR] Extraction complete:', {
        linesFound: lines.length,
        confidence: `${confidence.toFixed(2)}%`,
        textLength: fullText.length
      });

      const students = this.parseStudentData(lines, fullText);

      return {
        success: true,
        fullText,
        lines,
        confidence,
        students
      };
    } catch (error) {
      console.error('[OCR] Extraction error:', error);
      return {
        success: false,
        message: error.message || 'Failed to extract text'
      };
    }
  }

  parseStudentData(lines, fullText) {
    const students = [];
    
    console.log('[OCR] Parsing student data from', lines.length, 'lines');
    
    // Try flexible parsing first
    const flexibleParse = this.parseFlexible(lines);
    if (flexibleParse.length > 0) {
      console.log(`[OCR] Found ${flexibleParse.length} students (flexible parsing)`);
      return flexibleParse;
    }

    // Try block parsing
    const blockParse = this.parseBlocks(fullText);
    if (blockParse.length > 0) {
      console.log(`[OCR] Found ${blockParse.length} students (block parsing)`);
      return blockParse;
    }

    console.log('[OCR] No students found');
    return students;
  }

  parseFlexible(lines) {
    const students = [];
    const patterns = {
      name: /^[A-Za-z][A-Za-z\s]{2,50}$/,
      regNo: /[A-Z]{2,4}[\/-]?\d{2,}/i,
      phone: /(?:\+?\d{10,15})/,
      email: /[^\s@]+@[^\s@]+\.[^\s@]+/
    };

    let i = 0;
    while (i < lines.length) {
      const student = {};
      
      // Look ahead 5 lines
      for (let j = i; j < Math.min(i + 6, lines.length); j++) {
        const line = lines[j].trim();
        
        if (line.length < 2) continue;

        // Extract name
        if (!student.name && patterns.name.test(line) && !/\d/.test(line)) {
          const words = line.split(/\s+/);
          if (words.length >= 2) {
            student.name = this.cleanName(line);
          }
        }
        
        // Extract reg number
        if (!student.regNo) {
          const match = line.match(patterns.regNo);
          if (match) {
            student.regNo = this.cleanRegNo(match[0]);
          }
        }
        
        // Extract phone
        if (!student.parentPhone) {
          const match = line.match(patterns.phone);
          if (match) {
            student.parentPhone = this.cleanPhone(match[0]);
          }
        }
        
        // Extract email
        if (!student.parentEmail) {
          const match = line.match(patterns.email);
          if (match) {
            student.parentEmail = match[0].toLowerCase();
          }
        }
      }

      if (student.name) {
        if (!student.regNo) {
          student.regNo = this.generateRegNo(students.length + 1);
        }
        students.push(student);
        i += 4;
      } else {
        i++;
      }
    }

    return students;
  }

  parseBlocks(fullText) {
    const students = [];
    const blocks = fullText.split(/\n\s*\n/).filter(b => b.trim());
    
    for (const block of blocks) {
      const lines = block.split('\n').filter(l => l.trim());
      if (lines.length < 1) continue;

      const student = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (!student.name && /^[A-Za-z\s]{5,}$/.test(trimmed)) {
          const words = trimmed.split(/\s+/);
          if (words.length >= 2) {
            student.name = this.cleanName(trimmed);
          }
        }
        
        if (!student.regNo && /[A-Z0-9\/-]{5,}/i.test(trimmed)) {
          const match = trimmed.match(/[A-Z]{2,4}[\/-]?\d{2,}/i);
          if (match) {
            student.regNo = this.cleanRegNo(match[0]);
          }
        }
        
        if (!student.parentPhone && /\d{10,}/.test(trimmed)) {
          const match = trimmed.match(/\d{10,}/);
          if (match) {
            student.parentPhone = this.cleanPhone(match[0]);
          }
        }
        
        if (!student.parentEmail && /@/.test(trimmed)) {
          const match = trimmed.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
          if (match) {
            student.parentEmail = match[0].toLowerCase();
          }
        }
      }

      if (student.name) {
        if (!student.regNo) {
          student.regNo = this.generateRegNo(students.length + 1);
        }
        students.push(student);
      }
    }

    return students;
  }

  cleanName(name) {
    return name
      .trim()
      .replace(/[^A-Za-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  cleanRegNo(regNo) {
    return regNo.trim().toUpperCase().replace(/\s+/g, '');
  }

  cleanPhone(phone) {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('234') && cleaned.length === 13) {
      return '+' + cleaned;
    }
    
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '+234' + cleaned.substring(1);
    }
    
    return cleaned;
  }

  generateRegNo(index) {
    const year = new Date().getFullYear().toString().slice(-2);
    return `STD/${year}/${String(index).padStart(3, '0')}`;
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

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('[OCR] Worker terminated');
    }
  }
}

export default new OCRService();