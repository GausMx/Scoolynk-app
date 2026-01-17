// server/routes/adminRoutes.js - UPDATED WITH TEMPLATE MANAGEMENT

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import subscriptionGuard from '../middleware/subscriptionMiddleware.js';
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminDashboard,
  getSchoolCode,
  getClasses,       
  updateClass,       
  deleteClass,      
  createClass,       
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getClassCourses,
  getTeachers,
  updateTeacher,
  deleteTeacher,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  sendPaymentReminders,
  updateStudentPayment,
} from '../controllers/adminController.js';

import {
  createResultTemplate,
  updateResultTemplate,
  getResultTemplates,
  getResultTemplate,
  deleteResultTemplate,
  duplicateResultTemplate,
  getSubmittedResults,
  reviewResult,
  sendResultToParent,
  sendMultipleResultsToParents,
  getAllResults,
  downloadResultPDF
} from '../controllers/adminResultController.js';

const router = express.Router();

// Dashboard (Mounted at /api/admin)
router.get('/', protect, subscriptionGuard, requireRole('admin'), getAdminDashboard);

// ========== RESULT TEMPLATE MANAGEMENT ==========
// Create new template (Manual Template Builder)
router.post('/templates', protect, requireRole('admin'), createResultTemplate);

// Get all templates
router.get('/templates', protect, requireRole('admin'), getResultTemplates);

router.get('/results/download/:resultId', downloadResultPDF);

// Get single template by ID
router.get('/templates/:id', protect, requireRole('admin'), getResultTemplate);

// Update template
router.put('/templates/:id', protect, requireRole('admin'), updateResultTemplate);

// Delete template (soft delete)
router.delete('/templates/:id', protect, requireRole('admin'), deleteResultTemplate);

// Duplicate template for new term/session
router.post('/templates/:id/duplicate', protect, requireRole('admin'), duplicateResultTemplate);

// ========== RESULT REVIEW & MANAGEMENT ==========
// Get all results (with filters)
router.get('/results', protect, requireRole('admin'), getAllResults);

// Get submitted results for review
router.get('/results/submitted', protect, requireRole('admin'), getSubmittedResults);

// Review result (approve/reject)
router.put('/results/:resultId/review', protect, requireRole('admin'), reviewResult);

// Send single result to parent via SMS
router.post('/results/:resultId/send', protect, requireRole('admin'), sendResultToParent);

// Send multiple results to parents
router.post('/results/send-multiple', protect, requireRole('admin'), sendMultipleResultsToParents);

// ========== SETTINGS ==========
router.get('/settings', protect, requireRole('admin'), getAdminSettings);
router.put('/settings', protect, requireRole('admin'), updateAdminSettings);

// ========== SCHOOL CODE ==========
router.get('/school/code', protect, requireRole('admin'), getSchoolCode);

// ========== CLASS MANAGEMENT ==========
router.get('/classes', protect, requireRole('admin'), getClasses);
router.post('/classes', protect, requireRole('admin'), createClass);
router.put('/classes/:id', protect, requireRole('admin'), updateClass);
router.delete('/classes/:id', protect, requireRole('admin'), deleteClass);
router.get('/classes/:id/courses', protect, requireRole('admin'), getClassCourses);

// ========== COURSE MANAGEMENT ==========
router.get('/courses', protect, requireRole('admin'), getCourses);
router.post('/courses', protect, requireRole('admin'), createCourse);
router.put('/courses/:id', protect, requireRole('admin'), updateCourse);
router.delete('/courses/:id', protect, requireRole('admin'), deleteCourse);

// ========== TEACHER MANAGEMENT ==========
router.get('/teachers', protect, requireRole('admin'), getTeachers);
router.put('/teachers/:id', protect, requireRole('admin'), updateTeacher);
router.delete('/teachers/:id', protect, requireRole('admin'), deleteTeacher);

// ========== STUDENT MANAGEMENT ==========
router.get('/students', protect, requireRole('admin'), getStudents);
router.post('/students', protect, requireRole('admin'), createStudent);
router.put('/students/:id', protect, requireRole('admin'), updateStudent);
router.delete('/students/:id', protect, requireRole('admin'), deleteStudent);

// ========== PAYMENT MANAGEMENT ==========
router.post('/payments/send-reminders', protect, requireRole('admin'), sendPaymentReminders);
router.put('/students/:id/payment', protect, requireRole('admin'), updateStudentPayment);

export default router;