// server/models/PaymentAuditLog.js - NEW FILE

import mongoose from 'mongoose';

const paymentAuditLogSchema = new mongoose.Schema({
  // Core payment info
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  
  // Action tracking
  action: {
    type: String,
    enum: [
      'payment_link_created',
      'payment_link_sent',
      'payment_page_viewed',
      'payment_initialized',
      'payment_verified',
      'payment_completed',
      'payment_failed',
      'payment_cancelled',
      'refund_initiated',
      'refund_completed'
    ],
    required: true,
    index: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true
  },
  paymentToken: {
    type: String
  },
  paystackReference: {
    type: String,
    index: true
  },
  
  // Request metadata
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  email: {
    type: String
  },
  
  // Result tracking
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  errorMessage: {
    type: String
  },
  errorCode: {
    type: String
  },
  
  // Additional data
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// ✅ Compound indexes for common queries
paymentAuditLogSchema.index({ schoolId: 1, action: 1, timestamp: -1 });
paymentAuditLogSchema.index({ paymentId: 1, timestamp: -1 });
paymentAuditLogSchema.index({ paystackReference: 1, action: 1 });
paymentAuditLogSchema.index({ timestamp: -1 }); // For cleanup/archival

// ✅ TTL Index - Auto-delete logs older than 2 years
paymentAuditLogSchema.index(
  { timestamp: 1 }, 
  { 
    expireAfterSeconds: 63072000, // 2 years in seconds
    name: 'auto_cleanup_old_logs'
  }
);

const PaymentAuditLog = mongoose.model('PaymentAuditLog', paymentAuditLogSchema);

export default PaymentAuditLog;