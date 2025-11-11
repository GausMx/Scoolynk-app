// server/controllers/paymentController.js - SMS INTEGRATION FIX

import crypto from 'crypto';
import Student from '../models/Student.js';
import School from '../models/School.js';
import SMSService from '../services/smsService.js';

// ✅ FIXED: Send payment link to parent
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

// ✅ Send bulk payment links to all students with outstanding balance
export const sendBulkPaymentLinks = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    
    console.log('[SendBulkPaymentLinks] Starting bulk send for school:', schoolId);

    // Get school details
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Get all students with outstanding balance and parent phone
    const students = await Student.find({ 
      schoolId,
      parentPhone: { $exists: true, $ne: '' }
    }).populate('classId', 'name fee');

    console.log('[SendBulkPaymentLinks] Found students:', students.length);

    // Filter students with outstanding balance
    const studentsWithBalance = students.filter(student => {
      const classFee = student.classId?.fee || 0;
      const amountPaid = student.amountPaid || 0;
      return (classFee - amountPaid) > 0;
    });

    console.log('[SendBulkPaymentLinks] Students with balance:', studentsWithBalance.length);

    if (studentsWithBalance.length === 0) {
      return res.status(400).json({ 
        message: 'No students with outstanding balance found' 
      });
    }

    // Prepare messages
    const messages = [];
    
    for (const student of studentsWithBalance) {
      // Generate payment token if not exists
      if (!student.paymentToken) {
        student.paymentToken = crypto.randomBytes(16).toString('hex');
      }

      const classFee = student.classId?.fee || 0;
      const amountPaid = student.amountPaid || 0;
      const balance = classFee - amountPaid;

      const paymentLink = `${process.env.FRONTEND_URL}/pay/${student.paymentToken}`;
      const formattedAmount = `₦${balance.toLocaleString()}`;

      const message = 
        `Dear Parent,\n\n` +
        `School fee payment for ${student.name} is due.\n` +
        `Amount: ${formattedAmount}\n\n` +
        `Pay securely here: ${paymentLink}\n\n` +
        `${school.name}`;

      messages.push({
        to: student.parentPhone,
        message
      });

      // Update sent timestamp
      student.paymentLinkSentAt = new Date();
      await student.save();
    }

    // Send bulk SMS
    console.log('[SendBulkPaymentLinks] Sending messages...');
    const results = await SMSService.sendBulkMessages(messages);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log('[SendBulkPaymentLinks] Complete. Success:', successCount, 'Failed:', failCount);

    res.json({
      message: `Payment links sent successfully to ${successCount} parents`,
      totalSent: successCount,
      totalFailed: failCount,
      total: studentsWithBalance.length
    });

  } catch (error) {
    console.error('[SendBulkPaymentLinks]', error);
    res.status(500).json({ 
      message: 'Failed to send bulk payment links',
      error: error.message 
    });
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

// Verify payment (webhook from Paystack)
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body;

    console.log('[VerifyPayment] Verifying reference:', reference);

    // Verify with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { data } = paystackResponse.data;

    if (data.status !== 'success') {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Find student by payment token (stored in metadata)
    const student = await Student.findOne({ 
      paymentToken: data.metadata.paymentToken 
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student payment
    const paidAmount = data.amount / 100; // Paystack returns amount in kobo
    student.amountPaid += paidAmount;
    student.paystackReference = reference;
    student.lastPaymentAt = new Date();
    await student.save();

    console.log('[VerifyPayment] Payment verified and recorded');

    res.json({
      message: 'Payment verified successfully',
      amountPaid: paidAmount,
      totalPaid: student.amountPaid
    });

  } catch (error) {
    console.error('[VerifyPayment]', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
};
