// server/controllers/teacherController.js - FIXED UPDATE PROFILE

import User from '../models/User.js';
import Class from '../models/Class.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import School from '../models/School.js';

// Get Teacher Dashboard Info - FIXED TO INCLUDE SCHOOL
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const schoolId = req.user.schoolId;
    
    const teacher = await User.findById(teacherId)
      .populate('classes', 'name')
      .populate('classTeacherFor', 'name');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    // ✅ Fetch school information
    const school = await School.findById(schoolId).select('name phone motto');

    // ✅ Fetch courses for this teacher in their school
    const courses = await Course.find({ 
      teacher: teacherId, 
      schoolId: schoolId 
    }).populate('classes', 'name');

    // ✅ Get students in teacher's classes (only their school)
    let students = [];
    if (teacher.classTeacherFor && teacher.classTeacherFor.length > 0) {
      students = await Student.find({ 
        classId: { $in: teacher.classTeacherFor },
        schoolId: schoolId 
      }).populate('classId', 'name fee');
    }

    // ✅ NEW: Get results statistics for teacher's classes
    const studentIds = students.map(s => s._id);
    
    let pendingResults = 0;
    let submittedResults = 0;
    let verifiedResults = 0;
    
    if (studentIds.length > 0) {
      // Count results by status for students in teacher's classes
      const [pending, submitted, verified] = await Promise.all([
        Result.countDocuments({ 
          student: { $in: studentIds },
          teacher: teacherId,
          status: 'draft'
        }),
        Result.countDocuments({ 
          student: { $in: studentIds },
          teacher: teacherId,
          status: 'submitted'
        }),
        Result.countDocuments({ 
          student: { $in: studentIds },
          teacher: teacherId,
          status: 'verified'
        })
      ]);
      
      pendingResults = pending;
      submittedResults = submitted;
      verifiedResults = verified;
    }

    res.json({
      teacher: {
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        classes: teacher.classes,
        classTeacherFor: teacher.classTeacherFor,
        courses: teacher.courses
      },
      school: {
        name: school?.name || '',
        phone: school?.phone || '',
        motto: school?.motto || ''
      },
      coursesDetailed: courses,
      students,
      // ✅ NEW: Results statistics
      stats: {
        totalStudents: students.length,
        pendingResults,      // Draft results not yet submitted
        submittedResults,    // Results submitted and awaiting approval
        verifiedResults,     // Results approved by admin
        classesTeaching: teacher.classes?.length || 0
      }
    });
  } catch (err) {
    console.error('[GetTeacherDashboard]', err);
    res.status(500).json({ message: 'Failed to load dashboard.' });
  }
};

// Get Classes and Courses (Public - for registration)
export const getClassesAndCourses = async (req, res) => {
  try {
    const { schoolCode } = req.query;
    
    if (!schoolCode) {
      return res.status(400).json({ message: 'School code is required.' });
    }

    const school = await School.findOne({ schoolCode });
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    const classes = await Class.find({ schoolId: school._id }).select('_id name');
    const courses = await Course.find({ schoolId: school._id }).select('_id name');

    res.json({ classes, courses });
  } catch (err) {
    console.error('[GetClassesAndCourses]', err);
    res.status(500).json({ message: 'Failed to fetch classes and courses.' });
  }
};

// Get Classes for Authenticated Teacher
export const getTeacherSchoolClasses = async (req, res) => {
  try {
    if (!req.user?.schoolId) {
      return res.status(400).json({ message: 'School ID not found.' });
    }
    
    const classes = await Class.find({ schoolId: req.user.schoolId }).select('_id name');
    res.json({ classes });
  } catch (err) {
    console.error('[GetTeacherSchoolClasses]', err);
    res.status(500).json({ message: 'Failed to fetch classes.' });
  }
};

// Save Class Teacher Info
export const saveClassTeacherInfo = async (req, res) => {
  try {
    const { teacherId, classTeacherFor } = req.body;

    if (!teacherId || !classTeacherFor) {
      return res.status(400).json({ message: 'Teacher ID and class info required.' });
    }

    const validClasses = await Class.find({ 
      _id: { $in: classTeacherFor },
      schoolId: req.user.schoolId 
    });

    if (validClasses.length !== classTeacherFor.length) {
      return res.status(400).json({ message: 'Invalid class IDs provided.' });
    }

    const teacher = await User.findByIdAndUpdate(
      teacherId,
      { classTeacherFor: classTeacherFor },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    res.json({ 
      message: 'Class teacher info saved successfully.',
      teacher 
    });
  } catch (err) {
    console.error('[SaveClassTeacherInfo]', err);
    res.status(500).json({ message: 'Failed to save class teacher info.' });
  }
};

// Bulk Add Students
export const bulkAddStudents = async (req, res) => {
  try {
    const { students, classId } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Students array is required.' });
    }

    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required.' });
    }

    const classExists = await Class.findOne({ 
      _id: classId, 
      schoolId: req.user.schoolId 
    });

    if (!classExists) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    const studentsToInsert = [];
    const duplicates = [];
    const errors = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      if (!student.name || student.name.trim() === '') {
        errors.push(`Row ${i + 1}: Student name is required`);
        continue;
      }

      let regNo = student.regNo?.trim() || '';
      if (!regNo) {
        regNo = `${classExists.name.substring(0, 3).toUpperCase()}-${Date.now()}-${i}`;
      }

      const existingStudent = await Student.findOne({ 
        regNo, 
        schoolId: req.user.schoolId 
      });

      if (existingStudent) {
        duplicates.push({ name: student.name, regNo });
        continue;
      }

      const duplicateInBatch = studentsToInsert.find(s => s.regNo === regNo);
      if (duplicateInBatch) {
        duplicates.push({ name: student.name, regNo });
        continue;
      }

      studentsToInsert.push({
        name: student.name.trim(),
        regNo: regNo,
        classId: classId,
        schoolId: req.user.schoolId,
        parentPhone: student.parentPhone?.trim() || '',
        parentName: student.parentName?.trim() || '',
        parentEmail: student.parentEmail?.trim() || '',
        amountPaid: student.amountPaid || 0
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation errors found.',
        errors 
      });
    }

    if (duplicates.length > 0) {
      return res.status(400).json({ 
        message: 'Some registration numbers already exist.',
        duplicates,
        processed: studentsToInsert.length
      });
    }

    if (studentsToInsert.length === 0) {
      return res.status(400).json({ 
        message: 'No valid students to add.' 
      });
    }

    const insertedStudents = await Student.insertMany(studentsToInsert);

    await Class.findByIdAndUpdate(classId, {
      $push: { students: { $each: insertedStudents.map(s => s._id) } }
    });

    res.status(201).json({ 
      message: `${insertedStudents.length} student(s) added successfully.`,
      students: insertedStudents,
      stats: {
        total: students.length,
        added: insertedStudents.length,
        duplicates: duplicates.length,
        errors: errors.length
      }
    });
  } catch (err) {
    console.error('[BulkAddStudents]', err);
    res.status(500).json({ message: 'Failed to add students.' });
  }
};

// ✅ FIXED: Update Teacher Profile - Now includes name and phone
export const updateTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { name, phone, classes, courses, classTeacherFor } = req.body;

    console.log('[UpdateTeacherProfile] Request body:', req.body);

    const updateData = {};
    
    // ✅ CRITICAL: Add name and phone to updateData
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim();
    }
    
    if (phone !== undefined && phone.trim() !== '') {
      updateData.phone = phone.trim();
    }
    
    // Handle classes
    if (classes !== undefined) {
      updateData.classes = Array.isArray(classes) ? classes : [];
    }
    
    // Handle courses
    if (courses !== undefined) {
      updateData.courses = Array.isArray(courses) ? courses : [];
    }
    
    // Handle classTeacherFor
    if (classTeacherFor !== undefined) {
      updateData.classTeacherFor = Array.isArray(classTeacherFor) ? classTeacherFor : [];
    }

    console.log('[UpdateTeacherProfile] Update data:', updateData);

    // Validate class IDs if provided
    if (updateData.classes && updateData.classes.length > 0) {
      const validClasses = await Class.find({ 
        _id: { $in: updateData.classes },
        schoolId: req.user.schoolId 
      });
      
      if (validClasses.length !== updateData.classes.length) {
        return res.status(400).json({ message: 'Some class IDs are invalid.' });
      }
    }

    // Validate classTeacherFor IDs if provided
    if (updateData.classTeacherFor && updateData.classTeacherFor.length > 0) {
      const validClassTeacher = await Class.find({ 
        _id: { $in: updateData.classTeacherFor },
        schoolId: req.user.schoolId 
      });
      
      if (validClassTeacher.length !== updateData.classTeacherFor.length) {
        return res.status(400).json({ message: 'Some class teacher IDs are invalid.' });
      }
    }

    const teacher = await User.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true, runValidators: true }
    ).populate('classes', 'name').populate('classTeacherFor', 'name');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    console.log('[UpdateTeacherProfile] Updated teacher:', teacher);

    res.json({ 
      message: 'Profile updated successfully.',
      teacher: {
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        classes: teacher.classes,
        classTeacherFor: teacher.classTeacherFor,
        courses: teacher.courses
      }
    });
  } catch (err) {
    console.error('[UpdateTeacherProfile] Error:', err);
    res.status(500).json({ message: 'Failed to update profile.', error: err.message });
  }
};

// Get Students in Teacher's Classes
export const getMyClassStudents = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const teacher = await User.findById(teacherId).select('classTeacherFor');

    if (!teacher || !teacher.classTeacherFor || teacher.classTeacherFor.length === 0) {
      return res.json({ students: [], message: 'You are not a class teacher for any class.' });
    }

    const students = await Student.find({ 
      classId: { $in: teacher.classTeacherFor },
      schoolId: req.user.schoolId 
    }).populate('classId', 'name fee').sort({ name: 1 });

    res.json({ students });
  } catch (err) {
    console.error('[GetMyClassStudents]', err);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
};

// Get Students in Specific Class (with payment info)
export const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherSchoolId = req.user.schoolId;
    
    const classExists = await Class.findOne({ 
      _id: classId,
      schoolId: teacherSchoolId 
    });
    
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found or access denied.' });
    }
    
    const students = await Student.find({ 
      classId: classId,
      schoolId: teacherSchoolId 
    })
    .populate('classId', 'name fee')
    .sort({ name: 1 });

    const studentsWithStatus = students.map(student => {
      const classFee = classExists.fee || 0;
      const amountPaid = student.amountPaid || 0;
      
      let paymentStatus = 'unpaid';
      if (amountPaid >= classFee && classFee > 0) {
        paymentStatus = 'paid';
      } else if (amountPaid > 0) {
        paymentStatus = 'partial';
      }

      return {
        ...student.toObject(),
        classFee,
        paymentStatus,
        balance: classFee - amountPaid
      };
    });
    
    res.json({ 
      students: studentsWithStatus, 
      className: classExists.name,
      classFee: classExists.fee || 0
    });
  } catch (err) {
    console.error('[GetClassStudents]', err);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
};
export const getClassCourses = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherSchoolId = req.user.schoolId;
    
    // Verify class exists and belongs to teacher's school
    const classExists = await Class.findOne({ 
      _id: classId,
      schoolId: teacherSchoolId 
    });
    
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found or access denied.' });
    }
    
    // Get courses for this class
    const courses = await Course.find({ 
      classes: classId,
      schoolId: teacherSchoolId 
    })
    .populate('teacher', 'name email')
    .sort({ name: 1 });
    
    res.json({ 
      courses,
      className: classExists.name
    });
  } catch (err) {
    console.error('[GetClassCourses]', err);
    res.status(500).json({ message: 'Failed to fetch courses.' });
  }
};


// Update Student (for teacher to edit student info including payment)
export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, regNo, parentPhone, parentName, parentEmail, amountPaid } = req.body;

    const student = await Student.findOne({ 
      _id: studentId, 
      schoolId: req.user.schoolId 
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Verify teacher has access (must be class teacher)
    const teacher = await User.findById(req.user._id);
    const hasAccess = teacher.classTeacherFor?.some(
      classId => classId.toString() === student.classId.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. Not class teacher for this student.' });
    }

    // Update fields
    if (name) student.name = name;
    if (regNo) student.regNo = regNo;
    if (parentPhone !== undefined) student.parentPhone = parentPhone;
    if (parentName !== undefined) student.parentName = parentName;
    if (parentEmail !== undefined) student.parentEmail = parentEmail;
    if (amountPaid !== undefined) student.amountPaid = amountPaid;

    await student.save();

    const updatedStudent = await Student.findById(studentId).populate('classId', 'name fee');

    res.json({ 
      message: 'Student updated successfully.',
      student: updatedStudent
    });
  } catch (err) {
    console.error('[UpdateStudent]', err);
    res.status(500).json({ message: 'Failed to update student.' });
  }
};