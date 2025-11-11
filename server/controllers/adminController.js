// server/controllers/adminController.js - COMPLETE CORRECTED FILE

import bcrypt from 'bcrypt';
import User from '../models/User.js';
import School from '../models/School.js';
import Result from '../models/Result.js';
import Class from '../models/Class.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import SMSService from '../services/smsService.js';

// -------------------------
// Get all students in admin's school
// -------------------------
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find({ schoolId: req.user.schoolId })
      .populate('classId', 'name fee')
      .sort({ classId: 1, name: 1 });

    res.json({ students });
  } catch (err) {
    console.error('[AdminGetStudents]', err);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
};

// -------------------------
// Create new student
// -------------------------
export const createStudent = async (req, res) => {
  try {
    const { name, regNo, classId, parentPhone, parentName, parentEmail, amountPaid } = req.body;

    if (!name || !regNo || !classId) {
      return res.status(400).json({ message: 'Name, registration number, and class are required.' });
    }

    // Check if regNo already exists
    const existingStudent = await Student.findOne({ regNo, schoolId: req.user.schoolId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Registration number already exists.' });
    }

    // Verify class exists and belongs to admin's school
    const classExists = await Class.findOne({ _id: classId, schoolId: req.user.schoolId });
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    const student = new Student({
      name,
      regNo,
      classId,
      schoolId: req.user.schoolId,
      parentPhone: parentPhone || '',
      parentName: parentName || '',
      parentEmail: parentEmail || '',
      amountPaid: amountPaid || 0
    });

    await student.save();

    // Add student to class
    await Class.findByIdAndUpdate(classId, {
      $push: { students: student._id }
    });

    const populatedStudent = await Student.findById(student._id).populate('classId', 'name fee');

    res.status(201).json({ 
      message: 'Student created successfully.', 
      student: populatedStudent 
    });
  } catch (err) {
    console.error('[AdminCreateStudent]', err);
    res.status(500).json({ message: 'Failed to create student.' });
  }
};

// -------------------------
// Update student
// -------------------------
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, regNo, classId, parentPhone, parentName, parentEmail, amountPaid } = req.body;

    // Find student
    const student = await Student.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Check if regNo is being changed and if it already exists
    if (regNo && regNo !== student.regNo) {
      const existingStudent = await Student.findOne({ 
        regNo, 
        schoolId: req.user.schoolId,
        _id: { $ne: id }
      });
      if (existingStudent) {
        return res.status(400).json({ message: 'Registration number already exists.' });
      }
    }

    // If class is being changed
    if (classId && classId !== student.classId.toString()) {
      const classExists = await Class.findOne({ _id: classId, schoolId: req.user.schoolId });
      if (!classExists) {
        return res.status(404).json({ message: 'Class not found.' });
      }

      // Remove from old class
      await Class.findByIdAndUpdate(student.classId, {
        $pull: { students: student._id }
      });

      // Add to new class
      await Class.findByIdAndUpdate(classId, {
        $push: { students: student._id }
      });
    }

    // Update student fields
    student.name = name || student.name;
    student.regNo = regNo || student.regNo;
    student.classId = classId || student.classId;
    student.parentPhone = parentPhone !== undefined ? parentPhone : student.parentPhone;
    student.parentName = parentName !== undefined ? parentName : student.parentName;
    student.parentEmail = parentEmail !== undefined ? parentEmail : student.parentEmail;
    student.amountPaid = amountPaid !== undefined ? amountPaid : student.amountPaid;
    
    await student.save();

    const updatedStudent = await Student.findById(id).populate('classId', 'name fee');

    res.json({ 
      message: 'Student updated successfully.', 
      student: updatedStudent 
    });
  } catch (err) {
    console.error('[AdminUpdateStudent]', err);
    res.status(500).json({ message: 'Failed to update student.' });
  }
};

// -------------------------
// Delete student
// -------------------------
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Remove student from class
    await Class.findByIdAndUpdate(student.classId, {
      $pull: { students: student._id }
    });

    // Delete student
    await Student.findByIdAndDelete(id);

    res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    console.error('[AdminDeleteStudent]', err);
    res.status(500).json({ message: 'Failed to delete student.' });
  }
};

// -------------------------
// Get all teachers in admin's school
// -------------------------
export const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ 
      role: 'teacher', 
      schoolId: req.user.schoolId 
    })
    .populate('classes', 'name')
    .populate('classTeacherFor', 'name')
    .select('-passwordHash')
    .sort({ createdAt: -1 });

    res.json({ teachers });
  } catch (err) {
    console.error('[AdminGetTeachers]', err);
    res.status(500).json({ message: 'Failed to fetch teachers.' });
  }
};

// -------------------------
// Update teacher information
// -------------------------
export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { classes, courses, classTeacherFor } = req.body;

    const teacher = await User.findOneAndUpdate(
      { _id: id, schoolId: req.user.schoolId, role: 'teacher' },
      { 
        classes: classes || [],
        courses: courses || [],
        classTeacherFor: classTeacherFor || []
      },
      { new: true }
    )
    .populate('classes', 'name')
    .populate('classTeacherFor', 'name')
    .select('-passwordHash');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    res.json({ message: 'Teacher updated successfully.', teacher });
  } catch (err) {
    console.error('[AdminUpdateTeacher]', err);
    res.status(500).json({ message: 'Failed to update teacher.' });
  }
};

// -------------------------
// Delete teacher
// -------------------------
export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await User.findOneAndDelete({ 
      _id: id, 
      schoolId: req.user.schoolId, 
      role: 'teacher' 
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    res.json({ message: 'Teacher deleted successfully.' });
  } catch (err) {
    console.error('[AdminDeleteTeacher]', err);
    res.status(500).json({ message: 'Failed to delete teacher.' });
  }
};

// -------------------------
// Get courses for a specific class
// -------------------------
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

// -------------------------
// Get all courses
// -------------------------
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ schoolId: req.user.schoolId })
      .populate('teacher', 'name email')
      .populate('classes', 'name')
      .sort({ createdAt: -1 });

    res.json({ courses });
  } catch (err) {
    console.error('[AdminGetCourses]', err);
    res.status(500).json({ message: 'Failed to fetch courses.' });
  }
};

// -------------------------
// Create course
// -------------------------
export const createCourse = async (req, res) => {
  try {
    const { name, teacher, classes } = req.body;
    const course = new Course({
      name,
      teacher,
      classes,
      schoolId: req.user.schoolId
    });
    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (err) {
    console.error('[CreateCourse]', err);
    res.status(500).json({ message: 'Failed to create course.' });
  }
};

// -------------------------
// Update course
// -------------------------
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course updated successfully', course });
  } catch (err) {
    console.error('[UpdateCourse]', err);
    res.status(500).json({ message: 'Failed to update course.' });
  }
};

// -------------------------
// Delete course
// -------------------------
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('[DeleteCourse]', err);
    res.status(500).json({ message: 'Failed to delete course.' });
  }
};

// -------------------------
// Get all classes
// -------------------------
export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ schoolId: req.user.schoolId }).sort({ createdAt: -1 });
    res.json({ classes });
  } catch (err) {
    console.error('[AdminGetClasses]', err);
    res.status(500).json({ message: 'Failed to fetch classes.' });
  }
};

// -------------------------
// Create new class
// -------------------------
export const createClass = async (req, res) => {
  try {
    const { name, fee } = req.body;
    if (!name) return res.status(400).json({ message: 'Class name is required.' });
    if (fee == null || isNaN(fee) || fee < 0) {
      return res.status(400).json({ message: 'Valid class fee is required.' });
    }
    const newClass = new Class({ name, fee, schoolId: req.user.schoolId });
    await newClass.save();
    res.status(201).json({ message: 'Class created successfully.', class: newClass });
  } catch (err) {
    console.error('[CreateClass]', err);
    res.status(500).json({ message: 'Failed to create class.' });
  }
};

// -------------------------
// Update class
// -------------------------
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fee } = req.body;
    const cls = await Class.findOneAndUpdate(
      { _id: id, schoolId: req.user.schoolId },
      { name, fee },
      { new: true }
    );
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    res.json({ message: 'Class updated successfully.', class: cls });
  } catch (err) {
    console.error('[UpdateClass]', err);
    res.status(500).json({ message: 'Failed to update class.' });
  }
};

// -------------------------
// Delete class
// -------------------------
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await Class.findOneAndDelete({ _id: id, schoolId: req.user.schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    res.json({ message: 'Class deleted successfully.' });
  } catch (err) {
    console.error('[DeleteClass]', err);
    res.status(500).json({ message: 'Failed to delete class.' });
  }
};

// -------------------------
// Get submitted results
// -------------------------
export const getSubmittedResults = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const results = await Result.find({ status: 'submitted' })
      .populate({
        path: 'student',
        match: { schoolId },
        populate: { path: 'classId', select: 'name' }
      })
      .populate('teacher', 'name');

    res.json({ results: results.filter(r => r.student) });
  } catch (err) {
    console.error('[AdminGetResults]', err);
    res.status(500).json({ message: 'Failed to fetch results.' });
  }
};

// -------------------------
// Review result
// -------------------------
export const reviewResult = async (req, res) => {
  try {
    const { resultId, action } = req.body;
    const result = await Result.findById(resultId).populate('student');
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    if (String(result.student.schoolId) !== String(req.user.schoolId)) {
      return res.status(403).json({ message: 'Not authorized for this school.' });
    }
    result.status = action === 'verify' ? 'verified' : 'rejected';
    await result.save();
    res.json({ message: `Result ${action}ed.` });
  } catch (err) {
    console.error('[AdminReviewResult]', err);
    res.status(500).json({ message: 'Failed to review result.' });
  }
};

// -------------------------
// Admin dashboard (Real Data)
// -------------------------
export const getAdminDashboard = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      pendingResults,
      approvedResults,
      rejectedResults,
      recentActivity
    ] = await Promise.all([
      Student.countDocuments({ schoolId }),
      User.countDocuments({ schoolId, role: 'teacher' }),
      Class.countDocuments({ schoolId }),
      Result.countDocuments({ status: 'submitted' }),
      Result.countDocuments({ status: 'verified' }),
      Result.countDocuments({ status: 'rejected' }),
      Result.find({ schoolId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('student', 'name regNo')
        .populate('teacher', 'name')
    ]);

    // Payment stats
    const students = await Student.find({ schoolId }).populate('classId', 'fee');
    const fullPaid = students.filter(s => s.amountPaid >= (s.classId?.fee || 0)).length;
    const partialPaid = students.filter(
      s => s.amountPaid > 0 && s.amountPaid < (s.classId?.fee || 0)
    ).length;
    const unpaidFeesAmount = students
      .filter(s => s.amountPaid < (s.classId?.fee || 0))
      .reduce((sum, s) => sum + ((s.classId?.fee || 0) - s.amountPaid), 0);

    const activeStudents = students.filter(s => s.amountPaid > 0).length;

    // Mock trend data for now (could later track monthly)
    const feesTrend = [40000, 50000, 70000, 85000, 90000, 95000];
    const resultsTrend = [10, 15, 8, 20, 18, 22];

    res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      activeStudents,
      unpaidFeesAmount,
      partialPaid,
      fullPaid,
      pendingResults,
      approvedResults,
      rejectedResults,
      feesTrend,
      resultsTrend,
      recentActivity
    });
  } catch (err) {
    console.error('[AdminDashboardError]', err);
    res.status(500).json({ message: 'Failed to fetch dashboard data.' });
  }
};

// -------------------------
// Get school code
// -------------------------
export const getSchoolCode = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found.' });
    res.json({ schoolCode: school.schoolCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// -------------------------
// Get Admin Settings
// -------------------------
export const getAdminSettings = async (req, res) => {
  try {
    const adminId = req.user._id;
    console.log('[GetAdminSettings] Admin ID:', adminId);
    console.log('[GetAdminSettings] School ID:', req.user.schoolId);
    
    if (!adminId || !req.user.schoolId) {
      console.error('[GetAdminSettings] Missing user data in request');
      return res.status(400).json({ message: 'Invalid user data' });
    }
    
    const admin = await User.findById(adminId).select('-password');
    console.log('[GetAdminSettings] Admin found:', !!admin);
    
    if (!admin) {
      console.error('[GetAdminSettings] Admin not found for ID:', adminId);
      return res.status(404).json({ message: 'Admin user not found.' });
    }
    
    const school = await School.findById(req.user.schoolId).select(
      'name address phone motto classes subjects gradingSystem termStart termEnd defaultFee lateFee schoolCode'
    );
    console.log('[GetAdminSettings] School found:', !!school);

    if (!school) {
      console.error('[GetAdminSettings] School not found for ID:', req.user.schoolId);
      return res.status(404).json({ message: 'School not found.' });
    }

    const responseData = {
      admin: {
        name: admin.name,
        email: admin.email,
      },
      school: {
        name: school.name,
        address: school.address,
        phone: school.phone,
        motto: school.motto,
        schoolCode: school.schoolCode,
        defaultFee: school.defaultFee || 0,
        classes: school.classes,
        subjects: school.subjects,
        gradingSystem: school.gradingSystem,
        termStart: school.termStart ? new Date(school.termStart).toISOString().split('T')[0] : '',
        termEnd: school.termEnd ? new Date(school.termEnd).toISOString().split('T')[0] : '',
      },
    };
    
    console.log('[GetAdminSettings] Sending response');
    res.json(responseData);
  } catch (err) {
    console.error('[GetAdminSettings] Error:', err.message);
    console.error('[GetAdminSettings] Stack:', err.stack);
    res.status(500).json({ 
      message: 'Failed to load settings.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// -------------------------
// Update Admin Settings
// -------------------------
export const updateAdminSettings = async (req, res) => {
  try {
    const { section, data } = req.body;
    const adminId = req.user._id;
    const schoolId = req.user.schoolId;

    if (!section || !data) {
      return res.status(400).json({ message: 'Missing section or data in request body.' });
    }

    switch (section) {
      case 'profile': {
        const { schoolName, phone, address, motto } = data;
        await School.findByIdAndUpdate(schoolId, {
          name: schoolName,
          phone: phone,
          address: address,
          motto: motto,
        }, { new: true });
        return res.json({ message: 'School profile updated successfully.' });
      }

      case 'security': {
        const { currentPassword, newPassword, confirmPassword } = data;
        if (!currentPassword || !newPassword || !confirmPassword) {
          return res.status(400).json({ message: 'All password fields are required.' });
        }
        if (newPassword !== confirmPassword) {
          return res.status(400).json({ message: 'New passwords do not match.' });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        // ✅ FIXED: Must explicitly select password field
        const admin = await User.findById(adminId).select('+password');
        if (!admin) return res.status(404).json({ message: 'Admin user not found.' });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Current password is incorrect.' });
        }
        
        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(adminId, { password: hashedPassword });

        return res.json({ message: 'Password updated successfully.' });
      }

      case 'fees': {
        const { defaultFee } = data;
        await School.findByIdAndUpdate(schoolId, {
          defaultFee: defaultFee,
        }, { new: true });
        return res.json({ message: 'Fee settings updated successfully.' });
      } 
        
      case 'academic': {
        const { gradingSystem, termStart, termEnd } = data;
        await School.findByIdAndUpdate(schoolId, {
          gradingSystem: gradingSystem,
          termStart: termStart ? new Date(termStart) : null,
          termEnd: termEnd ? new Date(termEnd) : null,
        }, { new: true });
        return res.json({ message: 'Academic settings updated successfully.' });
      }
      
      default:
        return res.status(400).json({ message: 'Invalid settings section provided.' });
    }
  } catch (err) {
    console.error('[UpdateAdminSettings]', err);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
};

// -------------------------
// Get Payment Status (Categorized by payment status)
// -------------------------
export const getPaymentStatus = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;

    const students = await Student.find({ schoolId })
      .populate('classId', 'name fee')
      .sort({ classId: 1, name: 1 });

    const paid = [];
    const partial = [];
    const unpaid = [];

    students.forEach(student => {
      const classFee = student.classId?.fee || 0;
      const amountPaid = student.amountPaid || 0;

      const studentData = {
        ...student.toObject(),
        classFee
      };

      if (amountPaid >= classFee && classFee > 0) {
        paid.push(studentData);
      } else if (amountPaid > 0 && amountPaid < classFee) {
        partial.push(studentData);
      } else {
        unpaid.push(studentData);
      }
    });

    res.json({ paid, partial, unpaid });
  } catch (err) {
    console.error('[GetPaymentStatus]', err);
    res.status(500).json({ message: 'Failed to fetch payment status.' });
  }
};

// -------------------------
// Send Payment Reminders
// -------------------------
export const sendPaymentReminders = async (req, res) => {
  try {
    const { category } = req.body;
    const schoolId = req.user.schoolId;

    if (!['paid', 'partial', 'unpaid'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category.' });
    }

    const school = await School.findById(schoolId).select('name phone');
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    const students = await Student.find({ schoolId })
      .populate('classId', 'name fee');

    const targetStudents = [];

    students.forEach(student => {
      const classFee = student.classId?.fee || 0;
      const amountPaid = student.amountPaid || 0;

      let shouldInclude = false;

      if (category === 'paid' && amountPaid >= classFee && classFee > 0) {
        shouldInclude = true;
      } else if (category === 'partial' && amountPaid > 0 && amountPaid < classFee) {
        shouldInclude = true;
      } else if (category === 'unpaid' && amountPaid === 0) {
        shouldInclude = true;
      }

      if (shouldInclude && student.parentPhone) {
        targetStudents.push({
          name: student.name,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          classFee,
          amountPaid,
          balance: classFee - amountPaid,
          className: student.classId?.name || 'Unknown'
        });
      }
    });

    if (targetStudents.length === 0) {
      return res.status(400).json({ 
        message: 'No students with phone numbers found in this category.' 
      });
    }

    const messages = targetStudents.map(student => {
      const formattedFee = `₦${student.classFee.toLocaleString()}`;
      const formattedPaid = `₦${student.amountPaid.toLocaleString()}`;
      const formattedBalance = `₦${student.balance.toLocaleString()}`;

      let messageText = '';

      if (category === 'paid') {
        messageText = `Dear ${student.parentName || 'Parent'},\n\n` +
          `Thank you for completing payment of ${formattedFee} for ${student.name} (${student.className}).\n\n` +
          `We appreciate your prompt payment.\n\n` +
          `Best regards,\n${school.name}\n${school.phone}`;
      } else if (category === 'partial') {
        messageText = `Dear ${student.parentName || 'Parent'},\n\n` +
          `This is a reminder regarding school fees for ${student.name} (${student.className}).\n\n` +
          `Total Fee: ${formattedFee}\n` +
          `Amount Paid: ${formattedPaid}\n` +
          `Balance: ${formattedBalance}\n\n` +
          `Please complete the payment at your earliest convenience.\n\n` +
          `Best regards,\n${school.name}\n${school.phone}`;
      } else {
        messageText = `Dear ${student.parentName || 'Parent'},\n\n` +
          `This is a reminder that school fees for ${student.name} (${student.className}) have not been paid.\n\n` +
          `Amount Due: ${formattedFee}\n\n` +
          `Please make payment as soon as possible to avoid any inconvenience.\n\n` +
          `Best regards,\n${school.name}\n${school.phone}`;
      }

      return {
        to: student.parentPhone,
        message: messageText
      };
    });

    try {
      const results = await SMSService.sendBulkMessages(messages);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      res.json({ 
        message: `Sent ${successCount}/${messages.length} messages successfully.`,
        sentCount: successCount,
        failedCount: failCount,
        details: results
      });
    } catch (error) {
      console.error('[SendPaymentReminders Error]', error);
      res.status(500).json({ message: 'Failed to send reminders.' });
    }

  } catch (err) {
    console.error('[SendPaymentReminders]', err);
    res.status(500).json({ message: 'Failed to send payment reminders.' });
  }
};

// -------------------------
// Update Student Payment
// -------------------------
export const updateStudentPayment = async (req, res) => {
  try {
    const { studentId, amountPaid, parentPhone } = req.body;

    if (!studentId || amountPaid == null) {
      return res.status(400).json({ message: 'Student ID and amount paid are required.' });
    }

    const student = await Student.findOne({ 
      _id: studentId, 
      schoolId: req.user.schoolId 
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    student.amountPaid = amountPaid;
    if (parentPhone) {
      student.parentPhone = parentPhone;
    }

    await student.save();

    const updatedStudent = await Student.findById(studentId)
      .populate('classId', 'name fee');

    res.json({ 
      message: 'Payment information updated successfully.',
      student: updatedStudent
    });

  } catch (err) {
    console.error('[UpdateStudentPayment]', err);
      res.status(500).json({ message: 'Failed to update payment information.' });
    }
  };