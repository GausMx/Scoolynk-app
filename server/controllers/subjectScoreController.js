// server/controllers/subjectScoreController.js
// Handles subject teacher score entry via the SubjectScore collection.
// Subject teachers can only read/write scores for:
//   - their own assigned subject(s)  (User.courses)
//   - classes they are assigned to   (User.classes)

import SubjectScore from '../models/SubjectScore.js';
import School      from '../models/School.js';
import Student      from '../models/Student.js';
import User         from '../models/User.js';
import Class        from '../models/Class.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Verify teacher is assigned to both the subject and the class
const verifySubjectTeacherAccess = async (teacherId, classId, subject, schoolId) => {
  const teacher = await User.findById(teacherId).select('classes courses classTeacherFor');

  const teachesClass = teacher.classes?.some(id => id.toString() === classId.toString())
    || teacher.classTeacherFor?.some(id => id.toString() === classId.toString());

  const teachesSubject = teacher.courses?.some(
    c => c.toLowerCase().trim() === subject.toLowerCase().trim()
  );

  return { teacher, teachesClass, teachesSubject, ok: teachesClass && teachesSubject };
};

// ─── GET /api/teacher/subject-scores ──────────────────────────────────────────
// Returns all students in classId + their existing score for subject (if any).
// term/session resolved from school's active settings — teachers don't select these.
export const getSubjectScores = async (req, res) => {
  try {
    const { classId, subject } = req.query;
    const teacherId = req.user._id;
    const schoolId  = req.user.schoolId;

    if (!classId || !subject)
      return res.status(400).json({ message: 'classId and subject are required.' });

    // Resolve active term/session — admin sets this once, all teachers use it
    const school  = await School.findById(schoolId).select('currentTerm currentSession');
    const term    = school?.currentTerm    || 'First Term';
    const session = school?.currentSession || '';
    if (!session)
      return res.status(400).json({ message: 'No active session set. Ask your admin to configure the current term and session in Settings.' });

    // Access check
    const { teachesClass, teachesSubject } = await verifySubjectTeacherAccess(teacherId, classId, subject, schoolId);
    if (!teachesClass)
      return res.status(403).json({ message: 'You are not assigned to teach this class.' });
    if (!teachesSubject)
      return res.status(403).json({ message: `You are not assigned to teach "${subject}".` });

    // Fetch students in class
    const students = await Student.find({ classId, schoolId })
      .select('name regNo admNo')
      .sort({ name: 1 });

    // Fetch existing scores for this subject/term/session
    const existingScores = await SubjectScore.find({
      classId, subject, term, session, schoolId,
    });

    // Map scores by studentId for O(1) lookup
    const scoreMap = {};
    existingScores.forEach(s => { scoreMap[s.student.toString()] = s; });

    // Merge students with scores
    // Determine if a SubjectScore document was actually filled by the teacher.
    // Old documents may have ca:0, exam:0 from Mongoose's previous default:0.
    // A document is "entered" only if:
    //   - ca or exam is not null AND not zero (clear numeric entry), OR
    //   - ca or exam is null (new schema, null = unset → never entered), OR
    //   - total > 0 (at least one field has a real score), OR
    //   - createdAt !== updatedAt (doc was explicitly modified after creation)
    // In all other cases, treat the field as '' (not yet entered).
    const wasEntered = (score) => {
      if (!score) return false;
      if (score.ca  == null && score.exam == null) return false; // new schema, never set
      if (score.total > 0) return true;                          // has real scores
      // Check if doc was ever updated (teacher intentionally saved zeros)
      const created = score.createdAt?.getTime?.() ?? 0;
      const updated = score.updatedAt?.getTime?.() ?? 0;
      return updated > created; // was explicitly re-saved after creation
    };

    const rows = students.map(student => {
      const score   = scoreMap[student._id.toString()];
      const entered = wasEntered(score);
      return {
        studentId:  student._id,
        name:       student.name,
        regNo:      student.regNo,
        admNo:      student.admNo || '',
        // Only return actual values when the score was genuinely entered
        ca:         entered && score.ca   != null ? score.ca   : '',
        exam:       entered && score.exam != null ? score.exam : '',
        total:      entered ? (score?.total ?? '') : '',
        grade:      entered ? (score?.grade ?? '') : '',
        scoreId:    score?._id   || null,
        savedAt:    entered ? (score?.updatedAt || null) : null,
      };
    });

    res.json({ rows, classId, subject, term, session });
  } catch (err) {
    console.error('[GetSubjectScores]', err);
    res.status(500).json({ message: 'Failed to fetch subject scores.', error: err.message });
  }
};

// ─── POST /api/teacher/subject-scores ─────────────────────────────────────────
// Bulk upsert scores for a subject in a class.
// Body: { classId, subject, term, session, caMax, examMax, scores: [{ studentId, ca, exam }] }
// caMax/examMax default to 40/60 if not supplied. Schools on 30:70 pass caMax=30, examMax=70.
export const saveSubjectScores = async (req, res) => {
  try {
    const { classId, subject, scores, caMax: rawCaMax, examMax: rawExamMax } = req.body;
    const caMax   = Number(rawCaMax)   || 40;
    const examMax = Number(rawExamMax) || 60;
    const teacherId = req.user._id;
    const schoolId  = req.user.schoolId;

    if (!classId || !subject || !Array.isArray(scores))
      return res.status(400).json({ message: 'classId, subject, and scores[] are required.' });

    // Resolve active term/session from school — single source of truth
    const school  = await School.findById(schoolId).select('currentTerm currentSession');
    const term    = school?.currentTerm    || 'First Term';
    const session = school?.currentSession || '';
    if (!session)
      return res.status(400).json({ message: 'No active session set. Ask your admin to configure the current term and session in Settings.' });

    if (scores.length === 0)
      return res.status(400).json({ message: 'scores array is empty.' });

    // Access check
    const { teachesClass, teachesSubject } = await verifySubjectTeacherAccess(teacherId, classId, subject, schoolId);
    if (!teachesClass)
      return res.status(403).json({ message: 'You are not assigned to teach this class.' });
    if (!teachesSubject)
      return res.status(403).json({ message: `You are not assigned to teach "${subject}".` });

    // Verify all studentIds belong to this class & school
    const studentIds = scores.map(s => s.studentId);
    const validStudents = await Student.find({ _id: { $in: studentIds }, classId, schoolId }).select('_id');
    const validIds = new Set(validStudents.map(s => s._id.toString()));

    const invalid = studentIds.filter(id => !validIds.has(id.toString()));
    if (invalid.length > 0)
      return res.status(400).json({ message: `${invalid.length} student ID(s) do not belong to this class.` });

    // Grade helper — mirrors SubjectScore pre-save (bulkWrite bypasses hooks)
    const calcGrade = (total) => {
      if (total >= 95) return { grade: 'A+', remark: 'Exceptional' };
      if (total >= 90) return { grade: 'A',  remark: 'Distinction' };
      if (total >= 85) return { grade: 'A-', remark: 'Excellent' };
      if (total >= 80) return { grade: 'B+', remark: 'Very Good' };
      if (total >= 75) return { grade: 'B',  remark: 'Very Good' };
      if (total >= 70) return { grade: 'B-', remark: 'Below Standard' };
      if (total >= 60) return { grade: 'C',  remark: 'Good' };
      if (total >= 40) return { grade: 'D',  remark: 'Average' };
      return             { grade: 'F',  remark: 'Fail' };
    };

    // Bulk upsert — one operation per student
    // Rules:
    //   - ca/exam '' or null => stored as null (not entered)
    //   - ca/exam 0 => stored as 0 (explicitly entered zero)
    //   - clamped to caMax/examMax from request
    //   - total/grade only calculated when both are non-null
    const ops = scores.map(({ studentId, ca, exam }) => {
      const caProvided   = ca   != null && ca   !== '';
      const examProvided = exam != null && exam !== '';

      const safeCA   = caProvided   ? Math.min(caMax,   Math.max(0, Number(ca)))   : null;
      const safeExam = examProvided ? Math.min(examMax, Math.max(0, Number(exam))) : null;

      // Only calculate total/grade when at least one is provided
      const total = (safeCA ?? 0) + (safeExam ?? 0);
      const { grade, remark } = calcGrade(total);

      // Build $set — only include ca/exam when provided
      const $set = {
        student: studentId,
        classId,
        schoolId,
        teacher: teacherId,
        term,
        session,
        subject,
        total: (safeCA !== null || safeExam !== null) ? total : null,
        grade: (safeCA !== null || safeExam !== null) ? grade : null,
        remark:(safeCA !== null || safeExam !== null) ? remark : null,
      };
      if (caProvided)   $set.ca   = safeCA;
      if (examProvided) $set.exam = safeExam;

      return {
        updateOne: {
          filter: { student: studentId, subject, term, session, schoolId },
          update: { $set },
          upsert: true,
        }
      };
    });

    await SubjectScore.bulkWrite(ops);

    // Return updated rows so the UI can refresh without a second request
    const saved = await SubjectScore.find({ classId, subject, term, session, schoolId });
    const scoreMap = {};
    saved.forEach(s => { scoreMap[s.student.toString()] = s; });

    res.json({
      message: `Scores saved for ${scores.length} student(s).`,
      saved:   scores.length,
      scoreMap,
    });
  } catch (err) {
    console.error('[SaveSubjectScores]', err);
    if (err.name === 'ValidationError') {
      const fields = Object.keys(err.errors).join(', ');
      return res.status(400).json({ message: `Validation failed: ${fields}`, details: err.errors });
    }
    res.status(500).json({ message: 'Failed to save subject scores.', error: err.message });
  }
};

// ─── GET /api/teacher/subject-scores/completion ───────────────────────────────
// Returns completion status per subject for all classes the class teacher owns.
// Used by MyClassWithResults to show "3/5 subjects have scores" per student.
// Query params: classId, term, session
export const getScoreCompletion = async (req, res) => {
  try {
    const { classId } = req.query;
    const schoolId = req.user.schoolId;

    if (!classId)
      return res.status(400).json({ message: 'classId is required.' });

    const school  = await School.findById(schoolId).select('currentTerm currentSession');
    const term    = school?.currentTerm    || 'First Term';
    const session = school?.currentSession || '';
    if (!session)
      return res.status(400).json({ message: 'No active session configured.' });

    // Count how many students are in the class
    const totalStudents = await Student.countDocuments({ classId, schoolId });

    // Aggregate: for each subject, how many students have scores entered
    const completion = await SubjectScore.aggregate([
      { $match: { classId: new (await import('mongoose')).default.Types.ObjectId(classId), term, session, schoolId: new (await import('mongoose')).default.Types.ObjectId(schoolId) } },
      { $group: {
          _id: '$subject',
          studentsScored: { $sum: 1 },
          teachers: { $addToSet: '$teacher' },
      }},
      { $project: {
          subject: '$_id',
          studentsScored: 1,
          totalStudents: { $literal: totalStudents },
          complete: { $eq: ['$studentsScored', totalStudents] },
          _id: 0,
      }},
      { $sort: { subject: 1 } },
    ]);

    res.json({ completion, totalStudents, classId, term, session });
  } catch (err) {
    console.error('[GetScoreCompletion]', err);
    res.status(500).json({ message: 'Failed to fetch completion status.', error: err.message });
  }
};

// ─── GET /api/teacher/subject-scores/my-subjects ─────────────────────────────
// Returns the list of subjects + classes this teacher is assigned to teach.
// Used to build the subject teacher's landing page.
export const getMySubjectsAndClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const schoolId  = req.user.schoolId;

    const teacher = await User.findById(teacherId).select('courses classes classTeacherFor');

    // Merge classes: both teaching and class-teacher-for
    const allClassIds = [
      ...(teacher.classes          || []),
      ...(teacher.classTeacherFor  || []),
    ];
    const uniqueClassIds = [...new Map(allClassIds.map(id => [id.toString(), id])).values()];

    const classes = await Class.find({ _id: { $in: uniqueClassIds }, schoolId }).select('name');

    res.json({
      subjects: teacher.courses || [],
      classes,
      isClassTeacher: (teacher.classTeacherFor?.length || 0) > 0,
    });
  } catch (err) {
    console.error('[GetMySubjectsAndClasses]', err);
    res.status(500).json({ message: 'Failed to fetch subjects and classes.', error: err.message });
  }
};

// ─── Used by resultController.saveResult ──────────────────────────────────────
// Exported so class teacher can pull all SubjectScores for a student
// and merge them into the Result subjects array.
export const getScoresForStudent = async (studentId, term, session, schoolId) => {
  const scores = await SubjectScore.find({ student: studentId, term, session, schoolId });
  return scores.map(s => ({
    subject: s.subject,
    ca:      s.ca,
    exam:    s.exam,
    total:   s.total,
    grade:   s.grade,
    remark:  s.remark,
  }));
};

// ─── GET /api/teacher/subject-scores/for-student ─────────────────────────────
// Called by VisualResultEntry (class teacher view) to pre-fill subject scores.
// Any teacher in the school can call this — class teacher needs to read all
// subject teachers' scores for their student.
// Query params: studentId, term, session
export const getScoresForStudentRoute = async (req, res) => {
  try {
    const { studentId } = req.query;
    const schoolId = req.user.schoolId;

    if (!studentId)
      return res.status(400).json({ message: 'studentId is required.' });

    const school  = await School.findById(schoolId).select('currentTerm currentSession');
    const term    = school?.currentTerm    || 'First Term';
    const session = school?.currentSession || '';

    const scores = await SubjectScore.find({ student: studentId, term, session, schoolId })
      .select('subject ca exam total grade remark teacher updatedAt');

    res.json({ scores });
  } catch (err) {
    console.error('[GetScoresForStudentRoute]', err);
    res.status(500).json({ message: 'Failed to fetch scores for student.', error: err.message });
  }
};