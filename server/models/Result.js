// server/models/Result.js - ENHANCED VERSION

import mongoose from 'mongoose';

const subjectScoreSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  ca1: { type: Number, default: 0, min: 0, max: 20 },
  ca2: { type: Number, default: 0, min: 0, max: 20 },
  exam: { type: Number, default: 0, min: 0, max: 60 },
  total: { type: Number, default: 0 }, // Auto-calculated
  grade: { type: String, default: '' }, // Auto-calculated
  remark: { type: String, default: '' }, // Auto-calculated
  position: { type: Number } // Position in class for this subject
}, { _id: false });

const affectiveTraitsSchema = new mongoose.Schema({
  punctuality: { type: Number, min: 1, max: 5, default: 3 },
  behaviour: { type: Number, min: 1, max: 5, default: 3 },
  neatness: { type: Number, min: 1, max: 5, default: 3 },
  relationship: { type: Number, min: 1, max: 5, default: 3 },
  attentiveness: { type: Number, min: 1, max: 5, default: 3 },
  initiative: { type: Number, min: 1, max: 5, default: 3 }
}, { _id: false });

const feesSchema = new mongoose.Schema({
  tuition: { type: Number, default: 0 },
  uniform: { type: Number, default: 0 },
  books: { type: Number, default: 0 },
  lesson: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
  total: { type: Number, default: 0 } // Auto-calculated
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  opened: { type: Number, default: 0 },
  present: { type: Number, default: 0 },
  absent: { type: Number, default: 0 }
}, { _id: false });

const commentsSchema = new mongoose.Schema({
  teacher: { type: String, default: '' },
  principal: { type: String, default: '' }
}, { _id: false });

const resultSchema = new mongoose.Schema({
  // References
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResultTemplate'
  },
  
  // Academic info
  term: { 
    type: String, 
    enum: ['First Term', 'Second Term', 'Third Term'],
    required: true 
  },
  session: { 
    type: String, 
    required: true // e.g., "2024/2025"
  },
  
  // Scores data
  subjects: [subjectScoreSchema],
  
  // Overall performance
  overallTotal: { type: Number, default: 0 },
  overallAverage: { type: Number, default: 0 },
  overallGrade: { type: String, default: '' },
  overallPosition: { type: Number }, // Position in class
  
  // Additional data
  affectiveTraits: affectiveTraitsSchema,
  fees: feesSchema,
  attendance: attendanceSchema,
  comments: commentsSchema,
  
  // Workflow status
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'approved', 'rejected', 'sent'],
    default: 'draft' 
  },
  
  // Workflow tracking
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentToParentAt: { type: Date },
  rejectionReason: { type: String },
  
  // OCR metadata
  wasScanned: { type: Boolean, default: false },
  scanData: {
    scannedAt: { type: Date },
    confidence: { type: Number }, // OCR confidence score
    rawText: { type: String } // Raw OCR text for reference
  },
  
  // Filled template image (the completed result sheet with scores overlaid)
  filledTemplateImage: { type: String } // Base64 image of filled result
}, {
  timestamps: true
});

// Indexes for faster queries
resultSchema.index({ schoolId: 1, student: 1, term: 1, session: 1 });
resultSchema.index({ schoolId: 1, teacher: 1, status: 1 });
resultSchema.index({ schoolId: 1, classId: 1, term: 1, session: 1 });

// Pre-save middleware to calculate totals and grades
resultSchema.pre('save', function(next) {
  // Calculate subject totals and grades
  this.subjects.forEach(subject => {
    subject.total = (subject.ca1 || 0) + (subject.ca2 || 0) + (subject.exam || 0);
    
    // Calculate grade based on total
    const percent = (subject.total / 100) * 100;
    if (percent >= 70) {
      subject.grade = 'A';
      subject.remark = 'Excellent';
    } else if (percent >= 60) {
      subject.grade = 'B';
      subject.remark = 'Very Good';
    } else if (percent >= 50) {
      subject.grade = 'C';
      subject.remark = 'Good';
    } else if (percent >= 40) {
      subject.grade = 'D';
      subject.remark = 'Fair';
    } else {
      subject.grade = 'F';
      subject.remark = 'Poor';
    }
  });
  
  // Calculate overall total and average
  this.overallTotal = this.subjects.reduce((sum, s) => sum + s.total, 0);
  this.overallAverage = this.subjects.length > 0 
    ? Math.round((this.overallTotal / (this.subjects.length * 100)) * 100) 
    : 0;
  
  // Calculate overall grade
  if (this.overallAverage >= 70) {
    this.overallGrade = 'A';
  } else if (this.overallAverage >= 60) {
    this.overallGrade = 'B';
  } else if (this.overallAverage >= 50) {
    this.overallGrade = 'C';
  } else if (this.overallAverage >= 40) {
    this.overallGrade = 'D';
  } else {
    this.overallGrade = 'F';
  }
  
  // Calculate fees total
  if (this.fees) {
    this.fees.total = (this.fees.tuition || 0) + (this.fees.uniform || 0) + 
                      (this.fees.books || 0) + (this.fees.lesson || 0) + 
                      (this.fees.other || 0);
  }
  
  next();
});

const Result = mongoose.model('Result', resultSchema);

export default Result;