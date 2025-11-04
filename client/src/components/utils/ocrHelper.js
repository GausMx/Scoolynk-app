// src/utils/ocrHelper.js - CLIENT-SIDE OCR (NO SERVER NEEDED!)

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