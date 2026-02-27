// server/controllers/teacherController.js

import User from '../models/User.js';
import Class from '../models/Class.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import Result from '../models/Result.js';

export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const schoolId  = req.user.schoolId;

    const teacher = await User.findById(teacherId)
      .populate('classes', 'name')
      .populate('classTeacherFor', 'name');

    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

    // ── School info including active term ─────────────────────────────────
    const school = await School.findById(schoolId)
      .select('name phone motto currentTerm currentSession');

    // ── Students in class-teacher classes ─────────────────────────────────
    let students = [];
    if (teacher.classTeacherFor?.length > 0) {
      students = await Student.find({
        classId:  { $in: teacher.classTeacherFor.map(c => c._id) },
        schoolId,
      });
    }

    // ── Result stats ──────────────────────────────────────────────────────
    const [pendingResults, submittedResults, verifiedResults] = await Promise.all([
      Result.countDocuments({ teacher: teacherId, schoolId, status: 'draft' }),
      Result.countDocuments({ teacher: teacherId, schoolId, status: 'submitted' }),
      Result.countDocuments({ teacher: teacherId, schoolId, status: 'approved' }),
    ]);

    res.json({
      teacher: {
        name:           teacher.name,
        email:          teacher.email,
        phone:          teacher.phone,
        classes:        teacher.classes,        // populated: [{ _id, name }]
        classTeacherFor: teacher.classTeacherFor, // populated: [{ _id, name }]
        courses:        teacher.courses || [],  // string array: ['Mathematics', 'English']
      },
      school: {
        name:           school?.name           || '',
        phone:          school?.phone          || '',
        motto:          school?.motto          || '',
        currentTerm:    school?.currentTerm    || null,
        currentSession: school?.currentSession || null,
      },
      students,
      stats: {
        totalStudents:   students.length,
        classesTeaching: teacher.classes?.length || 0,
        pendingResults,
        submittedResults,
        verifiedResults,
      },
    });
  } catch (err) {
    console.error('[GetTeacherDashboard]', err);
    res.status(500).json({ message: 'Failed to load dashboard.', error: err.message });
  }
};

// ── Get Classes and Courses (public — for registration) ───────────────────────
export const getClassesAndCourses = async (req, res) => {
  try {
    const { schoolCode } = req.query;
    if (!schoolCode) return res.status(400).json({ message: 'School code is required.' });

    const school = await School.findOne({ schoolCode });
    if (!school) return res.status(404).json({ message: 'School not found.' });

    const [classes, courses] = await Promise.all([
      Class.find({ schoolId: school._id }).select('_id name'),
      Course.find({ schoolId: school._id }).select('_id name'),
    ]);

    res.json({ classes, courses });
  } catch (err) {
    console.error('[GetClassesAndCourses]', err);
    res.status(500).json({ message: 'Failed to fetch classes and courses.' });
  }
};

// ── Get school's classes for authenticated teacher ────────────────────────────
export const getTeacherSchoolClasses = async (req, res) => {
  try {
    if (!req.user?.schoolId)
      return res.status(400).json({ message: 'School ID not found.' });

    const classes = await Class.find({ schoolId: req.user.schoolId }).select('_id name');
    res.json({ classes });
  } catch (err) {
    console.error('[GetTeacherSchoolClasses]', err);
    res.status(500).json({ message: 'Failed to fetch classes.' });
  }
};

// ── Save class teacher info ───────────────────────────────────────────────────
export const saveClassTeacherInfo = async (req, res) => {
  try {
    const { teacherId, classTeacherFor } = req.body;
    if (!teacherId || !classTeacherFor)
      return res.status(400).json({ message: 'Teacher ID and class info required.' });

    const validClasses = await Class.find({
      _id: { $in: classTeacherFor },
      schoolId: req.user.schoolId,
    });
    if (validClasses.length !== classTeacherFor.length)
      return res.status(400).json({ message: 'Invalid class IDs provided.' });

    const teacher = await User.findByIdAndUpdate(teacherId, { classTeacherFor }, { new: true });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

    res.json({ message: 'Class teacher info saved successfully.', teacher });
  } catch (err) {
    console.error('[SaveClassTeacherInfo]', err);
    res.status(500).json({ message: 'Failed to save class teacher info.' });
  }
};

// ── Bulk add students ─────────────────────────────────────────────────────────
export const bulkAddStudents = async (req, res) => {
  try {
    const { students, classId } = req.body;

    if (!Array.isArray(students) || students.length === 0)
      return res.status(400).json({ message: 'Students array is required.' });
    if (!classId)
      return res.status(400).json({ message: 'Class ID is required.' });

    const classExists = await Class.findOne({ _id: classId, schoolId: req.user.schoolId });
    if (!classExists) return res.status(404).json({ message: 'Class not found.' });

    const toInsert = [];
    const duplicates = [];
    const errors = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.name?.trim()) { errors.push(`Row ${i + 1}: Name is required`); continue; }

      const regNo = s.regNo?.trim() ||
        `${classExists.name.substring(0, 3).toUpperCase()}-${Date.now()}-${i}`;

      const existing = await Student.findOne({ regNo, schoolId: req.user.schoolId });
      if (existing || toInsert.find(x => x.regNo === regNo)) {
        duplicates.push({ name: s.name, regNo }); continue;
      }

      toInsert.push({
        name:        s.name.trim(),
        regNo,
        classId,
        schoolId:    req.user.schoolId,
        parentPhone: s.parentPhone?.trim() || '',
        parentName:  s.parentName?.trim()  || '',
        parentEmail: s.parentEmail?.trim() || '',
      });
    }

    if (errors.length)     return res.status(400).json({ message: 'Validation errors.', errors });
    if (duplicates.length) return res.status(400).json({ message: 'Duplicate reg numbers.', duplicates });
    if (!toInsert.length)  return res.status(400).json({ message: 'No valid students to add.' });

    const inserted = await Student.insertMany(toInsert);
    await Class.findByIdAndUpdate(classId, {
      $push: { students: { $each: inserted.map(s => s._id) } },
    });

    res.status(201).json({
      message: `${inserted.length} student(s) added successfully.`,
      students: inserted,
      stats: { total: students.length, added: inserted.length, duplicates: duplicates.length },
    });
  } catch (err) {
    console.error('[BulkAddStudents]', err);
    res.status(500).json({ message: 'Failed to add students.' });
  }
};

// ── Update teacher profile ────────────────────────────────────────────────────
export const updateTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { name, phone, classes, courses, classTeacherFor } = req.body;

    const update = {};
    if (name?.trim())          update.name           = name.trim();
    if (phone?.trim())         update.phone          = phone.trim();
    if (classes !== undefined) update.classes        = Array.isArray(classes) ? classes : [];
    if (courses !== undefined) update.courses        = Array.isArray(courses) ? courses : [];
    if (classTeacherFor !== undefined)
      update.classTeacherFor = Array.isArray(classTeacherFor) ? classTeacherFor : [];

    // Validate class IDs belong to this school
    for (const field of ['classes', 'classTeacherFor']) {
      if (update[field]?.length) {
        const valid = await Class.find({ _id: { $in: update[field] }, schoolId: req.user.schoolId });
        if (valid.length !== update[field].length)
          return res.status(400).json({ message: `Some ${field} IDs are invalid.` });
      }
    }

    const teacher = await User.findByIdAndUpdate(teacherId, update, { new: true, runValidators: true })
      .populate('classes', 'name')
      .populate('classTeacherFor', 'name');

    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

    res.json({
      message: 'Profile updated successfully.',
      teacher: {
        name:           teacher.name,
        email:          teacher.email,
        phone:          teacher.phone,
        classes:        teacher.classes,
        classTeacherFor: teacher.classTeacherFor,
        courses:        teacher.courses || [],
      },
    });
  } catch (err) {
    console.error('[UpdateTeacherProfile]', err);
    res.status(500).json({ message: 'Failed to update profile.', error: err.message });
  }
};

// ── Get students in teacher's class-teacher classes ───────────────────────────
export const getMyClassStudents = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id).select('classTeacherFor');

    if (!teacher?.classTeacherFor?.length)
      return res.json({ students: [], message: 'Not a class teacher for any class.' });

    const students = await Student.find({
      classId:  { $in: teacher.classTeacherFor },
      schoolId: req.user.schoolId,
    }).populate('classId', 'name').sort({ name: 1 });

    res.json({ students });
  } catch (err) {
    console.error('[GetMyClassStudents]', err);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
};

// ── Get students in a specific class ─────────────────────────────────────────
export const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const classExists = await Class.findOne({ _id: classId, schoolId: req.user.schoolId });
    if (!classExists) return res.status(404).json({ message: 'Class not found or access denied.' });

    const students = await Student.find({ classId, schoolId: req.user.schoolId })
      .populate('classId', 'name').sort({ name: 1 });

    res.json({ className: classExists.name, students });
  } catch (err) {
    console.error('[GetClassStudents]', err);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
};

// ── Get courses for a specific class ─────────────────────────────────────────
export const getClassCourses = async (req, res) => {
  try {
    const { classId } = req.params;
    const classExists = await Class.findOne({ _id: classId, schoolId: req.user.schoolId });
    if (!classExists) return res.status(404).json({ message: 'Class not found or access denied.' });

    const courses = await Course.find({ classes: classId, schoolId: req.user.schoolId })
      .populate('teacher', 'name email').sort({ name: 1 });

    res.json({ courses, className: classExists.name });
  } catch (err) {
    console.error('[GetClassCourses]', err);
    res.status(500).json({ message: 'Failed to fetch courses.' });
  }
};

// ── Update student ────────────────────────────────────────────────────────────
export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, regNo, parentPhone, parentName, parentEmail } = req.body;

    const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const teacher = await User.findById(req.user._id).select('classTeacherFor');
    const hasAccess = teacher.classTeacherFor?.some(
      id => id.toString() === student.classId.toString()
    );
    if (!hasAccess)
      return res.status(403).json({ message: 'Access denied. Not class teacher for this student.' });

    if (name)                    student.name        = name;
    if (regNo)                   student.regNo       = regNo;
    if (parentPhone !== undefined) student.parentPhone = parentPhone;
    if (parentName  !== undefined) student.parentName  = parentName;
    if (parentEmail !== undefined) student.parentEmail = parentEmail;

    await student.save();

    res.json({
      message: 'Student updated successfully.',
      student: await Student.findById(studentId).populate('classId', 'name'),
    });
  } catch (err) {
    console.error('[UpdateStudent]', err);
    res.status(500).json({ message: 'Failed to update student.' });
  }
};