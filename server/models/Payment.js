// server/models/Payment.js - UPDATED WITH NO EXPIRY SUPPORT

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
    enum: ['card', 'ussd', 'bank_transfer', 'cash'],
    required: true
  },
  paymentToken: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  paystackReference: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  parentName: {
    type: String,
    trim: true
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  // UPDATED: Use parentPhone consistently
  parentPhone: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  paidAt: {
    type: Date
  },
  // UPDATED: Allow null for no expiry
  expiresAt: {
    type: Date,
    default: null  // CHANGED: null = no expiry (valid until paid)
  }
}, {
  timestamps: true
});

// Indexes for performance
paymentSchema.index({ schoolId: 1, status: 1 });
paymentSchema.index({ studentId: 1, createdAt: -1 });
paymentSchema.index({ paymentToken: 1 });
paymentSchema.index({ paystackReference: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;