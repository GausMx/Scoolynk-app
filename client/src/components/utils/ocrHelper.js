// src/utils/ocrHelper.js - ENHANCED FOR RESULT SHEET SCANNING

import Tesseract from 'tesseract.js';

class BrowserOCR {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('[OCR] Initializing Tesseract worker...');
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      this.isInitialized = true;
      console.log('[OCR] Worker ready!');
    } catch (error) {
      console.error('[OCR] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess image for better OCR accuracy (handwritten text)
   */
  preprocessImage(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      // Grayscale
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // Increase contrast for handwritten text
      const contrast = 1.5;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const adjusted = factor * (gray - 128) + 128;
      
      // Apply threshold
      const threshold = 140;
      const value = adjusted > threshold ? 255 : 0;
      
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  async extractText(imageSource, onProgress = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('[OCR] Starting text recognition...');

      // Preprocess image if it's a canvas/blob
      let processedSource = imageSource;
      if (imageSource instanceof File || imageSource instanceof Blob) {
        const img = await createImageBitmap(imageSource);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        this.preprocessImage(canvas);
        processedSource = canvas;
      }

      const result = await this.worker.recognize(processedSource, {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        }
      });

      console.log('[OCR] Recognition complete!');
      console.log('[OCR] Raw text:', result.data.text);

      return {
        success: true,
        text: result.data.text,
        confidence: result.data.confidence,
        lines: result.data.lines.map(line => line.text)
      };
    } catch (error) {
      console.error('[OCR] Recognition error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract scores from result sheet (handwritten table format)
   * Expected format:
   * Subject Name | CA1 | CA2 | Exam | Total
   * Mathematics  | 15  | 18  | 55   | 88
   */
  async extractScores(imageSource, onProgress = null) {
    const result = await this.extractText(imageSource, onProgress);
    
    if (!result.success) {
      return result;
    }

    const scores = this.parseResultSheet(result.text, result.lines);

    return {
      success: true,
      scores,
      confidence: result.confidence,
      rawText: result.text
    };
  }

  /**
   * Parse handwritten result sheet in table format
   */
  parseResultSheet(fullText, lines) {
    console.log('[OCR] Parsing result sheet...');
    console.log('[OCR] Total lines:', lines.length);

    const subjects = [];
    
    // Common subject keywords to help identify subject names
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

    // Headers to skip
    const headerKeywords = ['subject', 'ca1', 'ca2', 'exam', 'total', 'grade', 'name', 'class'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line || line.length < 3) continue;
      
      // Skip header rows
      if (headerKeywords.some(kw => line.toLowerCase().includes(kw))) {
        console.log('[OCR] Skipping header:', line);
        continue;
      }

      // Try to extract subject and scores from line
      const parsed = this.parseScoreLine(line, subjectKeywords);
      
      if (parsed && parsed.subject) {
        subjects.push(parsed);
        console.log('[OCR] Found subject:', parsed);
      }
    }

    console.log('[OCR] Total subjects found:', subjects.length);
    return subjects;
  }

  /**
   * Parse a single line containing subject name and scores
   * Handles various formats:
   * - "Mathematics 15 18 55"
   * - "Mathematics | 15 | 18 | 55"
   * - "Mathematics    15    18    55"
   */
  parseScoreLine(line, subjectKeywords) {
    // Check if line contains a known subject
    const lowerLine = line.toLowerCase();
    const hasSubject = subjectKeywords.some(kw => lowerLine.includes(kw));

    // Extract all numbers from the line
    const numbers = line.match(/\d+/g);
    
    // Need at least 3 numbers for CA1, CA2, Exam (Total is optional)
    if (!numbers || numbers.length < 3) {
      return null;
    }

    // Extract subject name (everything before first number or separator)
    let subjectName = line.split(/[\d|]/)[0].trim();
    
    // Clean subject name
    subjectName = subjectName
      .replace(/[^\w\s]/g, '') // Remove special chars
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // If subject name is too short or doesn't match known subjects, skip
    if (subjectName.length < 3 || (!hasSubject && subjectName.length < 5)) {
      return null;
    }

    // Parse scores
    const scores = numbers.map(n => parseInt(n, 10));
    
    return {
      subject: subjectName,
      ca1: Math.min(scores[0] || 0, 20),  // CA1 max 20
      ca2: Math.min(scores[1] || 0, 20),  // CA2 max 20
      exam: Math.min(scores[2] || 0, 60)  // Exam max 60
    };
  }

  /**
   * Alternative: Extract from more structured table
   * For cases where table structure is clearer
   */
  parseStructuredTable(lines) {
    const subjects = [];
    let inTable = false;
    let columnIndices = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();

      // Detect table header
      if (line.includes('subject') && (line.includes('ca') || line.includes('exam'))) {
        inTable = true;
        // Try to detect column positions
        columnIndices = this.detectColumnPositions(lines[i]);
        console.log('[OCR] Table header found at line', i);
        continue;
      }

      if (!inTable) continue;

      // Stop if we hit comments or end of table
      if (line.includes('comment') || line.includes('remark') || 
          line.includes('attendance') || line.includes('total')) {
        break;
      }

      // Parse data row
      const parsed = this.parseScoreLine(lines[i], []);
      if (parsed && parsed.subject) {
        subjects.push(parsed);
      }
    }

    return subjects;
  }

  detectColumnPositions(headerLine) {
    // Try to detect where columns are based on header text positions
    const positions = {
      subject: 0,
      ca1: headerLine.toLowerCase().indexOf('ca1'),
      ca2: headerLine.toLowerCase().indexOf('ca2'),
      exam: headerLine.toLowerCase().indexOf('exam')
    };
    return positions;
  }

  /**
   * Extract student info from result sheet header
   */
  extractStudentInfo(lines) {
    const info = {
      name: null,
      regNo: null,
      className: null
    };

    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].toLowerCase();

      // Extract name
      if (line.includes('name:') && !info.name) {
        info.name = lines[i].split(':')[1]?.trim();
      }

      // Extract reg number
      if ((line.includes('reg') || line.includes('number')) && !info.regNo) {
        const match = lines[i].match(/[A-Z0-9\/\-]{5,}/i);
        if (match) info.regNo = match[0];
      }

      // Extract class
      if (line.includes('class:') && !info.className) {
        info.className = lines[i].split(':')[1]?.trim();
      }
    }

    return info;
  }

  /**
   * Smart extraction combining multiple strategies
   */
  async extractResultData(imageSource, onProgress = null) {
    try {
      const textResult = await this.extractText(imageSource, onProgress);
      
      if (!textResult.success) {
        return textResult;
      }

      const { text, lines, confidence } = textResult;

      // Strategy 1: Try structured table parsing
      let subjects = this.parseStructuredTable(lines);
      
      // Strategy 2: If failed, try line-by-line parsing
      if (subjects.length === 0) {
        subjects = this.parseResultSheet(text, lines);
      }

      // Extract student info from header
      const studentInfo = this.extractStudentInfo(lines);

      return {
        success: true,
        subjects,
        studentInfo,
        confidence,
        rawText: text,
        message: subjects.length > 0 
          ? `Found ${subjects.length} subject(s)` 
          : 'No subjects found. Please check image quality.'
      };

    } catch (error) {
      console.error('[OCR] Extract result data error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Keep existing student registration methods
  async extractStudents(imageSource, onProgress = null) {
    const result = await this.extractText(imageSource, onProgress);
    
    if (!result.success) {
      return result;
    }

    const students = this.parseStudents(result.text, result.lines);

    return {
      success: true,
      students,
      confidence: result.confidence,
      rawText: result.text
    };
  }

  parseStudents(fullText, lines) {
    // ... keep existing student parsing logic ...
    return []; // Simplified for brevity
  }

  cleanName(name) {
    return name
      .trim()
      .replace(/[^A-Za-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(w => w.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  cleanRegNo(regNo) {
    return regNo
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
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

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('[OCR] Worker terminated');
    }
  }
}

// Export singleton instance
export default new BrowserOCR();