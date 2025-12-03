// server/models/Result.js - UPDATED WITH FILLED TEMPLATE IMAGE

import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  ca1: { type: Number, default: 0, min: 0, max: 20 },
  ca2: { type: Number, default: 0, min: 0, max: 20 },
  exam: { type: Number, default: 0, min: 0, max: 60 },
  total: { type: Number }, // Auto-calculated
  grade: { type: String }, // Auto-calculated
  remark: { type: String }
}, { _id: false });

const resultSchema = new mongoose.Schema({
  pdfBase64: {
    type: String,
    default: null
  },
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
  term: {
    type: String,
    enum: ['First Term', 'Second Term', 'Third Term'],
    required: true
  },
  session: {
    type: String,
    required: true // e.g., "2024/2025"
  },
  
  // Subject scores
  subjects: [subjectSchema],
  
  // Affective traits/behavior ratings (1-5)
  affectiveTraits: {
    punctuality: { type: Number, min: 1, max: 5, default: 3 },
    behaviour: { type: Number, min: 1, max: 5, default: 3 },
    neatness: { type: Number, min: 1, max: 5, default: 3 },
    relationship: { type: Number, min: 1, max: 5, default: 3 },
    attentiveness: { type: Number, min: 1, max: 5, default: 3 },
    initiative: { type: Number, min: 1, max: 5, default: 3 }
  },
  
  // School fees status
  fees: {
    tuition: { type: Number, default: 0 },
    uniform: { type: Number, default: 0 },
    books: { type: Number, default: 0 },
    lesson: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  
  // Attendance
  attendance: {
    opened: { type: Number, default: 0 },
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 }
  },
  
  // Comments
  comments: {
    teacher: { type: String, default: '' },
    principal: { type: String, default: '' }
  },
  
  // Overall performance (auto-calculated)
  overallTotal: { type: Number },
  overallAverage: { type: Number },
  overallGrade: { type: String },
  overallPosition: { type: Number }, // Position in class
  
  // ✅ NEW: Filled template image (generated result sheet)
  filledTemplateImage: {
    type: String, // Base64 encoded image
    default: null
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'sent', 'verified'],
    default: 'draft'
  },
  
  // Timestamps
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  sentToParentAt: { type: Date },
  
  // Review info
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: { type: String },
  
  // OCR metadata (if scanned)
  wasScanned: { type: Boolean, default: false },
  scanData: {
    scannedAt: Date,
    rawText: String,
    confidence: Number
  }
}, {
  timestamps: true
});

// Indexes
resultSchema.index({ student: 1, term: 1, session: 1 });
resultSchema.index({ schoolId: 1, term: 1, session: 1 });
resultSchema.index({ classId: 1, term: 1, session: 1 });
resultSchema.index({ teacher: 1, status: 1 });
resultSchema.index({ status: 1 });

// Pre-save hook to calculate totals and grades
resultSchema.pre('save', function(next) {
  // Calculate subject totals and grades
  this.subjects.forEach(subject => {
    subject.total = (subject.ca1 || 0) + (subject.ca2 || 0) + (subject.exam || 0);
    
    // Calculate grade based on percentage
    const percentage = (subject.total / 100) * 100;
    if (percentage >= 70) subject.grade = 'A';
    else if (percentage >= 60) subject.grade = 'B';
    else if (percentage >= 50) subject.grade = 'C';
    else if (percentage >= 40) subject.grade = 'D';
    else subject.grade = 'F';
    
    // Add remark
    if (percentage >= 70) subject.remark = 'Excellent';
    else if (percentage >= 60) subject.remark = 'Very Good';
    else if (percentage >= 50) subject.remark = 'Good';
    else if (percentage >= 40) subject.remark = 'Fair';
    else subject.remark = 'Poor';
  });
  
  // Calculate overall performance
  if (this.subjects.length > 0) {
    this.overallTotal = this.subjects.reduce((sum, s) => sum + (s.total || 0), 0);
    this.overallAverage = Math.round((this.overallTotal / (this.subjects.length * 100)) * 100);
    
    if (this.overallAverage >= 70) this.overallGrade = 'A';
    else if (this.overallAverage >= 60) this.overallGrade = 'B';
    else if (this.overallAverage >= 50) this.overallGrade = 'C';
    else if (this.overallAverage >= 40) this.overallGrade = 'D';
    else this.overallGrade = 'F';
  }
  
  next();
});

// Static method to calculate positions in class
resultSchema.statics.calculateClassPositions = async function(classId, term, session) {
  const results = await this.find({ classId, term, session, status: { $in: ['approved', 'sent'] } })
    .sort({ overallTotal: -1 });
  
  for (let i = 0; i < results.length; i++) {
    results[i].overallPosition = i + 1;
    await results[i].save();
  }
};

const Result = mongoose.model('Result', resultSchema);

export default Result;