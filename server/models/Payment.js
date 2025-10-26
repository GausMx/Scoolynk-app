// server/models/Payment.js - UPDATED WITH PHONE FIELDS

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
  // UPDATED: Changed from parentWhatsApp to parentPhone
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
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

paymentSchema.index({ schoolId: 1, status: 1 });
paymentSchema.index({ studentId: 1, createdAt: -1 });
paymentSchema.index({ paymentToken: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;