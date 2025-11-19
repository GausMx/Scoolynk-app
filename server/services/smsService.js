// server/services/smsService.js - UPDATED WITH v3 API

import axios from 'axios';

// ✅ Use v3 API from environment or fallback to v3
const TERMII_API_URL = process.env.TERMII_API_URL || 'https://v3.api.termii.com';
const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'Scoolynk001';

/**
 * Format phone number to Nigerian format
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 234
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.substring(1);
  }
  
  // If doesn't start with 234, add it
  if (!cleaned.startsWith('234') && cleaned.length === 10) {
    cleaned = '234' + cleaned;
  }
  
  return cleaned;
};

/**
 * Validate phone number format
 */
const isValidPhoneNumber = (phone) => {
  const formatted = formatPhoneNumber(phone);
  // Nigerian numbers should be 13 digits (234 + 10 digits)
  return /^234\d{10}$/.test(formatted);
};

/**
 * Send a basic SMS
 */
const sendSMS = async (to, message) => {
  try {
    // Validate configuration
    if (!TERMII_API_KEY) {
      console.error('❌ TERMII_API_KEY not configured in environment');
      return { 
        success: false, 
        error: 'SMS service not configured. Please contact administrator.',
        errorCode: 'NO_API_KEY'
      };
    }

    if (!TERMII_SENDER_ID) {
      console.error('❌ TERMII_SENDER_ID not configured');
      return { 
        success: false, 
        error: 'SMS sender ID not configured. Please contact administrator.',
        errorCode: 'NO_SENDER_ID'
      };
    }

    // Validate phone number
    if (!isValidPhoneNumber(to)) {
      console.error('❌ Invalid phone number format:', to);
      return {
        success: false,
        error: 'Invalid phone number format. Use Nigerian format: 08012345678',
        errorCode: 'INVALID_PHONE_FORMAT'
      };
    }

    const formattedPhone = formatPhoneNumber(to);
    
    const payload = {
      api_key: TERMII_API_KEY,
      to: formattedPhone,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'generic', // Options: 'generic', 'dnd', 'whatsapp'
    };

    console.log('[SMS Service] Sending SMS via', TERMII_API_URL);
    console.log('[SMS Service] To:', formattedPhone);
    console.log('[SMS Service] From:', TERMII_SENDER_ID);
    console.log('[SMS Service] Message length:', message.length, 'characters');

    const response = await axios.post(
      `${TERMII_API_URL}/api/sms/send`, 
      payload, 
      {
        headers: { 
          'Content-Type': 'application/json' 
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    console.log('[SMS Service] ✅ Response:', response.data);

    // Check for successful response
    if (response.data && (response.data.code === 'ok' || response.data.message_id)) {
      console.log(`✅ SMS sent successfully to ${formattedPhone}`);
      return { 
        success: true, 
        data: response.data,
        messageId: response.data.message_id || response.data.code
      };
    } else {
      console.error(`❌ Unexpected response:`, response.data);
      return { 
        success: false, 
        error: 'SMS delivery failed. Please try again.',
        errorCode: 'UNEXPECTED_RESPONSE',
        details: response.data 
      };
    }
  } catch (error) {
    console.error('❌ Termii SMS Error:', error.message);
    
    if (error.response) {
      const errorData = error.response.data;
      console.error('❌ Error Status:', error.response.status);
      console.error('❌ Error Data:', JSON.stringify(errorData, null, 2));
      
      // Parse user-friendly error messages
      let userMessage = 'Failed to send SMS';
      let errorCode = 'SMS_ERROR';
      
      if (errorData.message) {
        const msg = errorData.message.toLowerCase();
        
        if (msg.includes('insufficient balance') || msg.includes('low balance')) {
          userMessage = 'SMS service has insufficient balance. Please contact school administrator to top up.';
          errorCode = 'INSUFFICIENT_BALANCE';
        } else if (msg.includes('invalid api key') || msg.includes('unauthorized')) {
          userMessage = 'SMS service authentication failed. Please contact administrator.';
          errorCode = 'INVALID_API_KEY';
        } else if (msg.includes('invalid sender') || msg.includes('sender id')) {
          userMessage = 'SMS sender ID not approved. Please contact administrator.';
          errorCode = 'INVALID_SENDER';
        } else if (msg.includes('invalid phone') || msg.includes('invalid number')) {
          userMessage = 'Invalid phone number format. Please use Nigerian format (e.g., 08012345678).';
          errorCode = 'INVALID_PHONE';
        } else if (msg.includes('rate limit')) {
          userMessage = 'Too many SMS requests. Please wait a moment and try again.';
          errorCode = 'RATE_LIMIT';
        } else {
          userMessage = errorData.message;
        }
      } else if (error.response.status === 401) {
        userMessage = 'SMS service authentication failed. Invalid API key.';
        errorCode = 'INVALID_API_KEY';
      } else if (error.response.status === 402) {
        userMessage = 'Insufficient SMS balance. Please top up your Termii account.';
        errorCode = 'INSUFFICIENT_BALANCE';
      }
      
      return { 
        success: false, 
        error: userMessage,
        errorCode,
        technicalDetails: errorData
      };
    }
    
    // Network or timeout errors
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'SMS request timed out. Please check your internet connection and try again.',
        errorCode: 'TIMEOUT'
      };
    }
    
    return { 
      success: false, 
      error: 'Network error while sending SMS. Please check your internet connection and try again.',
      errorCode: 'NETWORK_ERROR',
      technicalDetails: error.message
    };
  }
};

/**
 * Send payment link SMS
 */
const sendPaymentLink = async (options) => {
  try {
    const {
      parentPhone,
      parentName,
      studentName,
      amount,
      paymentLink,
      schoolName,
      dueDate
    } = options;

    // Validate required parameters
    if (!parentPhone || !studentName || !amount || !paymentLink || !schoolName) {
      console.error('[SMS Service] Missing required parameters for payment link');
      return {
        success: false,
        error: 'Missing required information to send payment link',
        errorCode: 'MISSING_PARAMETERS'
      };
    }

    const formattedAmount = `₦${amount.toLocaleString()}`;
    
    let message = `Dear ${parentName || 'Parent'},\n\n`;
    message += `School fee payment for ${studentName} is due.\n`;
    message += `Amount: ${formattedAmount}\n\n`;
    
    if (dueDate) {
      const dueDateStr = new Date(dueDate).toLocaleDateString('en-GB');
      message += `Due Date: ${dueDateStr}\n`;
    }
    
    message += `Pay securely here:\n${paymentLink}\n\n`;
    message += `${schoolName}`;

    console.log('[SMS Service] Sending payment link SMS');
    console.log('[SMS Service] Student:', studentName);
    console.log('[SMS Service] Amount:', formattedAmount);

    return await sendSMS(parentPhone, message);
  } catch (error) {
    console.error('[SMS Service] Error sending payment link:', error);
    return { 
      success: false, 
      error: 'Failed to send payment link SMS',
      errorCode: 'PAYMENT_LINK_ERROR',
      technicalDetails: error.message
    };
  }
};

/**
 * Send payment confirmation SMS
 */
const sendPaymentConfirmation = async (options) => {
  try {
    const {
      parentPhone,
      parentName,
      studentName,
      amount,
      reference,
      schoolName,
      balance
    } = options;

    if (!parentPhone || !studentName || !amount || !schoolName) {
      return {
        success: false,
        error: 'Missing required parameters',
        errorCode: 'MISSING_PARAMETERS'
      };
    }

    const formattedAmount = `₦${amount.toLocaleString()}`;
    
    let message = `Dear ${parentName || 'Parent'},\n\n`;
    message += `Payment of ${formattedAmount} received for ${studentName}.\n\n`;
    
    if (reference) {
      message += `Reference: ${reference}\n`;
    }
    
    if (balance !== undefined && balance > 0) {
      message += `Outstanding Balance: ₦${balance.toLocaleString()}\n`;
    } else if (balance === 0) {
      message += `✅ Fees fully paid!\n`;
    }
    
    message += `\nThank you!\n${schoolName}`;

    console.log('[SMS Service] Sending payment confirmation');
    return await sendSMS(parentPhone, message);
  } catch (error) {
    console.error('[SMS Service] Error sending payment confirmation:', error);
    return {
      success: false,
      error: 'Failed to send payment confirmation',
      errorCode: 'PAYMENT_CONFIRMATION_ERROR',
      technicalDetails: error.message
    };
  }
};

/**
 * Send bulk SMS messages
 */
const sendBulkMessages = async (messages) => {
  try {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required');
    }

    console.log(`[SMS Service] Sending ${messages.length} bulk messages`);
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      console.log(`[SMS Service] Sending ${i + 1}/${messages.length}...`);
      
      const result = await sendSMS(msg.to, msg.message);
      
      results.push({
        to: msg.to,
        ...result
      });
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Delay between messages to avoid rate limiting (500ms)
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`[SMS Service] Bulk send complete: ${successCount} successful, ${failCount} failed`);
    
    return {
      success: true,
      total: messages.length,
      sent: successCount,
      failed: failCount,
      results
    };
  } catch (error) {
    console.error('[SMS Service] Bulk send error:', error);
    return {
      success: false,
      error: error.message,
      errorCode: 'BULK_SEND_ERROR'
    };
  }
};

/**
 * Send result notification
 */
const sendResultNotification = async (phoneNumber, studentName, className, term, schoolName) => {
  try {
    if (!phoneNumber || !studentName || !className || !term || !schoolName) {
      return {
        success: false,
        error: 'Missing required parameters',
        errorCode: 'MISSING_PARAMETERS'
      };
    }

    const message = 
      `Dear Parent,\n\n` +
      `${studentName}'s ${term} result for ${className} is now available.\n\n` +
      `Please check the school portal or contact the school for details.\n\n` +
      `${schoolName}`;

    console.log('[SMS Service] Sending result notification');
    console.log('[SMS Service] Student:', studentName);
    console.log('[SMS Service] Class:', className);
    
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('[SMS Service] Error sending result notification:', error);
    return { 
      success: false, 
      error: 'Failed to send result notification',
      errorCode: 'RESULT_NOTIFICATION_ERROR',
      technicalDetails: error.message
    };
  }
};

/**
 * Send fee reminder
 */
const sendFeeReminder = async (options) => {
  try {
    const {
      parentPhone,
      parentName,
      studentName,
      balance,
      dueDate,
      schoolName
    } = options;

    if (!parentPhone || !studentName || !balance || !schoolName) {
      return {
        success: false,
        error: 'Missing required parameters',
        errorCode: 'MISSING_PARAMETERS'
      };
    }

    const formattedBalance = `₦${balance.toLocaleString()}`;
    
    let message = `Dear ${parentName || 'Parent'},\n\n`;
    message += `Reminder: Outstanding fee for ${studentName}\n`;
    message += `Amount Due: ${formattedBalance}\n\n`;
    
    if (dueDate) {
      const dueDateStr = new Date(dueDate).toLocaleDateString('en-GB');
      message += `Due Date: ${dueDateStr}\n\n`;
    }
    
    message += `Please make payment soon.\n\n`;
    message += `${schoolName}`;

    console.log('[SMS Service] Sending fee reminder');
    return await sendSMS(parentPhone, message);
  } catch (error) {
    console.error('[SMS Service] Error sending fee reminder:', error);
    return {
      success: false,
      error: 'Failed to send fee reminder',
      errorCode: 'FEE_REMINDER_ERROR',
      technicalDetails: error.message
    };
  }
};

/**
 * Check Termii account balance
 */
const checkBalance = async () => {
  try {
    if (!TERMII_API_KEY) {
      return {
        success: false,
        error: 'API key not configured',
        errorCode: 'NO_API_KEY'
      };
    }

    console.log('[SMS Service] Checking balance...');

    const response = await axios.get(
      `${TERMII_API_URL}/api/get-balance?api_key=${TERMII_API_KEY}`,
      { timeout: 10000 }
    );

    console.log('[SMS Service] Balance:', response.data);

    return {
      success: true,
      balance: response.data.balance,
      currency: response.data.currency,
      data: response.data
    };
  } catch (error) {
    console.error('[SMS Service] Balance check error:', error.response?.data || error.message);
    
    return {
      success: false,
      error: 'Failed to check SMS balance',
      errorCode: 'BALANCE_CHECK_ERROR',
      technicalDetails: error.response?.data || error.message
    };
  }
};

export default {
  sendSMS,
  sendPaymentLink,
  sendPaymentConfirmation,
  sendBulkMessages,
  sendResultNotification,
  sendFeeReminder,
  checkBalance,
  formatPhoneNumber,
  isValidPhoneNumber
};