// server/controllers/subjectScoreController.js
// Handles subject teacher score entry via the SubjectScore collection.
// Subject teachers can only read/write scores for:
//   - their own assigned subject(s)  (User.courses)
//   - classes they are assigned to   (User.classes)

import SubjectScore from '../models/SubjectScore.js';
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
// Query params: classId, subject, term, session
export const getSubjectScores = async (req, res) => {
  try {
    const { classId, subject, term, session } = req.query;
    const teacherId = req.user._id;
    const schoolId  = req.user.schoolId;

    if (!classId || !subject || !term || !session)
      return res.status(400).json({ message: 'classId, subject, term, and session are required.' });

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
    const rows = students.map(student => {
      const score = scoreMap[student._id.toString()];
      return {
        studentId:  student._id,
        name:       student.name,
        regNo:      student.regNo,
        admNo:      student.admNo || '',
        ca:         score?.ca    ?? '',
        exam:       score?.exam  ?? '',
        total:      score?.total ?? '',
        grade:      score?.grade ?? '',
        scoreId:    score?._id   || null,
        savedAt:    score?.updatedAt || null,
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
// Body: { classId, subject, term, session, scores: [{ studentId, ca, exam }] }
export const saveSubjectScores = async (req, res) => {
  try {
    const { classId, subject, term, session, scores } = req.body;
    const teacherId = req.user._id;
    const schoolId  = req.user.schoolId;

    if (!classId || !subject || !term || !session || !Array.isArray(scores))
      return res.status(400).json({ message: 'classId, subject, term, session, and scores[] are required.' });

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
    // bulkWrite bypasses Mongoose pre-save hooks, so we calculate
    // total, grade, remark here before writing.
    const ops = scores.map(({ studentId, ca, exam }) => {
      const safeCA   = Math.min(40, Math.max(0, Number(ca)   || 0));
      const safeExam = Math.min(60, Math.max(0, Number(exam) || 0));
      const total    = safeCA + safeExam;
      const { grade, remark } = calcGrade(total);
      return {
        updateOne: {
          filter: { student: studentId, subject, term, session, schoolId },
          update: {
            $set: {
              student: studentId,
              classId,
              schoolId,
              teacher: teacherId,
              term,
              session,
              subject,
              ca:     safeCA,
              exam:   safeExam,
              total,
              grade,
              remark,
            }
          },
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
    const { classId, term, session } = req.query;
    const schoolId = req.user.schoolId;

    if (!classId || !term || !session)
      return res.status(400).json({ message: 'classId, term, and session are required.' });

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
    const { studentId, term, session } = req.query;
    const schoolId = req.user.schoolId;

    if (!studentId || !term || !session)
      return res.status(400).json({ message: 'studentId, term, and session are required.' });

    const scores = await SubjectScore.find({ student: studentId, term, session, schoolId })
      .select('subject ca exam total grade remark teacher updatedAt');

    res.json({ scores });
  } catch (err) {
    console.error('[GetScoresForStudentRoute]', err);
    res.status(500).json({ message: 'Failed to fetch scores for student.', error: err.message });
  }
};