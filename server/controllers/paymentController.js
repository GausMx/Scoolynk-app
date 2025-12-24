// server/controllers/paymentController.js - COMPLETE WITH TIERED FEES

import crypto from 'crypto';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import paystackService from '../services/paystackService.js';
import SMSService from '../services/smsService.js';
import auditService from '../services/auditService.js';

// ========== CONFIGURATION ==========
const MINIMUM_PAYMENT = 5000; // ₦5,000 minimum to prevent losses
const LARGE_PAYMENT_THRESHOLD = 10000; // ₦10,000 threshold for fee bearer switch

// ✅ Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ✅ Get client IP address (handles proxies)
const getClientIP = (req) => {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         'unknown';
};

// ========== ADMIN ROUTES ==========

// ✅ Create payment link (without sending SMS)
export const createPaymentLink = async (req, res) => {
  try {
    const { studentId } = req.body;
    const schoolId = req.user.schoolId;

    const student = await Student.findOne({ _id: studentId, schoolId })
      .populate('classId', 'name fee');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);
    
    if (balance <= 0) {
      return res.status(400).json({ message: 'No outstanding balance.' });
    }

    if (balance < MINIMUM_PAYMENT) {
      return res.status(400).json({ 
        message: `Minimum payment amount is ₦${MINIMUM_PAYMENT.toLocaleString()}. Current balance: ₦${balance.toLocaleString()}`
      });
    }

    // Generate payment token if not exists
    if (!student.paymentToken) {
      student.paymentToken = crypto.randomBytes(16).toString('hex');
      await student.save();
    }

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://scoolynk.com.ng';
    const paymentLink = `${frontendUrl}/pay/${student.paymentToken}`;

    res.json({
      message: 'Payment link created.',
      paymentLink,
      balance,
      studentName: student.name
    });
  } catch (err) {
    console.error('[CreatePaymentLink]', err);
    res.status(500).json({ message: 'Failed to create payment link.' });
  }
};

// ✅ Send payment link to individual parent
export const sendPaymentLinkToParent = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    console.log('[SendPaymentLink] Request for student:', studentId);

    const student = await Student.findOne({ 
      _id: studentId, 
      schoolId: req.user.schoolId 
    }).populate('classId', 'name fee');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.parentPhone) {
      return res.status(400).json({ 
        message: 'Parent phone number not provided for this student' 
      });
    }

    const school = await School.findById(req.user.schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const classFee = student.classId?.fee || 0;
    const amountPaid = student.amountPaid || 0;
    const balance = classFee - amountPaid;

    if (balance <= 0) {
      return res.status(400).json({ 
        message: 'Student has no outstanding balance' 
      });
    }

    if (balance < MINIMUM_PAYMENT) {
      return res.status(400).json({ 
        message: `Balance (₦${balance.toLocaleString()}) is below minimum payment of ₦${MINIMUM_PAYMENT.toLocaleString()}`
      });
    }

    // Generate unique payment token if not exists
    if (!student.paymentToken) {
      student.paymentToken = crypto.randomBytes(16).toString('hex');
      await student.save();
    }

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://app.scoolynk.com.ng';
    const paymentLink = `${frontendUrl}/pay/${student.paymentToken}`;

    console.log('[SendPaymentLink] Payment link:', paymentLink);

    const smsResult = await SMSService.sendPaymentLink({
      parentPhone: student.parentPhone,
      parentName: student.parentName || 'Parent',
      studentName: student.name,
      amount: balance,
      paymentLink: paymentLink,
      schoolName: school.name,
      dueDate: null
    });

    if (!smsResult.success) {
      console.error('[SendPaymentLink] SMS failed:', smsResult.error);
      return res.status(500).json({ 
        message: smsResult.error || 'Failed to send payment link via SMS',
        errorCode: smsResult.errorCode,
        paymentLink,
        balance
      });
    }

    student.paymentLinkSentAt = new Date();
    await student.save();

    res.json({ 
      message: 'Payment link sent successfully via SMS',
      paymentLink,
      sentTo: student.parentPhone,
      balance
    });

  } catch (error) {
    console.error('[SendPaymentLink]', error);
    res.status(500).json({ 
      message: 'Failed to send payment link',
      error: error.message 
    });
  }
};

// ✅ Send bulk payment links
export const sendPaymentLinksToAll = async (req, res) => {
  try {
    const { category } = req.body;
    const schoolId = req.user.schoolId;

    const school = await School.findById(schoolId);
    const students = await Student.find({ schoolId }).populate('classId', 'name fee');

    const targetStudents = students.filter(student => {
      const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);
      const amountPaid = student.amountPaid || 0;
      
      // Filter by category and minimum payment
      if (balance < MINIMUM_PAYMENT) return false;
      
      if (category === 'unpaid' && amountPaid === 0 && balance > 0) return true;
      if (category === 'partial' && amountPaid > 0 && balance > 0) return true;
      if (!category && balance > 0) return true;
      return false;
    }).filter(s => s.parentPhone);

    if (targetStudents.length === 0) {
      return res.status(400).json({ 
        message: `No eligible students found with balance ≥ ₦${MINIMUM_PAYMENT.toLocaleString()}.` 
      });
    }

    const results = [];
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://scoolynk.com.ng';

    
    for (const student of targetStudents) {
      try {
        const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);

        if (!student.paymentToken) {
          student.paymentToken = crypto.randomBytes(16).toString('hex');
          await student.save();
        }

        const paymentLink = `${frontendUrl}/pay/${student.paymentToken}`;

        const smsResult = await SMSService.sendPaymentLink({
          parentPhone: student.parentPhone,
          parentName: student.parentName || 'Parent',
          studentName: student.name,
          amount: balance,
          paymentLink,
          schoolName: school.name,
          dueDate: null
        });

        if (smsResult.success) {
          student.paymentLinkSentAt = new Date();
          await student.save();
          
          results.push({ 
            success: true, 
            studentName: student.name, 
            sentTo: student.parentPhone,
            amount: balance
          });
        } else {
          results.push({ 
            success: false, 
            studentName: student.name, 
            error: smsResult.error || 'SMS failed'
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push({ success: false, studentName: student.name, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      message: `Sent to ${successCount}/${targetStudents.length} parents.`,
      sentCount: successCount,
      failedCount: targetStudents.length - successCount,
      results
    });
  } catch (err) {
    console.error('[SendBulkPaymentLinks]', err);
    res.status(500).json({ message: 'Failed to send bulk links.' });
  }
};

// ========== PUBLIC ROUTES ==========

// ✅ Get payment details by token (PUBLIC - NO AUTH) + AUDIT LOG
export const getPaymentDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    const student = await Student.findOne({ paymentToken: token })
      .populate('classId', 'name fee')
      .populate('schoolId', 'name phone address');

    if (!student) {
      return res.status(404).json({ message: 'Invalid payment link' });
    }

    if (!student.schoolId || !student.schoolId._id) {
      console.error('[GetPaymentDetails] Missing schoolId for student:', student._id);
      return res.status(500).json({ 
        message: 'Configuration error. Please contact the school.' 
      });
    }

    if (!student.classId || !student.classId._id) {
      console.error('[GetPaymentDetails] Missing classId for student:', student._id);
      return res.status(500).json({ 
        message: 'Student class not configured. Please contact the school.' 
      });
    }

    const classFee = student.classId?.fee || 0;
    const amountPaid = student.amountPaid || 0;
    const balance = classFee - amountPaid;

    if (balance <= 0) {
      return res.status(400).json({ 
        message: 'This payment has already been completed' 
      });
    }

    if (balance < MINIMUM_PAYMENT) {
      return res.status(400).json({ 
        message: `Balance (₦${balance.toLocaleString()}) is below minimum payment of ₦${MINIMUM_PAYMENT.toLocaleString()}`
      });
    }


    await auditService.logPaymentAction({
      paymentId: tempPayment._id,
      studentId: student._id,
      schoolId: student.schoolId._id,
      action: 'payment_page_viewed',
      amount: balance,
      paymentToken: token,
      ipAddress,
      userAgent,
      status: 'success'
    });

    res.json({
      student: {
        name: student.name,
        regNo: student.regNo,
        className: student.classId?.name,
        parentEmail: student.parentEmail
      },
      school: {
        name: student.schoolId?.name,
        phone: student.schoolId?.phone,
        address: student.schoolId?.address,
      },
      payment: {
        totalFee: classFee,
        amountPaid,
        balance,
        minimumPayment: MINIMUM_PAYMENT
      }
    });

  } catch (error) {
    console.error('[GetPaymentDetails]', error);
    res.status(500).json({ message: 'Failed to get payment details' });
  }
};

// ✅ TIERED FEE METHOD: Initialize payment
export const initializePayment = async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    // ✅ VALIDATE EMAIL
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ 
        message: 'Valid email address is required' 
      });
    }

    const student = await Student.findOne({ paymentToken: token })
      .populate('classId', 'name fee')
      .populate('schoolId');

    if (!student) {
      return res.status(404).json({ message: 'Invalid payment link' });
    }

    if (!student.schoolId || !student.schoolId._id) {
      console.error('[InitializePayment] Missing schoolId for student:', student._id);
      return res.status(500).json({ 
        message: 'School configuration error. Please contact the school.' 
      });
    }

    const school = student.schoolId;
    const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);

if (balance === 0) {
  // Only block if EXACTLY zero (fully paid)
  return res.status(400).json({ 
    message: 'Payment has been completed in full.',
    code: 'FULLY_PAID'
  });
}

    // ✅ MINIMUM PAYMENT CHECK
// ✅ NEW CODE:
if (balance > 0 && balance < MINIMUM_PAYMENT) {
  minimumWarning = `Note: Minimum recommended payment is ₦${MINIMUM_PAYMENT.toLocaleString()}`;
  // Show warning but DON'T block payment
}

    if (!school.paystackSubaccountCode) {
      console.error('[InitializePayment] Missing payment config for school:', school._id);
      return res.status(400).json({ 
        message: 'School payment account not configured. Please contact school administration.' 
      });
    }

    const reference = paystackService.generateReference(student._id.toString());

    // Create payment record
    const payment = new Payment({
      studentId: student._id,
      schoolId: school._id,
      amount: balance,
      paymentMethod: 'card',
      paymentToken: token,
      paystackReference: reference,
      parentName: student.parentName,
      parentEmail: email,
      parentPhone: student.parentPhone,
      metadata: { 
        studentName: student.name, 
        className: student.classId?.name, 
        regNo: student.regNo,
        schoolId: school._id.toString()
      },
      expiresAt: null
    });

    await payment.save();

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://scoolynk-app.netlify.app';

    // ✅ TIERED FEE STRUCTURE
    const platformFeePercentage = school.paymentSettings?.platformFeePercentage || 5;
    
    let bearer;
    let feeNote;
    
    if (balance >= LARGE_PAYMENT_THRESHOLD) {
      // Large payment: Platform pays Paystack fees
      bearer = 'subaccount';
      feeNote = `Large payment (≥₦${LARGE_PAYMENT_THRESHOLD.toLocaleString()}): Platform absorbs Paystack fees`;
      console.log(`[InitializePayment] ${feeNote}`);
    } else {
      // Small payment: School pays Paystack fees
      bearer = 'account';
      feeNote = `Small payment (<₦${LARGE_PAYMENT_THRESHOLD.toLocaleString()}): School pays Paystack fees`;
      console.log(`[InitializePayment] ${feeNote}`);
    }

    // ✅ Initialize with Paystack
    const paystackResponse = await paystackService.initializeTransaction({
      email: email,
      amount: balance,
      reference,
      subaccount: school.paystackSubaccountCode,
      transaction_charge: platformFeePercentage,
      bearer: bearer, // ✅ TIERED: 'subaccount' for large, 'account' for small
      metadata: {
        paymentId: payment._id.toString(),
        studentName: student.name,
        schoolId: school._id.toString(),
        schoolName: school.name,
        feeBearer: bearer,
        feeNote: feeNote,
      },
      callback_url: `${frontendUrl}/payment/verify?reference=${reference}`
    });

    // ✅ LOG: Payment initialized
    await auditService.logPaymentAction({
      paymentId: payment._id,
      studentId: student._id,
      schoolId: school._id,
      action: 'payment_initialized',
      amount: balance,
      paymentToken: token,
      paystackReference: reference,
      ipAddress,
      userAgent,
      email,
      status: 'success',
      metadata: {
        authorizationUrl: paystackResponse.data.authorization_url,
        feeBearer: bearer,
        feeNote: feeNote
      }
    });

    res.json({
      message: 'Payment initialized.',
      authorizationUrl: paystackResponse.data.authorization_url,
      reference,
      feeStructure: {
        bearer: bearer,
        note: feeNote
      }
    });
  } catch (err) {
    console.error('[InitializePayment]', err);
    
    // ✅ LOG: Failed initialization
    if (req.params.token) {
      try {
        const student = await Student.findOne({ paymentToken: req.params.token });
        if (student) {
          await auditService.logPaymentAction({
            paymentId: new mongoose.Types.ObjectId(),
            studentId: student._id,
            schoolId: student.schoolId,
            action: 'payment_initialized',
            amount: 0,
            paymentToken: req.params.token,
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent'],
            email: req.body.email,
            status: 'failed',
            errorMessage: err.message
          });
        }
      } catch (logError) {
        console.error('[InitializePayment] Failed to log error:', logError);
      }
    }
    
    res.status(500).json({ message: 'Failed to initialize payment.' });
  }
};

// ✅ Verify payment (PUBLIC - NO AUTH) + AUDIT LOG
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    console.log('[VerifyPayment] Verifying reference:', reference);

    const paystackResponse = await paystackService.verifyTransaction(reference);
    
    if (paystackResponse.data.status !== 'success') {
      // ✅ LOG: Verification failed
      const payment = await Payment.findOne({ paystackReference: reference });
      if (payment) {
        await auditService.logPaymentAction({
          paymentId: payment._id,
          studentId: payment.studentId,
          schoolId: payment.schoolId,
          action: 'payment_verified',
          amount: payment.amount,
          paystackReference: reference,
          ipAddress,
          userAgent,
          status: 'failed',
          errorMessage: 'Paystack verification failed'
        });
      }
      
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    const payment = await Payment.findOne({ paystackReference: reference })
      .populate('schoolId', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.status === 'completed') {
      return res.json({ 
        message: 'Payment already recorded.', 
        payment: {
          amount: payment.amount,
          status: payment.status,
          paidAt: payment.paidAt,
          schoolName: payment.schoolId?.name
        }
      });
    }

    if (!payment.schoolId || !payment.schoolId._id) {
      console.error('[VerifyPayment] Missing schoolId for payment:', payment._id);
      return res.status(500).json({ 
        message: 'Payment configuration error. Please contact the school.' 
      });
    }

    // Update payment record
    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.paymentMethod = paystackResponse.data.channel;
    payment.metadata = { ...payment.metadata, paystackData: paystackResponse.data };
    await payment.save();

    console.log('[VerifyPayment] Payment record updated');

    // Update student record
    const student = await Student.findOne({
      _id: payment.studentId,
      schoolId: payment.schoolId._id
    });

    if (student) {
      student.amountPaid = (student.amountPaid || 0) + payment.amount;
      student.lastPaymentAt = new Date();
      await student.save();
      console.log('[VerifyPayment] Student balance updated:', {
        studentId: student._id,
        newBalance: student.amountPaid
      });
    } else {
      console.error('[VerifyPayment] Student not found or school mismatch');
    }

    // ✅ LOG: Payment completed
    await auditService.logPaymentAction({
      paymentId: payment._id,
      studentId: payment.studentId,
      schoolId: payment.schoolId._id,
      action: 'payment_completed',
      amount: payment.amount,
      paystackReference: reference,
      ipAddress,
      userAgent,
      email: payment.parentEmail,
      status: 'success',
      metadata: {
        channel: paystackResponse.data.channel,
        paidAt: payment.paidAt,
        feeBearer: payment.metadata?.feeBearer || 'unknown'
      }
    });

    res.json({
      message: 'Payment verified successfully!',
      payment: { 
        amount: payment.amount, 
        status: payment.status, 
        paidAt: payment.paidAt,
        schoolName: payment.schoolId?.name
      }
    });
  } catch (err) {
    console.error('[VerifyPayment]', err);
    
    // ✅ LOG: Verification error
    try {
      const payment = await Payment.findOne({ paystackReference: req.params.reference });
      if (payment) {
        await auditService.logPaymentAction({
          paymentId: payment._id,
          studentId: payment.studentId,
          schoolId: payment.schoolId,
          action: 'payment_verified',
          amount: payment.amount,
          paystackReference: req.params.reference,
          ipAddress: getClientIP(req),
          userAgent: req.headers['user-agent'],
          status: 'failed',
          errorMessage: err.message
        });
      }
    } catch (logError) {
      console.error('[VerifyPayment] Failed to log error:', logError);
    }
    
    res.status(500).json({ message: 'Verification failed.' });
  }
};

// ✅ Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { status } = req.query;

    const query = { schoolId };
    
    if (req.query.paystackOnly === 'true') {
      query.paystackReference = { $exists: true, $ne: null };
    }
    
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'name regNo')
      .sort({ createdAt: -1 })
      .limit(100);

    const totalAmount = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      payments,
      stats: {
        total: payments.length,
        completed: payments.filter(p => p.status === 'completed').length,
        pending: payments.filter(p => p.status === 'pending').length,
        totalAmount
      }
    });
  } catch (err) {
    console.error('[GetPaymentHistory]', err);
    res.status(500).json({ message: 'Failed to fetch history.' });
  }
};