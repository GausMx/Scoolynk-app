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
  updateStudent,
  getClassCourses
} from '../controllers/teacherController.js';

import {
  getResultTemplate,
  getMyClassResults,
  getResultById,
  saveResult,
  submitResult,
  submitMultipleResults,
  deleteResult
} from '../controllers/resultController.js';

const router = express.Router();

// ========== DASHBOARD ==========
router.get('/dashboard', protect, requireRole('teacher'), getTeacherDashboard);

// ========== CLASSES AND COURSES ==========
router.get('/classes-courses', getClassesAndCourses);
router.get('/school-classes', protect, requireRole('teacher'), getTeacherSchoolClasses);

// ========== ONBOARDING ==========
router.post('/onboarding/class-teacher', protect, requireRole('teacher'), saveClassTeacherInfo);

// ========== STUDENT MANAGEMENT ==========
router.post('/students/bulk', protect, requireRole('teacher'), bulkAddStudents);
router.put('/students/:studentId', protect, requireRole('teacher'), updateStudent);
router.get('/my-class/students', protect, requireRole('teacher'), getMyClassStudents);
router.get('/class/:classId/students', protect, requireRole('teacher'), getClassStudents);

// ========== PROFILE ==========
router.put('/profile', protect, requireRole('teacher'), updateTeacherProfile);

// ========== RESULT MANAGEMENT ==========
// Get active result template for current term/session with school details populated
router.get('/results/template', protect, requireRole('teacher'), getResultTemplate);

// Get all results for teacher's class (with filters)
router.get('/results', protect, requireRole('teacher'), getMyClassResults);

// Get single result by ID
router.get('/results/:resultId', protect, requireRole('teacher'), getResultById);

// Create or update result (with filled template image)
router.post('/results', protect, requireRole('teacher'), saveResult);

// Submit single result to admin for review
router.put('/results/:resultId/submit', protect, requireRole('teacher'), submitResult);

// Submit multiple results to admin
router.post('/results/submit-multiple', protect, requireRole('teacher'), submitMultipleResults);

// Delete result (only drafts)
router.delete('/results/:resultId', protect, requireRole('teacher'), deleteResult);
//Class courses route
router.get('/class/:classId/courses', protect, requireRole('teacher'), getClassCourses);  
export default router;