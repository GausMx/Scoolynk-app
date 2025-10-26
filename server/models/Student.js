// server/models/Student.js - COMPLETE FILE

import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  regNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  // Payment tracking fields
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  parentPhone: {
    type: String,
    trim: true,
    default: ''
  },
  parentName: {
    type: String,
    trim: true,
    default: ''
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  // Additional fields
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'transferred'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
studentSchema.index({ schoolId: 1, classId: 1 });
studentSchema.index({ schoolId: 1, regNo: 1 });
studentSchema.index({ schoolId: 1, name: 1 });

// Virtual for payment status
studentSchema.virtual('paymentStatus').get(function() {
  if (!this.populated('classId') || !this.classId?.fee) return 'unknown';
  
  const classFee = this.classId.fee;
  const paid = this.amountPaid || 0;
  
  if (paid >= classFee) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
});

// Ensure virtuals are included in JSON
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

const Student = mongoose.model('Student', studentSchema);

export default Student;