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

  /**
   * NEW: Extract scores from result sheet
   */
  async extractScores(imageBuffer) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'OCR service not available'
      };
    }

    try {
      console.log('[OCR] Starting score extraction...');

      // Preprocess image for handwritten text
      const processedImage = await this.preprocessImage(imageBuffer);

      // Perform OCR with settings optimized for handwritten text
      const result = await this.worker.recognize(processedImage, {
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        // Don't use whitelist for handwritten - let it recognize everything
      });

      const fullText = result.data.text;
      const lines = fullText.split('\n').filter(line => line.trim() !== '');
      const confidence = result.data.confidence;

      console.log('[OCR] Score extraction complete:', {
        linesFound: lines.length,
        confidence: `${confidence.toFixed(2)}%`
      });

      const scores = this.parseResultSheet(lines, fullText);

      return {
        success: true,
        scores,
        fullText,
        lines,
        confidence
      };
    } catch (error) {
      console.error('[OCR] Score extraction error:', error);
      return {
        success: false,
        message: error.message || 'Failed to extract scores'
      };
    }
  }

  /**
   * Parse result sheet to extract subject scores
   */
  parseResultSheet(lines, fullText) {
    console.log('[OCR] Parsing result sheet from', lines.length, 'lines');
    
    const subjects = [];
    const subjectKeywords = [
      'mathematics', 'math', 'maths',
      'english', 'language',
      'science', 'basic science', 'physics', 'chemistry', 'biology',
      'social studies', 'social',
      'yoruba', 'igbo', 'hausa',
      'computer', 'ict', 'technology',
      'economics', 'geography', 'history',
      'literature', 'french',
      'agricultural', 'agriculture',
      'civic', 'business', 'commerce',
      'technical', 'home economics',
      'music', 'arts', 'physical', 'health',
      'religious', 'christian', 'islamic'
    ];

    const headerKeywords = ['subject', 'ca1', 'ca2', 'exam', 'total', 'grade'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.length < 3) continue;
      
      // Skip headers
      if (headerKeywords.some(kw => line.toLowerCase().includes(kw))) {
        console.log('[OCR] Skipping header:', line);
        continue;
      }

      // Parse score line
      const parsed = this.parseScoreLine(line, subjectKeywords);
      
      if (parsed && parsed.subject) {
        subjects.push(parsed);
        console.log('[OCR] Found subject:', parsed.subject, 
                   `CA1:${parsed.ca1} CA2:${parsed.ca2} Exam:${parsed.exam}`);
      }
    }

    console.log('[OCR] Total subjects extracted:', subjects.length);
    return subjects;
  }

  /**
   * Parse single line to extract subject and scores
   */
  parseScoreLine(line, subjectKeywords) {
    // Check if line contains known subject
    const lowerLine = line.toLowerCase();
    const hasSubject = subjectKeywords.some(kw => lowerLine.includes(kw));

    // Extract all numbers
    const numbers = line.match(/\d+/g);
    
    // Need at least 3 numbers (CA1, CA2, Exam)
    if (!numbers || numbers.length < 3) {
      return null;
    }

    // Extract subject name (before first number)
    let subjectName = line.split(/[\d|]/)[0].trim();
    
    // Clean subject name
    subjectName = subjectName
      .replace(/[^\w\s]/g, '')
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Validate subject name
    if (subjectName.length < 3 || (!hasSubject && subjectName.length < 5)) {
      return null;
    }

    // Parse scores
    const scores = numbers.map(n => parseInt(n, 10));
    
    return {
      subject: subjectName,
      ca1: Math.min(scores[0] || 0, 20),
      ca2: Math.min(scores[1] || 0, 20),
      exam: Math.min(scores[2] || 0, 60)
    };
  }
}

export const ocrService = new OCRService();