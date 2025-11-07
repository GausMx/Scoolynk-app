// server/controllers/resultController.js - TEACHER RESULT MANAGEMENT (UPDATED)

import Result from '../models/Result.js';
import ResultTemplate from '../models/ResultTemplate.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

// ✅ Get active result template for teacher's school
export const getResultTemplate = async (req, res) => {
  try {
    const { term, session } = req.query;

    if (!term || !session) {
      return res.status(400).json({ 
        message: 'Term and session are required.' 
      });
    }
    
    const template = await ResultTemplate.findOne({
      schoolId: req.user.schoolId,
      term,
      session,
      isActive: true
    });

    if (!template) {
      return res.json({ 
        message: 'No result template found for this term/session. Contact admin.',
        template: null
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

// ✅ Create or update result (with filled template image)
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
      status = 'draft',
      filledTemplateImage // NEW: The generated filled template image
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

    // Validate subjects
    const validSubjects = subjects.filter(s => s && s.subject && s.subject.trim() !== '');
    if (validSubjects.length === 0) {
      return res.status(400).json({ message: 'At least one subject with scores is required.' });
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
      result.subjects = validSubjects;
      result.affectiveTraits = affectiveTraits;
      result.fees = fees;
      result.attendance = attendance;
      result.comments = comments;
      result.status = status;
      result.filledTemplateImage = filledTemplateImage; // Save filled template

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
        subjects: validSubjects,
        affectiveTraits,
        fees,
        attendance,
        comments,
        status,
        filledTemplateImage, // Save filled template
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
    res.status(500).json({ message: 'Failed to save result.', error: err.message });
  }
};

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
