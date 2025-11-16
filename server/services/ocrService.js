// server/services/ocrService.js - IMPROVED PARSING LOGIC

import Tesseract from 'tesseract.js';

class OCRService {
  constructor() {
    this.enabled = true;
    console.log('[OCR] Tesseract.js initialized (FREE, no API keys needed)');
  }

  async extractText(imageBuffer) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'OCR service not available'
      };
    }

    try {
      console.log('[OCR] Starting text extraction with Tesseract...');

      // Convert buffer to base64 if needed
      let imageSource = imageBuffer;
      if (Buffer.isBuffer(imageBuffer)) {
        imageSource = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      }

      // Perform OCR with better configuration
      const result = await Tesseract.recognize(
        imageSource,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
          // Better preprocessing for text recognition
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        }
      );

      const fullText = result.data.text;
      const lines = fullText.split('\n').filter(line => line.trim() !== '');
      const confidence = result.data.confidence;

      console.log('[OCR] Raw extracted text:', fullText);
      console.log('[OCR] Extraction complete:', {
        linesFound: lines.length,
        confidence: `${confidence.toFixed(2)}%`
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
    
    // Multiple parsing strategies
    console.log('[OCR] Starting student data parsing...');
    
    // Strategy 1: Line-by-line with flexible patterns
    const flexibleParse = this.parseFlexible(lines);
    if (flexibleParse.length > 0) {
      console.log(`[OCR] Flexible parsing found ${flexibleParse.length} students`);
      return flexibleParse;
    }

    // Strategy 2: Table-like structure parsing
    const tableParse = this.parseTableStructure(lines);
    if (tableParse.length > 0) {
      console.log(`[OCR] Table parsing found ${tableParse.length} students`);
      return tableParse;
    }

    // Strategy 3: Block-based parsing (students separated by blank lines)
    const blockParse = this.parseBlocks(fullText);
    if (blockParse.length > 0) {
      console.log(`[OCR] Block parsing found ${blockParse.length} students`);
      return blockParse;
    }

    console.log('[OCR] No students found with any parsing strategy');
    return students;
  }

  parseFlexible(lines) {
    const students = [];
    const patterns = {
      // More flexible name pattern - allows 2-4 words
      name: /^[A-Za-z][A-Za-z\s]{2,50}$/,
      // Flexible registration number patterns
      regNo: /^[A-Z]{2,4}[\/-]?\d{2,4}[\/-]?\d{0,4}$/i,
      // Phone patterns
      phone: /(?:^|\s)(\+?\d{10,15})(?:\s|$)/,
      // Email pattern
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Skip empty or very short lines
      if (line.length < 2) {
        i++;
        continue;
      }

      const student = {};

      // Check current and next few lines for student info
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const currentLine = lines[j].trim();
        
        // Try to extract name (usually first non-number line)
        if (!student.name && patterns.name.test(currentLine) && 
            !/\d/.test(currentLine) && currentLine.split(' ').length >= 2) {
          student.name = this.cleanName(currentLine);
        }
        
        // Try to extract registration number
        if (!student.regNo && patterns.regNo.test(currentLine)) {
          student.regNo = this.cleanRegNo(currentLine);
        }
        
        // Try to extract phone
        const phoneMatch = currentLine.match(patterns.phone);
        if (!student.parentPhone && phoneMatch) {
          student.parentPhone = this.cleanPhone(phoneMatch[1]);
        }
        
        // Try to extract email
        if (!student.parentEmail && patterns.email.test(currentLine)) {
          student.parentEmail = currentLine.toLowerCase().trim();
        }
      }

      // If we found at least a name, add the student
      if (student.name) {
        // Generate reg number if missing
        if (!student.regNo) {
          student.regNo = this.generateRegNo(students.length + 1);
        }
        students.push(student);
        i += 3; // Skip ahead
      } else {
        i++;
      }
    }

    return students;
  }

  parseTableStructure(lines) {
    const students = [];
    
    // Look for table headers
    const headerPatterns = ['name', 'reg', 'phone', 'email', 'parent'];
    let headerIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (headerPatterns.some(pattern => line.includes(pattern))) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      return students;
    }

    // Parse rows after header
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines or lines that look like headers
      if (line.length < 5 || headerPatterns.some(p => line.toLowerCase().includes(p))) {
        continue;
      }

      // Try to split by common delimiters
      const parts = line.split(/[\t|,\s{2,}]/).filter(p => p.trim());
      
      if (parts.length >= 2) {
        const student = {
          name: this.cleanName(parts[0]),
          regNo: parts.length > 1 ? this.cleanRegNo(parts[1]) : this.generateRegNo(students.length + 1)
        };

        // Try to extract phone from remaining parts
        for (let j = 2; j < parts.length; j++) {
          if (/\d{10,}/.test(parts[j])) {
            student.parentPhone = this.cleanPhone(parts[j]);
            break;
          }
        }

        if (student.name && student.name.split(' ').length >= 2) {
          students.push(student);
        }
      }
    }

    return students;
  }

  parseBlocks(fullText) {
    const students = [];
    
    // Split by double newlines or similar separators
    const blocks = fullText.split(/\n\s*\n/).filter(b => b.trim());
    
    for (const block of blocks) {
      const lines = block.split('\n').filter(l => l.trim());
      
      if (lines.length < 2) continue;

      const student = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Name (usually first line with only letters and spaces)
        if (!student.name && /^[A-Za-z\s]{5,}$/.test(trimmed) && 
            trimmed.split(' ').length >= 2) {
          student.name = this.cleanName(trimmed);
        }
        
        // Reg number
        if (!student.regNo && /[A-Z]{2,4}[\/-]?\d{2,}/i.test(trimmed)) {
          const match = trimmed.match(/([A-Z]{2,4}[\/-]?\d{2,}[\/-]?\d{0,4})/i);
          if (match) {
            student.regNo = this.cleanRegNo(match[1]);
          }
        }
        
        // Phone
        if (!student.parentPhone && /\d{10,}/.test(trimmed)) {
          const match = trimmed.match(/(\d{10,})/);
          if (match) {
            student.parentPhone = this.cleanPhone(match[1]);
          }
        }
        
        // Email
        if (!student.parentEmail && /@/.test(trimmed)) {
          const match = trimmed.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
          if (match) {
            student.parentEmail = match[1].toLowerCase();
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
    return regNo
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
  }

  cleanPhone(phone) {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with country code, keep it
    if (cleaned.startsWith('234') && cleaned.length === 13) {
      return '+' + cleaned;
    }
    
    // If starts with 0, convert to +234
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '+234' + cleaned.substring(1);
    }
    
    // Otherwise return as is
    return cleaned;
  }

  generateRegNo(index) {
    const year = new Date().getFullYear().toString().slice(-2);
    return `STD/${year}/${String(index).padStart(3, '0')}`;
  }

  async extractFromBase64(base64Image) {
    try {
      // Remove data URL prefix if present
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

  // Enhanced score parsing for result sheets
  async extractScores(imageBuffer) {
    try {
      const result = await this.extractText(imageBuffer);
      
      if (!result.success) {
        return result;
      }

      const scores = this.parseScoresFromText(result.fullText);
      
      return {
        success: true,
        scores,
        confidence: result.confidence,
        rawText: result.fullText
      };
    } catch (error) {
      console.error('[OCR] Score extraction error:', error);
      return {
        success: false,
        message: 'Failed to extract scores'
      };
    }
  }

  parseScoresFromText(text) {
    const subjects = [];
    const lines = text.split('\n').filter(line => line.trim());

    // Common subject patterns
    const subjectPatterns = [
      /mathematics/i,
      /english/i,
      /science/i,
      /social\s*studies/i,
      /yoruba/i,
      /igbo/i,
      /hausa/i,
      /computer/i,
      /biology/i,
      /chemistry/i,
      /physics/i,
      /economics/i,
      /geography/i,
      /history/i,
      /literature/i,
      /french/i,
      /agricultural/i,
      /civic/i,
      /business/i,
      /commerce/i,
      /accounting/i,
      /technical/i,
      /home\s*economics/i,
      /music/i,
      /arts/i,
      /physical/i,
      /health/i
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line contains a subject name
      const matchedSubject = subjectPatterns.find(pattern => pattern.test(line));
      
      if (matchedSubject) {
        // Extract subject name (everything before numbers)
        const subjectName = line.split(/\s+\d/)[0].trim();
        
        // Look for numbers in this line and next few lines
        const numbers = [];
        for (let j = i; j < Math.min(i + 3, lines.length); j++) {
          // Extract all numbers from the line
          const nums = lines[j].match(/\d+/g);
          if (nums) {
            numbers.push(...nums.map(Number));
          }
        }
        
        // We expect at least 3 numbers (CA1, CA2, Exam)
        if (numbers.length >= 3) {
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
}

export default new OCRService();