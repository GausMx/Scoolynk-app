// server/controllers/paymentController.js - COMPLETE WITH ALL EXPORTS

import crypto from 'crypto';
import axios from 'axios';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import paystackService from '../services/paystackService.js';
import SMSService from '../services/smsService.js';

const generatePaymentToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

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

    // Generate payment token if not exists
    if (!student.paymentToken) {
      student.paymentToken = crypto.randomBytes(16).toString('hex');
      await student.save();
    }

    const paymentLink = `${process.env.FRONTEND_URL}/pay/${student.paymentToken}`;

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

    // Find student with class fee
    const student = await Student.findOne({ 
      _id: studentId, 
      schoolId: req.user.schoolId 
    }).populate('classId', 'name fee');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if parent phone exists
    if (!student.parentPhone) {
      return res.status(400).json({ 
        message: 'Parent phone number not provided for this student' 
      });
    }

    // Get school details
    const school = await School.findById(req.user.schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Calculate outstanding balance
    const classFee = student.classId?.fee || 0;
    const amountPaid = student.amountPaid || 0;
    const balance = classFee - amountPaid;

    if (balance <= 0) {
      return res.status(400).json({ 
        message: 'Student has no outstanding balance' 
      });
    }

    // Generate unique payment token if not exists
    if (!student.paymentToken) {
      student.paymentToken = crypto.randomBytes(16).toString('hex');
      await student.save();
    }

    // Create payment link
    const paymentLink = `${process.env.FRONTEND_URL}/pay/${student.paymentToken}`;

    console.log('[SendPaymentLink] Payment link:', paymentLink);
    console.log('[SendPaymentLink] Balance:', balance);

    // ✅ FIXED: Use the correct method name and handle errors
    const smsResult = await SMSService.sendPaymentLink(
      student.parentPhone,
      student.name,
      balance,
      paymentLink,
      school.name
    );

    if (!smsResult.success) {
      console.error('[SendPaymentLink] SMS failed:', smsResult.error);
      
      // Return user-friendly error
      return res.status(500).json({ 
        message: smsResult.error || 'Failed to send payment link via SMS',
        errorCode: smsResult.errorCode,
        // Still return the payment link so admin can manually share it
        paymentLink,
        balance
      });
    }

    // Update sent timestamp
    student.paymentLinkSentAt = new Date();
    await student.save();

    console.log('[SendPaymentLink] SMS sent successfully');

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

// ✅ Send bulk payment links to all students with balance
export const sendPaymentLinksToAll = async (req, res) => {
  try {
    const { category } = req.body;
    const schoolId = req.user.schoolId;

    const school = await School.findById(schoolId);
    const students = await Student.find({ schoolId }).populate('classId', 'name fee');

    const targetStudents = students.filter(student => {
      const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);
      const amountPaid = student.amountPaid || 0;
      
      if (category === 'unpaid' && amountPaid === 0 && balance > 0) return true;
      if (category === 'partial' && amountPaid > 0 && balance > 0) return true;
      if (!category && balance > 0) return true; // ALL with balance if no category
      return false;
    }).filter(s => s.parentPhone);

    if (targetStudents.length === 0) {
      return res.status(400).json({ message: 'No eligible students found.' });
    }

    const results = [];

    for (const student of targetStudents) {
      try {
        const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);

        // Generate payment token
        if (!student.paymentToken) {
          student.paymentToken = crypto.randomBytes(16).toString('hex');
          await student.save();
        }

        const paymentLink = `${process.env.FRONTEND_URL}/pay/${student.paymentToken}`;

        // Send SMS
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
            sentTo: student.parentPhone
          });
        } else {
          results.push({ 
            success: false, 
            studentName: student.name, 
            error: smsResult.error || 'SMS failed'
          });
        }
        
        // Rate limit delay
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

// Get payment details by token
export const getPaymentDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const student = await Student.findOne({ paymentToken: token })
      .populate('classId', 'name fee')
      .populate('schoolId', 'name phone address');

    if (!student) {
      return res.status(404).json({ message: 'Invalid payment link' });
    }

    const classFee = student.classId?.fee || 0;
    const amountPaid = student.amountPaid || 0;
    const balance = classFee - amountPaid;

    if (balance <= 0) {
      return res.status(400).json({ 
        message: 'This payment has already been completed' 
      });
    }

    res.json({
      student: {
        name: student.name,
        regNo: student.regNo,
        className: student.classId?.name,
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
      }
    });

  } catch (error) {
    console.error('[GetPaymentDetails]', error);
    res.status(500).json({ message: 'Failed to get payment details' });
  }
};

// Initialize payment with Paystack
export const initializePayment = async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.body;

    const student = await Student.findOne({ paymentToken: token })
      .populate('classId', 'name fee')
      .populate('schoolId');

    if (!student) {
      return res.status(404).json({ message: 'Invalid payment link' });
    }

    const school = student.schoolId;
    const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);

    if (balance <= 0) {
      return res.status(400).json({ message: 'No outstanding balance' });
    }

    if (!school.paystackSubaccountCode) {
      return res.status(400).json({ 
        message: 'School payment account not configured. Please contact school.' 
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
      parentEmail: email || student.parentEmail,
      parentPhone: student.parentPhone,
      metadata: { 
        studentName: student.name, 
        className: student.classId?.name, 
        regNo: student.regNo 
      },
      expiresAt: null
    });

    await payment.save();

    // Initialize with Paystack
    const paystackResponse = await paystackService.initializeTransaction({
      email: email || student.parentEmail || 'noreply@school.com',
      amount: balance,
      reference,
      subaccount: school.paystackSubaccountCode,
      transaction_charge: school.paymentSettings?.platformFeePercentage || 5,
      bearer: 'account',
      metadata: {
        paymentId: payment._id.toString(),
        studentName: student.name,
        schoolId: school._id.toString(),
        schoolName: school.name
      },
      callback_url: `${process.env.FRONTEND_URL}/payment/${token}/verify`
    });

    res.json({
      message: 'Payment initialized.',
      authorizationUrl: paystackResponse.data.authorization_url,
      reference
    });
  } catch (err) {
    console.error('[InitializePayment]', err);
    res.status(500).json({ message: 'Failed to initialize payment.' });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const paystackResponse = await paystackService.verifyTransaction(reference);
    if (paystackResponse.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    const payment = await Payment.findOne({ paystackReference: reference });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status === 'completed') return res.json({ message: 'Already recorded.', payment });

    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.paymentMethod = paystackResponse.data.channel;
    payment.metadata = { ...payment.metadata, paystackData: paystackResponse.data };
    await payment.save();

    const student = await Student.findById(payment.studentId);
    if (student) {
      student.amountPaid = (student.amountPaid || 0) + payment.amount;
      student.lastPaymentAt = new Date();
      await student.save();
    }

    res.json({
      message: 'Payment verified!',
      payment: { amount: payment.amount, status: payment.status, paidAt: payment.paidAt }
    });
  } catch (err) {
    console.error('[VerifyPayment]', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
};

// Get payment history - ONLY initiated payments
export const getPaymentHistory = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { status } = req.query;

    const query = { 
      schoolId,
      paystackReference: { $exists: true, $ne: null } // Only show payments with Paystack reference
    };
    
    if (status) query.status = status;

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