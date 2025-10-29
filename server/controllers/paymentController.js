// server/controllers/paymentController.js - CORRECTED VERSION

import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import paystackService from '../services/paystackService.js';
import SMSService from '../services/smsService.js'; // ✅ FIXED: Correct import

const generatePaymentToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const createPaymentLink = async (req, res) => {
  try {
    const { studentId } = req.body;
    const schoolId = req.user.schoolId;

    const student = await Student.findOne({ _id: studentId, schoolId }).populate('classId', 'name fee');
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: 'School not found.' });

    const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);
    if (balance <= 0) return res.status(400).json({ message: 'No outstanding balance.' });

    const paymentToken = generatePaymentToken();
    const payment = new Payment({
      studentId: student._id,
      schoolId,
      amount: balance,
      paymentMethod: 'card',
      paymentToken,
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone, // ✅ FIXED: Consistent field name
      metadata: { studentName: student.name, className: student.classId?.name, regNo: student.regNo },
      expiresAt: null // ✅ FIXED: No expiry
    });

    await payment.save();

    res.json({
      message: 'Payment link created.',
      paymentLink: `${process.env.FRONTEND_URL}/payment/${paymentToken}`,
      payment: { token: paymentToken, amount: balance, studentName: student.name }
    });
  } catch (err) {
    console.error('[CreatePaymentLink]', err);
    res.status(500).json({ message: 'Failed to create payment link.' });
  }
};

export const sendPaymentLinkToParent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const schoolId = req.user.schoolId;

    const student = await Student.findOne({ _id: studentId, schoolId }).populate('classId', 'name fee');
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    if (!student.parentPhone) return res.status(400).json({ message: 'No phone number on record.' }); // ✅ FIXED

    const school = await School.findById(schoolId);
    const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);
    if (balance <= 0) return res.status(400).json({ message: 'No outstanding balance.' });

    const paymentToken = generatePaymentToken();
    const payment = new Payment({
      studentId: student._id,
      schoolId,
      amount: balance,
      paymentMethod: 'card',
      paymentToken,
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone, // ✅ FIXED
      metadata: { studentName: student.name, className: student.classId?.name, regNo: student.regNo },
      expiresAt: null // ✅ FIXED: No expiry
    });

    await payment.save();

    const paymentLink = `${process.env.FRONTEND_URL}/payment/${paymentToken}`;

    await SMSService.sendPaymentLink({
      parentPhone: student.parentPhone, // ✅ FIXED
      parentName: student.parentName || 'Parent',
      studentName: student.name,
      amount: balance,
      paymentLink,
      schoolName: school.name,
      dueDate: null // ✅ FIXED: No due date since no expiry
    });

    res.json({ message: 'Payment link sent.', sentTo: student.parentPhone }); // ✅ FIXED
  } catch (err) {
    console.error('[SendPaymentLink]', err);
    res.status(500).json({ message: 'Failed to send payment link.' });
  }
};

// paymentController.js - REPLACE sendPaymentLinksToAll function ONLY

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
    }).filter(s => s.parentPhone); // ✅ FIXED: Check parentPhone

    if (targetStudents.length === 0) {
      return res.status(400).json({ message: 'No eligible students found.' });
    }

    const results = [];

    for (const student of targetStudents) {
      try {
        const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);

        const paymentToken = generatePaymentToken();
        const payment = new Payment({
          studentId: student._id,
          schoolId,
          amount: balance,
          paymentMethod: 'card',
          paymentToken,
          parentName: student.parentName,
          parentEmail: student.parentEmail,
          parentPhone: student.parentPhone, // ✅ FIXED
          metadata: { studentName: student.name, className: student.classId?.name, regNo: student.regNo },
          expiresAt: null // ✅ No expiry
        });

        await payment.save();

        const paymentLink = `${process.env.FRONTEND_URL}/payment/${paymentToken}`;

        // ✅ FIXED: Use parentPhone (not parentWhatsApp)
        await SMSService.sendPaymentLink({
          parentPhone: student.parentPhone, // ✅ CORRECTED!
          parentName: student.parentName || 'Parent',
          studentName: student.name,
          amount: balance,
          paymentLink,
          schoolName: school.name,
          dueDate: null // ✅ No due date
        });

        results.push({ 
          success: true, 
          studentName: student.name, 
          sentTo: student.parentPhone // ✅ FIXED
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
      } catch (error) {
        results.push({ success: false, studentName: student.name, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      message: `Sent to ${successCount}/${targetStudents.length} parents.`,
      results
    });
  } catch (err) {
    console.error('[SendBulk]', err);
    res.status(500).json({ message: 'Failed to send bulk links.' });
  }
};
export const getPaymentDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const payment = await Payment.findOne({ paymentToken: token })
      .populate({ path: 'studentId', populate: { path: 'classId', select: 'name fee' } })
      .populate('schoolId', 'name address phone');

    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status === 'completed') return res.status(400).json({ message: 'Already completed.' });
    
    // ✅ FIXED: No expiry check - links are valid until paid
    
    res.json({
      payment: {
        amount: payment.amount,
        studentName: payment.metadata.studentName,
        className: payment.metadata.className,
        regNo: payment.metadata.regNo,
        schoolName: payment.schoolId.name,
        expiresAt: payment.expiresAt // Will be null (no expiry)
      }
    });
  } catch (err) {
    console.error('[GetPaymentDetails]', err);
    res.status(500).json({ message: 'Failed to load payment.' });
  }
};

export const initializePayment = async (req, res) => {
  try {
    const { token, email } = req.body;

    const payment = await Payment.findOne({ paymentToken: token }).populate('schoolId');
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status === 'completed') return res.status(400).json({ message: 'Already paid.' });

    const school = payment.schoolId;
    
    if (!school.paystackSubaccountCode) {
      return res.status(400).json({ 
        message: 'School payment account not configured. Please contact school administrator.' 
      });
    }

    const reference = paystackService.generateReference(payment.studentId.toString());

    const paystackResponse = await paystackService.initializeTransaction({
      email: email || payment.parentEmail || 'noreply@school.com',
      amount: payment.amount,
      reference,
      subaccount: school.paystackSubaccountCode,
      transaction_charge: school.paymentSettings?.platformFeePercentage || 5,
      bearer: 'account',
      metadata: {
        paymentId: payment._id.toString(),
        studentName: payment.metadata.studentName,
        schoolId: school._id.toString(),
        schoolName: school.name
      },
      callback_url: `${process.env.FRONTEND_URL}/payment/${token}/verify`
    });

    payment.paystackReference = reference;
    payment.parentEmail = email || payment.parentEmail;
    await payment.save();

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

export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const paystackResponse = await paystackService.verifyTransaction(reference);
    if (paystackResponse.data.status !== 'success') {
      return res.status(400).json({ message: 'Verification failed.' });
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

export const getPaymentHistory = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { status } = req.query;

    const query = { schoolId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('studentId', 'name regNo')
      .sort({ createdAt: -1 })
      .limit(100);

    const totalAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

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