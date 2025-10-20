// server/controllers/teacherController.js

import User from '../models/User.js';
import Class from '../models/Class.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import mongoose from 'mongoose';

// -------------------------
// Get Teacher Dashboard Info
// -------------------------
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const teacher = await User.findById(teacherId)
      .populate('classes', 'name')
      .populate('classTeacherFor', 'name');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    // Get courses teacher teaches
    const courses = await Course.find({ 
      teacher: teacherId, 
      schoolId: req.user.schoolId 
    }).populate('classes', 'name');

    // Get students if class teacher
    let students = [];
    if (teacher.classTeacherFor && teacher.classTeacherFor.length > 0) {
      students = await Student.find({ 
        classId: { $in: teacher.classTeacherFor },
        schoolId: req.user.schoolId 
      }).populate('classId', 'name');
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
      coursesDetailed: courses,
      students
    });
  } catch (err) {
    console.error('[GetTeacherDashboard]', err);
    res.status(500).json({ message: 'Failed to load dashboard.' });
  }
};

// -------------------------
// Get Classes and Courses for Registration Dropdown
// -------------------------
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

// -------------------------
// Save Class Teacher Info (Q&A Step)
// -------------------------
export const saveClassTeacherInfo = async (req, res) => {
  try {
    const { teacherId, classTeacherFor } = req.body;

    if (!teacherId || !classTeacherFor) {
      return res.status(400).json({ message: 'Teacher ID and class info required.' });
    }

    // Validate class IDs
    const validClasses = await Class.find({ 
      _id: { $in: classTeacherFor },
      schoolId: req.user.schoolId 
    });

    if (validClasses.length !== classTeacherFor.length) {
      return res.status(400).json({ message: 'Invalid class IDs provided.' });
    }

    // Update teacher with classTeacherFor field
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

// -------------------------
// Bulk Add Students (Manual or OCR)
// -------------------------
export const bulkAddStudents = async (req, res) => {
  try {
    const { students, classId } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Students array is required.' });
    }

    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required.' });
    }

    // Verify class exists and belongs to teacher's school
    const classExists = await Class.findOne({ 
      _id: classId, 
      schoolId: req.user.schoolId 
    });

    if (!classExists) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Generate unique registration numbers if not provided
    const studentsToInsert = students.map((student, index) => ({
      name: student.name,
      regNo: student.regNo || `REG-${Date.now()}-${index}`,
      classId: classId,
      schoolId: req.user.schoolId
    }));

    // Check for duplicate regNo
    const regNos = studentsToInsert.map(s => s.regNo);
    const existingStudents = await Student.find({ regNo: { $in: regNos } });
    
    if (existingStudents.length > 0) {
      return res.status(400).json({ 
        message: 'Some registration numbers already exist.',
        duplicates: existingStudents.map(s => s.regNo)
      });
    }

    // Insert students
    const insertedStudents = await Student.insertMany(studentsToInsert);

    // Update class with student IDs
    await Class.findByIdAndUpdate(classId, {
      $push: { students: { $each: insertedStudents.map(s => s._id) } }
    });

    res.status(201).json({ 
      message: `${insertedStudents.length} students added successfully.`,
      students: insertedStudents 
    });
  } catch (err) {
    console.error('[BulkAddStudents]', err);
    res.status(500).json({ message: 'Failed to add students.' });
  }
};

// -------------------------
// Update Teacher Profile (Classes/Courses)
// -------------------------
export const updateTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classes, courses, classTeacherFor } = req.body;

    const updateData = {};
    if (classes) updateData.classes = classes;
    if (courses) updateData.courses = courses;
    if (classTeacherFor) updateData.classTeacherFor = classTeacherFor;

    const teacher = await User.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true }
    ).populate('classes', 'name').populate('classTeacherFor', 'name');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    res.json({ 
      message: 'Profile updated successfully.',
      teacher 
    });
  } catch (err) {
    console.error('[UpdateTeacherProfile]', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

// -------------------------
// Get Students in Teacher's Class
// -------------------------
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
    }).populate('classId', 'name').sort({ name: 1 });

    res.json({ students });
  } catch (err) {
    console.error('[GetMyClassStudents]', err);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
};
