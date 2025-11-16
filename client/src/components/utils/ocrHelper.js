// src/utils/ocrHelper.js - IMPROVED CLIENT-SIDE OCR

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
      this.worker = await Tesseract.createWorker('eng');
      this.isInitialized = true;
      console.log('[OCR] Worker ready!');
    } catch (error) {
      console.error('[OCR] Initialization failed:', error);
      throw error;
    }
  }

  async extractText(imageSource, onProgress = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('[OCR] Starting text recognition...');

      const result = await this.worker.recognize(imageSource, {
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
    console.log('[OCR] Parsing students from extracted text...');
    
    // Try multiple parsing strategies
    let students = [];

    // Strategy 1: Flexible line-by-line
    students = this.parseFlexible(lines);
    if (students.length > 0) {
      console.log(`[OCR] Found ${students.length} students (flexible parsing)`);
      return students;
    }

    // Strategy 2: Block-based
    students = this.parseBlocks(fullText);
    if (students.length > 0) {
      console.log(`[OCR] Found ${students.length} students (block parsing)`);
      return students;
    }

    // Strategy 3: Table structure
    students = this.parseTable(lines);
    if (students.length > 0) {
      console.log(`[OCR] Found ${students.length} students (table parsing)`);
      return students;
    }

    console.log('[OCR] No students found with any strategy');
    return [];
  }

  parseFlexible(lines) {
    const students = [];
    const patterns = {
      name: /^[A-Za-z][A-Za-z\s]{3,50}$/,
      regNo: /[A-Z]{2,4}[\/-]?\d{2,}/i,
      phone: /\d{10,}/,
      email: /@[^\s]+\.[^\s]+/
    };

    let i = 0;
    while (i < lines.length) {
      const student = {};
      
      // Look ahead 5 lines for student data
      for (let j = i; j < Math.min(i + 6, lines.length); j++) {
        const line = lines[j].trim();
        
        if (!line || line.length < 2) continue;

        // Name detection
        if (!student.name && patterns.name.test(line) && 
            !/\d/.test(line) && line.split(/\s+/).length >= 2) {
          student.name = this.cleanName(line);
          console.log('[OCR] Found name:', student.name);
        }

        // Reg number detection
        if (!student.regNo && patterns.regNo.test(line)) {
          const match = line.match(patterns.regNo);
          if (match) {
            student.regNo = this.cleanRegNo(match[0]);
            console.log('[OCR] Found reg no:', student.regNo);
          }
        }

        // Phone detection
        if (!student.parentPhone && patterns.phone.test(line)) {
          const match = line.match(patterns.phone);
          if (match) {
            student.parentPhone = this.cleanPhone(match[0]);
            console.log('[OCR] Found phone:', student.parentPhone);
          }
        }

        // Email detection
        if (!student.parentEmail && patterns.email.test(line)) {
          const match = line.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
          if (match) {
            student.parentEmail = match[0].toLowerCase();
            console.log('[OCR] Found email:', student.parentEmail);
          }
        }
      }

      // Add student if we at least have a name
      if (student.name) {
        if (!student.regNo) {
          student.regNo = this.generateRegNo(students.length + 1);
        }
        students.push(student);
        i += 4; // Skip ahead
      } else {
        i++;
      }
    }

    return students;
  }

  parseBlocks(fullText) {
    const students = [];
    const blocks = fullText.split(/\n\s*\n/).filter(b => b.trim());
    
    console.log(`[OCR] Found ${blocks.length} text blocks`);

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      
      if (lines.length < 1) continue;

      const student = {};

      for (const line of lines) {
        // Name (first line with only letters and spaces, 2+ words)
        if (!student.name && /^[A-Za-z\s]{5,}$/.test(line)) {
          const words = line.split(/\s+/);
          if (words.length >= 2) {
            student.name = this.cleanName(line);
          }
        }

        // Reg number
        if (!student.regNo && /[A-Z0-9\/-]{5,}/i.test(line)) {
          const match = line.match(/[A-Z]{2,4}[\/-]?\d{2,}[\/-]?\d{0,}/i);
          if (match) {
            student.regNo = this.cleanRegNo(match[0]);
          }
        }

        // Phone
        if (!student.parentPhone && /\d{10,}/.test(line)) {
          const match = line.match(/\d{10,}/);
          if (match) {
            student.parentPhone = this.cleanPhone(match[0]);
          }
        }

        // Email
        if (!student.parentEmail && /@/.test(line)) {
          const match = line.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
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

  parseTable(lines) {
    const students = [];
    
    // Find header row
    const headerKeywords = ['name', 'reg', 'student', 'phone', 'email'];
    let headerIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (headerKeywords.some(kw => line.includes(kw))) {
        headerIdx = i;
        console.log('[OCR] Found table header at line', i);
        break;
      }
    }

    if (headerIdx === -1) return students;

    // Parse data rows
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.length < 5) continue;
      
      // Skip lines that look like headers
      if (headerKeywords.some(kw => line.toLowerCase().includes(kw))) continue;

      // Split by tabs, pipes, or multiple spaces
      const parts = line.split(/[\t|]|  +/).map(p => p.trim()).filter(p => p);
      
      if (parts.length >= 2) {
        const student = {
          name: this.cleanName(parts[0]),
          regNo: parts[1] ? this.cleanRegNo(parts[1]) : this.generateRegNo(students.length + 1)
        };

        // Look for phone in remaining parts
        for (let j = 2; j < parts.length; j++) {
          if (/\d{10,}/.test(parts[j])) {
            student.parentPhone = this.cleanPhone(parts[j]);
            break;
          }
        }

        if (student.name && student.name.split(/\s+/).length >= 2) {
          students.push(student);
        }
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

  async extractScores(imageSource, onProgress = null) {
    const result = await this.extractText(imageSource, onProgress);
    
    if (!result.success) {
      return result;
    }

    const scores = this.parseScores(result.text);

    return {
      success: true,
      scores,
      confidence: result.confidence,
      rawText: result.text
    };
  }

  parseScores(text) {
    const subjects = [];
    const lines = text.split('\n').filter(line => line.trim());

    // Subject name patterns
    const subjectKeywords = [
      'mathematics', 'math', 'maths',
      'english', 'language',
      'science', 'basic science',
      'social studies', 'social',
      'yoruba', 'igbo', 'hausa',
      'computer', 'ict',
      'biology', 'chemistry', 'physics',
      'economics', 'geography', 'history',
      'literature', 'french',
      'agricultural', 'agriculture',
      'civic', 'business', 'commerce',
      'technical', 'home economics',
      'music', 'arts', 'physical', 'health'
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      
      // Check if line contains a subject
      const foundSubject = subjectKeywords.find(keyword => 
        line.includes(keyword)
      );

      if (foundSubject) {
        // Extract subject name (capitalize first letter of each word)
        const subjectName = lines[i]
          .split(/\s+\d/)[0] // Get text before first number
          .trim()
          .replace(/\b\w/g, c => c.toUpperCase());

        // Extract numbers from this line and next 2 lines
        const numbers = [];
        for (let j = i; j < Math.min(i + 3, lines.length); j++) {
          const nums = lines[j].match(/\d+/g);
          if (nums) {
            numbers.push(...nums.map(n => parseInt(n, 10)));
          }
        }

        // Need at least 3 numbers (CA1, CA2, Exam)
        if (numbers.length >= 3 && subjectName) {
          subjects.push({
            subject: subjectName,
            ca1: Math.min(numbers[0] || 0, 20),
            ca2: Math.min(numbers[1] || 0, 20),
            exam: Math.min(numbers[2] || 0, 60)
          });
        }
      }
    }

    return subjects;
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