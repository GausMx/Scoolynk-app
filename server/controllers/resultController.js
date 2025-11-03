// server/controllers/resultController.js - TEACHER RESULT MANAGEMENT

import Result from '../models/Result.js';
import ResultTemplate from '../models/ResultTemplate.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import OCRService from '../services/ocrService.js';

// Get active result template for teacher's school
export const getResultTemplate = async (req, res) => {
  try {
    const { term, session } = req.query;
    
    const template = await ResultTemplate.findOne({
      schoolId: req.user.schoolId,
      term,
      session,
      isActive: true
    });

    if (!template) {
      return res.status(404).json({ 
        message: 'No result template found for this term/session. Please contact admin.' 
      });
    }

    res.json({ template });
  } catch (err) {
    console.error('[GetResultTemplate]', err);
    res.status(500).json({ message: 'Failed to fetch result template.' });
  }
};

// Get all results for teacher's class (by term/session)
export const getMyClassResults = async (req, res) => {
  try {
    const { term, session, status } = req.query;
    const teacherId = req.user._id;

    // Get teacher's class teacher assignments
    const teacher = await User.findById(teacherId).select('classTeacherFor');
    
    if (!teacher.classTeacherFor || teacher.classTeacherFor.length === 0) {
      return res.json({ results: [], message: 'You are not a class teacher for any class.' });
    }

    const query = {
      classId: { $in: teacher.classTeacherFor },
      schoolId: req.user.schoolId,
      teacher: teacherId
    };

    if (term) query.term = term;
    if (session) query.session = session;
    if (status) query.status = status;

    const results = await Result.find(query)
      .populate('student', 'name regNo')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    res.json({ results });
  } catch (err) {
    console.error('[GetMyClassResults]', err);
    res.status(500).json({ message: 'Failed to fetch results.' });
  }
};

// Get single result by ID
export const getResultById = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id: resultId,
      schoolId: req.user.schoolId
    })
    .populate('student', 'name regNo parentPhone parentName')
    .populate('classId', 'name fee')
    .populate('teacher', 'name');

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    // Verify teacher has access
    if (result.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ result });
  } catch (err) {
    console.error('[GetResultById]', err);
    res.status(500).json({ message: 'Failed to fetch result.' });
  }
};

// Create or update result (manual entry)
export const saveResult = async (req, res) => {
  try {
    const {
      resultId,
      studentId,
      term,
      session,
      subjects,
      affectiveTraits,
      fees,
      attendance,
      comments,
      status = 'draft'
    } = req.body;

    const teacherId = req.user._id;

    // Verify student exists and belongs to teacher's class
    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.user.schoolId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const teacher = await User.findById(teacherId);
    const hasAccess = teacher.classTeacherFor?.some(
      classId => classId.toString() === student.classId.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. Not class teacher for this student.' });
    }

    let result;

    if (resultId) {
      // Update existing result
      result = await Result.findOne({
        _id: resultId,
        teacher: teacherId,
        schoolId: req.user.schoolId
      });

      if (!result) {
        return res.status(404).json({ message: 'Result not found or access denied.' });
      }

      // Only allow editing if draft or rejected
      if (!['draft', 'rejected'].includes(result.status)) {
        return res.status(400).json({ 
          message: 'Cannot edit result in current status.' 
        });
      }

      // Update fields
      result.subjects = subjects;
      result.affectiveTraits = affectiveTraits;
      result.fees = fees;
      result.attendance = attendance;
      result.comments = comments;
      result.status = status;

      if (status === 'submitted') {
        result.submittedAt = new Date();
      }

    } else {
      // Create new result
      result = new Result({
        student: studentId,
        classId: student.classId,
        schoolId: req.user.schoolId,
        teacher: teacherId,
        term,
        session,
        subjects,
        affectiveTraits,
        fees,
        attendance,
        comments,
        status,
        submittedAt: status === 'submitted' ? new Date() : null
      });
    }

    await result.save();

    const populatedResult = await Result.findById(result._id)
      .populate('student', 'name regNo')
      .populate('classId', 'name');

    res.json({ 
      message: status === 'submitted' 
        ? 'Result submitted successfully.' 
        : 'Result saved as draft.',
      result: populatedResult 
    });
  } catch (err) {
    console.error('[SaveResult]', err);
    res.status(500).json({ message: 'Failed to save result.' });
  }
};

// Scan scores using OCR
export const scanScores = async (req, res) => {
  try {
    const { base64Image, studentId, term, session } = req.body;

    if (!base64Image) {
      return res.status(400).json({ message: 'Image data is required.' });
    }

    // Verify student
    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.user.schoolId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Extract text using OCR
    const ocrResult = await OCRService.extractFromBase64(base64Image);

    if (!ocrResult.success) {
      return res.status(400).json({ 
        message: ocrResult.message || 'Failed to extract text from image.' 
      });
    }

    // Parse scores from OCR text
    const parsedScores = parseScoresFromOCR(ocrResult.fullText);

    if (!parsedScores || parsedScores.length === 0) {
      return res.status(400).json({ 
        message: 'No valid scores found in the scanned image.',
        rawText: ocrResult.fullText
      });
    }

    // Check if result already exists for this student/term/session
    let result = await Result.findOne({
      student: studentId,
      term,
      session,
      schoolId: req.user.schoolId
    });

    if (result) {
      // Update existing with scanned data
      result.subjects = parsedScores;
      result.wasScanned = true;
      result.scanData = {
        scannedAt: new Date(),
        rawText: ocrResult.fullText
      };
    } else {
      // Create new result with scanned data
      result = new Result({
        student: studentId,
        classId: student.classId,
        schoolId: req.user.schoolId,
        teacher: req.user._id,
        term,
        session,
        subjects: parsedScores,
        wasScanned: true,
        scanData: {
          scannedAt: new Date(),
          rawText: ocrResult.fullText
        },
        status: 'draft'
      });
    }

    await result.save();

    const populatedResult = await Result.findById(result._id)
      .populate('student', 'name regNo')
      .populate('classId', 'name');

    res.json({ 
      message: 'Scores scanned successfully. Please review and edit before submitting.',
      result: populatedResult,
      ocrConfidence: ocrResult.confidence || 'N/A'
    });
  } catch (err) {
    console.error('[ScanScores]', err);
    res.status(500).json({ message: 'Failed to scan scores.' });
  }
};

// Helper function to parse scores from OCR text
function parseScoresFromOCR(text) {
  const subjects = [];
  const lines = text.split('\n').filter(line => line.trim());

  // Common subject names pattern
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
    /accounting/i
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line contains a subject name
    const matchedSubject = subjectPatterns.find(pattern => pattern.test(line));
    
    if (matchedSubject) {
      // Extract subject name
      const subjectName = line.split(/\s+\d/)[0].trim();
      
      // Look for numbers in this line and next few lines
      const numbers = [];
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const nums = lines[j].match(/\d+/g);
        if (nums) {
          numbers.push(...nums.map(Number));
        }
      }
      
      // Expect at least 3 numbers (CA1, CA2, Exam)
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

// Submit result to admin
export const submitResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id: resultId,
      teacher: req.user._id,
      schoolId: req.user.schoolId
    });

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    if (result.status !== 'draft' && result.status !== 'rejected') {
      return res.status(400).json({ 
        message: 'Only draft or rejected results can be submitted.' 
      });
    }

    result.status = 'submitted';
    result.submittedAt = new Date();
    await result.save();

    res.json({ message: 'Result submitted to admin for review.' });
  } catch (err) {
    console.error('[SubmitResult]', err);
    res.status(500).json({ message: 'Failed to submit result.' });
  }
};

// Submit multiple results at once
export const submitMultipleResults = async (req, res) => {
  try {
    const { resultIds } = req.body;

    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({ message: 'Result IDs array is required.' });
    }

    const results = await Result.updateMany(
      {
        _id: { $in: resultIds },
        teacher: req.user._id,
        schoolId: req.user.schoolId,
        status: { $in: ['draft', 'rejected'] }
      },
      {
        $set: {
          status: 'submitted',
          submittedAt: new Date()
        }
      }
    );

    res.json({ 
      message: `${results.modifiedCount} result(s) submitted to admin for review.`,
      count: results.modifiedCount
    });
  } catch (err) {
    console.error('[SubmitMultipleResults]', err);
    res.status(500).json({ message: 'Failed to submit results.' });
  }
};

// Delete result (only drafts)
export const deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id: resultId,
      teacher: req.user._id,
      schoolId: req.user.schoolId
    });

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    if (result.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Only draft results can be deleted.' 
      });
    }

    await Result.findByIdAndDelete(resultId);

    res.json({ message: 'Result deleted successfully.' });
  } catch (err) {
    console.error('[DeleteResult]', err);
    res.status(500).json({ message: 'Failed to delete result.' });
  }
};
