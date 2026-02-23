// server/controllers/adminController.js

import bcrypt from 'bcrypt';
import User from '../models/User.js';
import School from '../models/School.js';
import Result from '../models/Result.js';
import Class from '../models/Class.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import XLSX from 'xlsx';
import SMSService from '../services/smsService.js';

// ─── Students ─────────────────────────────────────────────────────────────────

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find({ schoolId: req.user.schoolId })
      .populate('classId', 'name')
      .sort({ classId: 1, name: 1 });
    res.json({ students });
  } catch (err) {
    console.error('[AdminGetStudents]', err);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
};

export const uploadStudentsByClass = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const { classId } = req.body;
    const schoolId = req.user.schoolId;
    if (!classId) return res.status(400).json({ message: 'Class ID is required.' });

    const cls = await Class.findOne({ _id: classId, schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) return res.status(400).json({ message: 'Excel file is empty.' });

    const studentsToInsert = [];
    const skipped = [];

    for (const row of rows) {
      const name        = row.name || row.Name || row.NAME;
      const regNo       = row.regNo || row.RegNo || row['Reg No'] || row['Registration Number'];
      const parentPhone = row.parentPhone || row['Parent Phone'] || row.phone || '';
      const parentName  = row.parentName  || row['Parent Name']  || '';
      const parentEmail = row.parentEmail || row['Parent Email'] || '';

      if (!name?.trim()) {
        skipped.push({ name: name || 'N/A', regNo: regNo || 'N/A', reason: 'Name is required' });
        continue;
      }

      let finalRegNo = regNo?.trim() || '';
      if (!finalRegNo) finalRegNo = `${cls.name.substring(0, 3).toUpperCase()}-${Date.now()}-${studentsToInsert.length}`;

      if (await Student.findOne({ regNo: finalRegNo, schoolId })) {
        skipped.push({ name, regNo: finalRegNo, reason: 'Registration number already exists' });
        continue;
      }
      if (studentsToInsert.find(s => s.regNo === finalRegNo)) {
        skipped.push({ name, regNo: finalRegNo, reason: 'Duplicate in file' });
        continue;
      }

      studentsToInsert.push({
        name: name.trim(), regNo: finalRegNo, classId: cls._id, schoolId,
        parentPhone: parentPhone.toString().trim(),
        parentName:  parentName.toString().trim(),
        parentEmail: parentEmail.toString().trim(),
      });
    }

    if (studentsToInsert.length === 0)
      return res.status(400).json({ message: 'No valid students found.', skipped });

    const inserted = await Student.insertMany(studentsToInsert);
    await Class.findByIdAndUpdate(cls._id, { $addToSet: { students: { $each: inserted.map(s => s._id) } } });

    res.status(201).json({
      message: `Successfully uploaded ${inserted.length} student(s) to ${cls.name}`,
      insertedCount: inserted.length,
      skipped,
    });
  } catch (err) {
    console.error('[UploadStudentsByClass]', err);
    res.status(500).json({ message: 'Failed to upload students.', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { name, regNo, classId, parentPhone, parentName, parentEmail } = req.body;
    if (!name || !regNo || !classId)
      return res.status(400).json({ message: 'Name, registration number, and class are required.' });

    if (await Student.findOne({ regNo, schoolId: req.user.schoolId }))
      return res.status(400).json({ message: 'Registration number already exists.' });

    if (!await Class.findOne({ _id: classId, schoolId: req.user.schoolId }))
      return res.status(404).json({ message: 'Class not found.' });

    const student = await new Student({
      name, regNo, classId, schoolId: req.user.schoolId,
      parentPhone: parentPhone || '', parentName: parentName || '', parentEmail: parentEmail || '',
    }).save();

    await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
    const populated = await Student.findById(student._id).populate('classId', 'name');
    res.status(201).json({ message: 'Student created successfully.', student: populated });
  } catch (err) {
    console.error('[AdminCreateStudent]', err);
    res.status(500).json({ message: 'Failed to create student.' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, regNo, classId, parentPhone, parentName, parentEmail } = req.body;

    const student = await Student.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    if (regNo && regNo !== student.regNo) {
      if (await Student.findOne({ regNo, schoolId: req.user.schoolId, _id: { $ne: id } }))
        return res.status(400).json({ message: 'Registration number already exists.' });
    }

    if (classId && classId !== student.classId.toString()) {
      if (!await Class.findOne({ _id: classId, schoolId: req.user.schoolId }))
        return res.status(404).json({ message: 'Class not found.' });
      await Class.findByIdAndUpdate(student.classId, { $pull: { students: student._id } });
      await Class.findByIdAndUpdate(classId,          { $push: { students: student._id } });
    }

    student.name        = name        || student.name;
    student.regNo       = regNo       || student.regNo;
    student.classId     = classId     || student.classId;
    student.parentPhone = parentPhone !== undefined ? parentPhone : student.parentPhone;
    student.parentName  = parentName  !== undefined ? parentName  : student.parentName;
    student.parentEmail = parentEmail !== undefined ? parentEmail : student.parentEmail;
    await student.save();

    const updated = await Student.findById(id).populate('classId', 'name');
    res.json({ message: 'Student updated successfully.', student: updated });
  } catch (err) {
    console.error('[AdminUpdateStudent]', err);
    res.status(500).json({ message: 'Failed to update student.' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    await Class.findByIdAndUpdate(student.classId, { $pull: { students: student._id } });
    await Student.findByIdAndDelete(id);
    res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    console.error('[AdminDeleteStudent]', err);
    res.status(500).json({ message: 'Failed to delete student.' });
  }
};

// ─── Teachers ─────────────────────────────────────────────────────────────────

export const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', schoolId: req.user.schoolId })
      .populate('classes', 'name').populate('classTeacherFor', 'name')
      .select('-passwordHash').sort({ createdAt: -1 });
    res.json({ teachers });
  } catch (err) {
    console.error('[AdminGetTeachers]', err);
    res.status(500).json({ message: 'Failed to fetch teachers.' });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { classes, courses, classTeacherFor } = req.body;
    const teacher = await User.findOneAndUpdate(
      { _id: id, schoolId: req.user.schoolId, role: 'teacher' },
      { classes: classes || [], courses: courses || [], classTeacherFor: classTeacherFor || [] },
      { new: true }
    ).populate('classes', 'name').populate('classTeacherFor', 'name').select('-passwordHash');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    res.json({ message: 'Teacher updated successfully.', teacher });
  } catch (err) {
    console.error('[AdminUpdateTeacher]', err);
    res.status(500).json({ message: 'Failed to update teacher.' });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await User.findOneAndDelete({ _id: id, schoolId: req.user.schoolId, role: 'teacher' });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    res.json({ message: 'Teacher deleted successfully.' });
  } catch (err) {
    console.error('[AdminDeleteTeacher]', err);
    res.status(500).json({ message: 'Failed to delete teacher.' });
  }
};

// ─── Courses ──────────────────────────────────────────────────────────────────

export const getClassCourses = async (req, res) => {
  try {
    const courses = await Course.find({ classes: req.params.id, schoolId: req.user.schoolId })
      .populate('teacher', 'name email');
    res.json({ courses });
  } catch (err) {
    console.error('[GetClassCourses]', err);
    res.status(500).json({ message: 'Failed to fetch courses for class.' });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ schoolId: req.user.schoolId })
      .populate('teacher', 'name email').populate('classes', 'name').sort({ createdAt: -1 });
    res.json({ courses });
  } catch (err) {
    console.error('[AdminGetCourses]', err);
    res.status(500).json({ message: 'Failed to fetch courses.' });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { name, teacher, classes } = req.body;
    if (!name) return res.status(400).json({ message: 'Course name is required.' });

    const course = await new Course({
      name, teacher: teacher === '' ? null : teacher,
      classes: classes || [], schoolId: req.user.schoolId,
    }).save();

    if (teacher && teacher !== '')
      await User.findByIdAndUpdate(teacher, { $addToSet: { courses: name } }, { new: true });

    const populated = await Course.findById(course._id)
      .populate('teacher', 'name email').populate('classes', 'name');
    res.status(201).json({ message: 'Course created successfully', course: populated });
  } catch (err) {
    console.error('[CreateCourse]', err);
    res.status(500).json({ message: 'Failed to create course.', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { name, teacher, classes } = req.body;
    const updateData = {};
    if (name     !== undefined) updateData.name    = name;
    if (teacher  !== undefined) updateData.teacher = teacher === '' ? null : teacher;
    if (classes  !== undefined) updateData.classes = classes;

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      updateData, { new: true, runValidators: true }
    ).populate('teacher', 'name email').populate('classes', 'name');

    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (updateData.teacher) {
      await User.findByIdAndUpdate(updateData.teacher, { $addToSet: { courses: course.name } }, { new: true });
      await User.updateMany(
        { _id: { $ne: updateData.teacher }, schoolId: req.user.schoolId, courses: course.name },
        { $pull: { courses: course.name } }
      );
    } else if (updateData.teacher === null) {
      await User.updateMany({ schoolId: req.user.schoolId, courses: course.name }, { $pull: { courses: course.name } });
    }

    res.json({ message: 'Course updated successfully', course });
  } catch (err) {
    console.error('[UpdateCourse]', err);
    res.status(500).json({ message: 'Failed to update course.', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    await User.updateMany({ schoolId: req.user.schoolId, courses: course.name }, { $pull: { courses: course.name } });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('[DeleteCourse]', err);
    res.status(500).json({ message: 'Failed to delete course.' });
  }
};

// ─── Classes ──────────────────────────────────────────────────────────────────

export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ schoolId: req.user.schoolId }).sort({ createdAt: -1 });
    res.json({ classes });
  } catch (err) {
    console.error('[AdminGetClasses]', err);
    res.status(500).json({ message: 'Failed to fetch classes.' });
  }
};

export const createClass = async (req, res) => {
  try {
    const { name, fee, classTeacherFor } = req.body;
    if (!name) return res.status(400).json({ message: 'Class name is required.' });

    const newClass = await new Class({
      name, fee: (fee != null && !isNaN(fee) && fee >= 0) ? fee : 0,
      schoolId: req.user.schoolId,
    }).save();

    if (classTeacherFor?.length) {
      await User.updateMany(
        { _id: { $in: classTeacherFor }, schoolId: req.user.schoolId, role: 'teacher' },
        { $addToSet: { classTeacherFor: newClass._id } }
      );
    }
    res.status(201).json({ message: 'Class created successfully.', class: newClass });
  } catch (err) {
    console.error('[CreateClass]', err);
    res.status(500).json({ message: 'Failed to create class.' });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fee, classTeacherFor } = req.body;
    const schoolId = req.user.schoolId;

    const cls = await Class.findOne({ _id: id, schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });

    if (name !== undefined) cls.name = name;
    if (fee  !== undefined) cls.fee  = fee;
    await cls.save();

    if (classTeacherFor !== undefined) {
      const teacherIds = Array.isArray(classTeacherFor) ? classTeacherFor : [];
      await User.updateMany({ schoolId, role: 'teacher', classTeacherFor: id }, { $pull: { classTeacherFor: id } });
      if (teacherIds.length)
        await User.updateMany({ _id: { $in: teacherIds }, schoolId, role: 'teacher' }, { $addToSet: { classTeacherFor: id } });
    }

    res.json({ message: 'Class updated successfully.', class: cls });
  } catch (err) {
    console.error('[UpdateClass]', err);
    res.status(500).json({ message: 'Failed to update class.' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.schoolId;

    const cls = await Class.findOne({ _id: id, schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });

    const studentsInClass = await Student.countDocuments({ classId: id, schoolId });
    if (studentsInClass > 0)
      return res.status(400).json({ message: `Cannot delete "${cls.name}" — it has ${studentsInClass} student(s).`, studentCount: studentsInClass });

    const coursesInClass = await Course.countDocuments({ classes: id, schoolId });
    if (coursesInClass > 0)
      return res.status(400).json({ message: `Cannot delete "${cls.name}" — it has ${coursesInClass} course(s) assigned.`, courseCount: coursesInClass });

    const resultsInClass = await Result.countDocuments({ classId: id, schoolId });
    if (resultsInClass > 0)
      return res.status(400).json({ message: `Cannot delete "${cls.name}" — it has ${resultsInClass} result(s) stored.`, resultCount: resultsInClass });

    await User.updateMany({ schoolId, $or: [{ classes: id }, { classTeacherFor: id }] }, { $pull: { classes: id, classTeacherFor: id } });
    await Class.findByIdAndDelete(id);
    res.json({ message: `Class "${cls.name}" deleted successfully.` });
  } catch (err) {
    console.error('[DeleteClass]', err);
    res.status(500).json({ message: 'Failed to delete class.' });
  }
};

// ─── Results (admin.js duplicate — kept for backward compat) ──────────────────

export const getSubmittedResults = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const results = await Result.find({ status: 'submitted' })
      .populate({ path: 'student', match: { schoolId }, populate: { path: 'classId', select: 'name' } })
      .populate('teacher', 'name');
    res.json({ results: results.filter(r => r.student) });
  } catch (err) {
    console.error('[AdminGetResults]', err);
    res.status(500).json({ message: 'Failed to fetch results.' });
  }
};

export const reviewResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { action, comments, rejectionReason } = req.body;

    const result = await Result.findById(resultId).populate('student').populate('classId', 'name');
    if (!result) return res.status(404).json({ message: 'Result not found.' });

    if (String(result.student.schoolId) !== String(req.user.schoolId))
      return res.status(403).json({ message: 'Not authorized for this school.' });

    if (action === 'approve' || action === 'verify') {
      result.status     = 'verified';
      result.approvedAt = new Date();
      result.approvedBy = req.user._id;
      if (comments) result.comments = { teacher: comments.teacher || result.comments?.teacher || '', principal: comments.principal || result.comments?.principal || '' };
      await result.save();
      return res.json({ message: 'Result approved and verified successfully.', result });
    }

    if (action === 'reject') {
      result.status          = 'rejected';
      result.rejectionReason = rejectionReason || 'No reason provided';
      result.rejectedAt      = new Date();
      result.rejectedBy      = req.user._id;
      await result.save();
      return res.json({ message: 'Result rejected and sent back to teacher.', result });
    }

    return res.status(400).json({ message: 'Invalid action. Use "approve", "verify", or "reject".' });
  } catch (err) {
    console.error('[ReviewResult Error]', err);
    res.status(500).json({ message: 'Failed to review result.' });
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getAdminDashboard = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;

    const [totalStudents, totalTeachers, totalClasses, pendingResults, approvedResults, rejectedResults] =
      await Promise.all([
        Student.countDocuments({ schoolId }),
        User.countDocuments({ schoolId, role: 'teacher' }),
        Class.countDocuments({ schoolId }),
        Result.countDocuments({ schoolId, status: 'submitted' }),
        Result.countDocuments({ schoolId, status: 'approved' }),
        Result.countDocuments({ schoolId, status: 'rejected' }),
      ]);

    const recentActivity = await Result.find({ schoolId })
      .sort({ updatedAt: -1 }).limit(5)
      .populate('student', 'name regNo').populate('teacher', 'name');

    const today = new Date();
    const resultsTrend = [];
    const monthLabels  = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd   = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await Result.countDocuments({
        schoolId, submittedAt: { $gte: monthStart, $lte: monthEnd },
        status: { $in: ['submitted', 'approved', 'rejected', 'verified', 'sent'] },
      });
      resultsTrend.push(count);
      monthLabels.push(monthStart.toLocaleString('default', { month: 'short' }));
    }

    res.json({ totalStudents, totalTeachers, totalClasses, pendingResults, approvedResults, rejectedResults, resultsTrend, monthLabels, recentActivity });
  } catch (err) {
    console.error('[AdminDashboard]', err);
    res.status(500).json({ message: 'Failed to fetch dashboard data.', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

// ─── School Code ──────────────────────────────────────────────────────────────

export const getSchoolCode = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found.' });
    res.json({ schoolCode: school.schoolCode });
  } catch (err) {
    console.error('[GetSchoolCode]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Settings ─────────────────────────────────────────────────────────────────

// ✅ FIXED: select now includes all branding fields used by result sheets
export const getAdminSettings = async (req, res) => {
  try {
    const adminId  = req.user._id;
    const schoolId = req.user.schoolId;

    if (!adminId || !schoolId)
      return res.status(400).json({ message: 'Invalid user data' });

    const admin = await User.findById(adminId).select('-passwordHash');
    if (!admin) return res.status(404).json({ message: 'Admin user not found.' });

    // ✅ FIX 1: include logoBase64, email, principalName in the select
    const school = await School.findById(schoolId).select(
      'name address phone email motto logoBase64 principalName schoolCode classes subjects gradingSystem termStart termEnd'
    );
    if (!school) return res.status(404).json({ message: 'School not found.' });

    res.json({
      admin: {
        name:  admin.name,
        email: admin.email,
      },
      school: {
        name:          school.name,
        address:       school.address       || '',
        phone:         school.phone         || '',
        email:         school.email         || '',
        motto:         school.motto         || '',
        logoBase64:    school.logoBase64    || '',
        principalName: school.principalName || '',
        schoolCode:    school.schoolCode,
        classes:       school.classes,
        subjects:      school.subjects,
        gradingSystem: school.gradingSystem,
        termStart:     school.termStart ? new Date(school.termStart).toISOString().split('T')[0] : '',
        termEnd:       school.termEnd   ? new Date(school.termEnd).toISOString().split('T')[0]   : '',
      },
    });
  } catch (err) {
    console.error('[GetAdminSettings]', err);
    res.status(500).json({ message: 'Failed to load settings.', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

// ✅ FIXED: added 'branding' case + profile now saves address too
export const updateAdminSettings = async (req, res) => {
  try {
    const { section, data } = req.body;
    const adminId  = req.user._id;
    const schoolId = req.user.schoolId;

    if (!section || !data)
      return res.status(400).json({ message: 'Missing section or data in request body.' });

    switch (section) {

      // ── Profile ──────────────────────────────────────────────────────────────
      case 'profile': {
        const { schoolName, phone, address, motto } = data;
        await School.findByIdAndUpdate(schoolId, {
          ...(schoolName && { name:    schoolName }),
          ...(phone     && { phone }),
          ...(address   && { address }),
          ...(motto     !== undefined && { motto }),
        }, { new: true });
        return res.json({ message: 'School profile updated successfully.' });
      }

      // ── Branding (logo + identity fields used on result sheets) ──────────────
      // ✅ FIX 2: new case — was missing entirely
      case 'branding': {
        const { logoBase64, address, motto, principalName, email, phone } = data;
        await School.findByIdAndUpdate(schoolId, {
          ...(logoBase64    !== undefined && { logoBase64 }),
          ...(address       !== undefined && { address }),
          ...(motto         !== undefined && { motto }),
          ...(principalName !== undefined && { principalName }),
          ...(email         !== undefined && { email }),
          ...(phone         !== undefined && { phone }),
        }, { new: true });
        return res.json({ message: 'Branding updated successfully.' });
      }

      // ── Security ──────────────────────────────────────────────────────────────
      case 'security': {
        const { currentPassword, newPassword, confirmPassword } = data;
        if (!currentPassword || !newPassword || !confirmPassword)
          return res.status(400).json({ message: 'All password fields are required.' });
        if (newPassword !== confirmPassword)
          return res.status(400).json({ message: 'New passwords do not match.' });
        if (newPassword.length < 6)
          return res.status(400).json({ message: 'New password must be at least 6 characters.' });

        const admin = await User.findById(adminId);
        if (!admin) return res.status(404).json({ message: 'Admin user not found.' });

        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });

        const hashedPassword = await User.hashPassword(newPassword);
        await User.findByIdAndUpdate(adminId, { passwordHash: hashedPassword });
        return res.json({ message: 'Password updated successfully.' });
      }

      // ── Academic ──────────────────────────────────────────────────────────────
      case 'academic': {
        const { gradingSystem, termStart, termEnd } = data;
        await School.findByIdAndUpdate(schoolId, {
          gradingSystem,
          termStart: termStart ? new Date(termStart) : null,
          termEnd:   termEnd   ? new Date(termEnd)   : null,
        }, { new: true });
        return res.json({ message: 'Academic settings updated successfully.' });
      }

      default:
        return res.status(400).json({ message: `Invalid settings section: "${section}".` });
    }
  } catch (err) {
    console.error('[UpdateAdminSettings]', err);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
};

// ─── Shared Branding Endpoint ─────────────────────────────────────────────────
// GET /api/school/branding  (or any teacher-accessible route)
// Returns only the branding fields needed to render result sheets.
// Safe for any authenticated role — admin, teacher, parent.
// Called by VisualResultEntry and VisualTemplateBuilder on the frontend.
export const getSchoolBranding = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId)
      return res.status(400).json({ message: 'No school associated with this account.' });

    const school = await School.findById(schoolId)
      .select('name address phone email motto logoBase64 principalName');
    if (!school)
      return res.status(404).json({ message: 'School not found.' });

    res.json({
      school: {
        name:          school.name          || '',
        address:       school.address       || '',
        phone:         school.phone         || '',
        email:         school.email         || '',
        motto:         school.motto         || '',
        logoBase64:    school.logoBase64    || '',
        principalName: school.principalName || '',
      },
    });
  } catch (err) {
    console.error('[GetSchoolBranding]', err);
    res.status(500).json({ message: 'Failed to load school branding.' });
  }
};