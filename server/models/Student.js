// server/models/Student.js - COMPLETE

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
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  // ✅ PAYMENT FIELDS
  paymentToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  paymentLinkSentAt: {
    type: Date,
    default: null
  },
  lastPaymentAt: {
    type: Date,
    default: null
  },
  // ADDITIONAL INFO
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

// ========== INDEXES ==========
studentSchema.index({ regNo: 1, schoolId: 1 }, { unique: true });
studentSchema.index({ schoolId: 1, classId: 1 });
studentSchema.index({ schoolId: 1, name: 1 });
studentSchema.index({ schoolId: 1, status: 1 });
studentSchema.index({ schoolId: 1, parentPhone: 1 });
studentSchema.index({ paymentToken: 1 });
studentSchema.index({ schoolId: 1, amountPaid: 1 });
studentSchema.index({ schoolId: 1, lastPaymentAt: -1 });

// ========== VIRTUALS ==========
studentSchema.virtual('paymentStatus').get(function() {
  if (!this.populated('classId') || !this.classId?.fee) return 'unknown';
  
  const classFee = this.classId.fee;
  const paid = this.amountPaid || 0;
  
  if (paid >= classFee && classFee > 0) return 'paid';
  if (paid > 0 && paid < classFee) return 'partial';
  return 'unpaid';
});

studentSchema.virtual('balance').get(function() {
  if (!this.populated('classId') || !this.classId?.fee) return 0;
  
  const classFee = this.classId.fee;
  const paid = this.amountPaid || 0;
  const balance = classFee - paid;
  
  return balance > 0 ? balance : 0;
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

// ========== METHODS ==========
studentSchema.methods.generatePaymentToken = function() {
  if (!this.paymentToken) {
    this.paymentToken = require('crypto').randomBytes(16).toString('hex');
  }
  return this.paymentToken;
};

studentSchema.statics.findWithBalance = function(schoolId, minBalance = 0) {
  return this.find({ schoolId, status: 'active' })
    .populate('classId', 'name fee')
    .then(students => {
      return students.filter(s => {
        const fee = s.classId?.fee || 0;
        const paid = s.amountPaid || 0;
        return (fee - paid) >= minBalance;
      });
    });
};

const Student = mongoose.model('Student', studentSchema);

export default Student;