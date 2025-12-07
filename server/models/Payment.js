
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'cash', 'pos'],
    default: 'card'
  },
  paymentToken: {
    type: String,
    required: true
  },
  paystackReference: {
    type: String,
    unique: true,
    sparse: true
  },
  parentName: {
    type: String,
    default: ''
  },
  parentEmail: {
    type: String,
    default: ''
  },
  parentPhone: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// ✅ CRITICAL INDEXES: For efficient payment queries
paymentSchema.index({ schoolId: 1, status: 1 }); // Admin payment history
paymentSchema.index({ schoolId: 1, createdAt: -1 }); // Recent payments
paymentSchema.index({ studentId: 1, schoolId: 1 }); // Student payment lookup
paymentSchema.index({ paystackReference: 1 }); // Payment verification
paymentSchema.index({ paymentToken: 1 }); // Public payment lookup
paymentSchema.index({ schoolId: 1, paidAt: -1 }); // Completed payments sorting

// ✅ PERFORMANCE: Compound index for dashboard queries
paymentSchema.index({ 
  schoolId: 1, 
  status: 1, 
  createdAt: -1 
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;