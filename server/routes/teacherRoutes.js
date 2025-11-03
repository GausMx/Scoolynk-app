// server/routes/teacherRoutes.js - UPDATED WITH RESULT ROUTES

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  getTeacherDashboard,
  getClassesAndCourses,
  getTeacherSchoolClasses,
  saveClassTeacherInfo,
  bulkAddStudents,
  updateTeacherProfile,
  getMyClassStudents,
  getClassStudents,
  updateStudent
} from '../controllers/teacherController.js';

import {
  getResultTemplate,
  getMyClassResults,
  getResultById,
  saveResult,
  scanScores,
  submitResult,
  submitMultipleResults,
  deleteResult
} from '../controllers/resultController.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', protect, requireRole('teacher'), getTeacherDashboard);

// Classes and courses
router.get('/classes-courses', getClassesAndCourses);
router.get('/school-classes', protect, requireRole('teacher'), getTeacherSchoolClasses);

// Onboarding
router.post('/onboarding/class-teacher', protect, requireRole('teacher'), saveClassTeacherInfo);

// Student management
router.post('/students/bulk', protect, requireRole('teacher'), bulkAddStudents);
router.put('/students/:studentId', protect, requireRole('teacher'), updateStudent);
router.get('/my-class/students', protect, requireRole('teacher'), getMyClassStudents);
router.get('/classes/:classId/students', protect, requireRole('teacher'), getClassStudents);

// Profile
router.put('/profile', protect, requireRole('teacher'), updateTeacherProfile);

// ✅ RESULT MANAGEMENT ROUTES
// Get result template
router.get('/results/template', protect, requireRole('teacher'), getResultTemplate);

// Get all results for teacher's class
router.get('/results', protect, requireRole('teacher'), getMyClassResults);

// Get single result by ID
router.get('/results/:resultId', protect, requireRole('teacher'), getResultById);

// Create/update result (manual entry)
router.post('/results', protect, requireRole('teacher'), saveResult);

// Scan scores using OCR
router.post('/results/scan', protect, requireRole('teacher'), scanScores);

// Submit single result to admin
router.put('/results/:resultId/submit', protect, requireRole('teacher'), submitResult);

// Submit multiple results to admin
router.post('/results/submit-multiple', protect, requireRole('teacher'), submitMultipleResults);

// Delete result (only drafts)
router.delete('/results/:resultId', protect, requireRole('teacher'), deleteResult);

export default router;