
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
  paymentToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  paystackReference: {
    type: String,
    unique: true,
    sparse: true,
  },
  paymentLinkSentAt: {
    type: Date,
  },
  lastPaymentAt: {
    type: Date,
  },
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

// ✅ CRITICAL: Unique regNo per school (prevents duplicate regNos across schools)
studentSchema.index({ regNo: 1, schoolId: 1 }, { unique: true });

// ✅ PERFORMANCE: Common query patterns
studentSchema.index({ schoolId: 1, classId: 1 }); // Get students by school and class
studentSchema.index({ schoolId: 1, name: 1 }); // Search students by name within school
studentSchema.index({ schoolId: 1, status: 1 }); // ✅ NEW: Filter by status within school
studentSchema.index({ schoolId: 1, parentPhone: 1 }); // ✅ NEW: Find by parent phone within school

// ✅ PAYMENT: Fast lookups for payment processing
studentSchema.index({ paymentToken: 1 });
studentSchema.index({ paystackReference: 1 });

// Virtual for payment status
studentSchema.virtual('paymentStatus').get(function() {
  if (!this.populated('classId') || !this.classId?.fee) return 'unknown';
  
  const classFee = this.classId.fee;
  const paid = this.amountPaid || 0;
  
  if (paid >= classFee) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

const Student = mongoose.model('Student', studentSchema);

export default Student;