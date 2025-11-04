// server/services/ocrService.js - TESSERACT.JS VERSION (FREE, NO API KEYS)

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

      // Perform OCR
      const result = await Tesseract.recognize(
        imageSource,
        'eng', // Language
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const fullText = result.data.text;
      const lines = fullText.split('\n').filter(line => line.trim() !== '');
      const confidence = result.data.confidence;

      console.log('[OCR] Extraction complete:', {
        linesFound: lines.length,
        confidence: `${confidence.toFixed(2)}%`
      });

      return {
        success: true,
        fullText,
        lines,
        confidence,
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