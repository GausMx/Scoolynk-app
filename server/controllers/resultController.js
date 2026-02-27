// server/controllers/resultController.js - TEACHER RESULT MANAGEMENT

import Result from '../models/Result.js';
import ResultTemplate from '../models/ResultTemplate.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

// ─── Get active result template ───────────────────────────────────────────────
export const getResultTemplate = async (req, res) => {
  try {
    const { term, session } = req.query;

    if (!term || !session) {
      return res.status(400).json({ message: 'Term and session are required.' });
    }

    const template = await ResultTemplate.findOne({
      schoolId: req.user.schoolId,
      term,
      session,
      isActive: true
    }).populate('schoolId', 'name address');

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

// ─── Get all results for teacher's class ──────────────────────────────────────
export const getMyClassResults = async (req, res) => {
  try {
    const { term, session, status } = req.query;
    const teacherId = req.user._id;

    const teacher = await User.findById(teacherId).select('classTeacherFor');

    if (!teacher.classTeacherFor || teacher.classTeacherFor.length === 0) {
      return res.json({ results: [], message: 'You are not a class teacher for any class.' });
    }

    const query = {
      classId:  { $in: teacher.classTeacherFor },
      schoolId: req.user.schoolId,
      teacher:  teacherId
    };

    if (term)    query.term    = term;
    if (session) query.session = session;
    if (status)  query.status  = status;

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

// ─── Get single result by ID ──────────────────────────────────────────────────
export const getResultById = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id:      resultId,
      schoolId: req.user.schoolId
    })
    .populate('student', 'name regNo parentPhone parentName gender dob club passportBase64')
    .populate('classId', 'name fee')
    .populate('teacher', 'name');

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    if (result.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ result });
  } catch (err) {
    console.error('[GetResultById]', err);
    res.status(500).json({ message: 'Failed to fetch result.' });
  }
};

// ─── Create or update result ──────────────────────────────────────────────────
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
      filledTemplateImage,
      studentExtras,
      termBegins,
      termEnds,
      nextTermResumption,
      classSize,
      teacherName,
      principalName,
    } = req.body;

    const teacherId = req.user._id;

    // ── Verify student exists in this school ──────────────────────────────────
    const student = await Student.findOne({
      _id:      studentId,
      schoolId: req.user.schoolId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // ✅ FIX: Broaden access check.
    // Previously only classTeacherFor was checked — this locked out any teacher
    // who wasn't assigned as THE class teacher, even if they teach that class.
    // Now we allow:
    //   (a) teachers who are classTeacherFor this class, OR
    //   (b) teachers who have this class in their .classes array
    // This matches how schools actually work — subject teachers fill results too.
    const teacher = await User.findById(teacherId).select('classTeacherFor classes');

    const isClassTeacher = teacher.classTeacherFor?.some(
      id => id.toString() === student.classId.toString()
    );
    const teachesClass = teacher.classes?.some(
      id => id.toString() === student.classId.toString()
    );

    if (!isClassTeacher && !teachesClass) {
      return res.status(403).json({
        message: 'Access denied. You are not assigned to this student\'s class.',
        debug: {
          studentClass:    student.classId,
          classTeacherFor: teacher.classTeacherFor,
          classes:         teacher.classes,
        }
      });
    }

    // ── Validate and map subjects (include cross-term columns) ───────────────
    const validSubjects = (subjects || [])
      .filter(s => s && s.subject && s.subject.trim() !== '')
      .map(s => ({
        subject:        s.subject,
        ca:             Number(s.ca)   || 0,
        exam:           Number(s.exam) || 0,
        // Optional cross-term columns — save as-is if provided
        term1Total:     s.term1Total  != null && s.term1Total  !== '' ? Number(s.term1Total)  : undefined,
        term2Total:     s.term2Total  != null && s.term2Total  !== '' ? Number(s.term2Total)  : undefined,
        sessionAverage: s.sessionAverage != null && s.sessionAverage !== '' ? Number(s.sessionAverage) : undefined,
        classPosition:  s.classPosition  != null && s.classPosition  !== '' ? Number(s.classPosition)  : undefined,
        classAverage:   s.classAverage   != null && s.classAverage   !== '' ? Number(s.classAverage)   : undefined,
      }));
    if (validSubjects.length === 0) {
      return res.status(400).json({ message: 'At least one subject with a name is required.' });
    }

    let result;

    if (resultId) {
      // ── Update existing ───────────────────────────────────────────────────
      result = await Result.findOne({
        _id:      resultId,
        teacher:  teacherId,
        schoolId: req.user.schoolId
      });

      if (!result) {
        return res.status(404).json({ message: 'Result not found or access denied.' });
      }

      if (!['draft', 'rejected'].includes(result.status)) {
        return res.status(400).json({ message: `Cannot edit a result with status "${result.status}".` });
      }

      result.subjects             = validSubjects;
      result.affectiveTraits      = affectiveTraits;
      result.fees                 = fees;
      result.attendance           = attendance;
      result.comments             = comments;
      result.status               = status;
      result.filledTemplateImage  = filledTemplateImage;
      result.studentExtras        = studentExtras  || result.studentExtras;
      result.termBegins           = termBegins     || result.termBegins;
      result.termEnds             = termEnds       || result.termEnds;
      result.nextTermResumption   = nextTermResumption || result.nextTermResumption;
      result.classSize            = classSize      != null ? Number(classSize) : result.classSize;
      if (teacherName   !== undefined) result.teacherName   = teacherName;
      if (principalName !== undefined) result.principalName = principalName;

      if (status === 'submitted') result.submittedAt = new Date();

    } else {
      // ── Create new ────────────────────────────────────────────────────────
      result = new Result({
        student:              studentId,
        classId:              student.classId,
        schoolId:             req.user.schoolId,
        teacher:              teacherId,
        term,
        session,
        subjects:             validSubjects,
        affectiveTraits,
        fees,
        attendance,
        comments,
        status,
        filledTemplateImage,
        // ✅ Save extra fields
        studentExtras:        studentExtras  || {},
        termBegins:           termBegins     || null,
        termEnds:             termEnds       || null,
        nextTermResumption:   nextTermResumption || null,
        classSize:            classSize      != null ? Number(classSize) : null,
        teacherName:          teacherName    || '',
        principalName:        principalName  || '',
        submittedAt:          status === 'submitted' ? new Date() : null,
      });
    }

    await result.save();

    // Recalculate class positions after every save so overallPosition is current
    try {
      await Result.calculateClassPositions(result.classId, result.term, result.session, req.user.schoolId);
    } catch (posErr) {
      console.warn('[SaveResult] Position recalc failed (non-fatal):', posErr.message);
    }

    // Re-fetch after position recalc so overallPosition is current
    const populated = await Result.findById(result._id)
      .populate('student', 'name regNo gender dob club passportBase64')
      .populate('classId', 'name');

    res.json({
      message: status === 'submitted'
        ? 'Result submitted to admin for review.'
        : 'Result saved as draft.',
      result: populated
    });

  } catch (err) {
    console.error('[SaveResult]', err);
    // Surface Mongoose validation errors clearly
    if (err.name === 'ValidationError') {
      const fields = Object.keys(err.errors).join(', ');
      return res.status(400).json({
        message: `Validation failed on: ${fields}`,
        details: Object.fromEntries(
          Object.entries(err.errors).map(([k, v]) => [k, v.message])
        )
      });
    }
    res.status(500).json({ message: 'Failed to save result.', error: err.message });
  }
};

// ─── Submit single result to admin ───────────────────────────────────────────
export const submitResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id:      resultId,
      teacher:  req.user._id,
      schoolId: req.user.schoolId
    });

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    if (!['draft', 'rejected'].includes(result.status)) {
      return res.status(400).json({ message: 'Only draft or rejected results can be submitted.' });
    }

    result.status      = 'submitted';
    result.submittedAt = new Date();
    await result.save();

    res.json({ message: 'Result submitted to admin for review.' });
  } catch (err) {
    console.error('[SubmitResult]', err);
    res.status(500).json({ message: 'Failed to submit result.' });
  }
};

// ─── Submit multiple results ──────────────────────────────────────────────────
export const submitMultipleResults = async (req, res) => {
  try {
    const { resultIds } = req.body;

    if (!Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({ message: 'Result IDs array is required.' });
    }

    const results = await Result.updateMany(
      {
        _id:      { $in: resultIds },
        teacher:  req.user._id,
        schoolId: req.user.schoolId,
        status:   { $in: ['draft', 'rejected'] }
      },
      { $set: { status: 'submitted', submittedAt: new Date() } }
    );

    res.json({
      message: `${results.modifiedCount} result(s) submitted to admin for review.`,
      count:   results.modifiedCount
    });
  } catch (err) {
    console.error('[SubmitMultipleResults]', err);
    res.status(500).json({ message: 'Failed to submit results.' });
  }
};

// ─── Delete result (drafts only) ──────────────────────────────────────────────
export const deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id:      resultId,
      teacher:  req.user._id,
      schoolId: req.user.schoolId
    });

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    if (result.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft results can be deleted.' });
    }

    await Result.findByIdAndDelete(resultId);

    res.json({ message: 'Result deleted successfully.' });
  } catch (err) {
    console.error('[DeleteResult]', err);
    res.status(500).json({ message: 'Failed to delete result.' });
  }
};