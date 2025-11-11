// server/services/smsService.js - WITH USER-FRIENDLY ERROR MESSAGES

import axios from 'axios';

const TERMII_API_URL = 'https://api.ng.termii.com/api/sms/send';
const { TERMII_API_KEY, TERMII_SENDER_ID } = process.env;

/**
 * Format phone number to Nigerian format
 */
const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned;
  }
  
  return cleaned;
};

/**
 * Send a basic SMS
 */
const sendSMS = async (to, message) => {
  try {
    // Validate configuration
    if (!TERMII_API_KEY) {
      console.error('❌ TERMII_API_KEY not configured');
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

    const formattedPhone = formatPhoneNumber(to);
    
    const payload = {
      api_key: TERMII_API_KEY,
      to: formattedPhone,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'generic',
    };

    console.log('[SMS Service] Sending SMS');
    console.log('[SMS Service] To:', formattedPhone);
    console.log('[SMS Service] From:', TERMII_SENDER_ID);

    const response = await axios.post(TERMII_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[SMS Service] ✅ Response:', response.data);

    if (response.data && (response.data.code === 'ok' || response.data.message_id)) {
      console.log(`✅ SMS sent successfully to ${formattedPhone}`);
      return { 
        success: true, 
        data: response.data,
        messageId: response.data.message_id
      };
    } else {
      console.error(`❌ Unexpected response:`, response.data);
      return { 
        success: false, 
        error: 'SMS delivery failed',
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
        
        if (msg.includes('insufficient balance')) {
          userMessage = 'SMS service has insufficient balance. Please contact school administrator to top up.';
          errorCode = 'INSUFFICIENT_BALANCE';
        } else if (msg.includes('invalid api key')) {
          userMessage = 'SMS service authentication failed. Please contact administrator.';
          errorCode = 'INVALID_API_KEY';
        } else if (msg.includes('invalid sender')) {
          userMessage = 'SMS sender ID not approved. Please contact administrator.';
          errorCode = 'INVALID_SENDER';
        } else if (msg.includes('invalid phone')) {
          userMessage = 'Invalid phone number format.';
          errorCode = 'INVALID_PHONE';
        } else {
          userMessage = errorData.message;
        }
      }
      
      return { 
        success: false, 
        error: userMessage,
        errorCode,
        technicalDetails: errorData
      };
    }
    
    return { 
      success: false, 
      error: 'Network error while sending SMS. Please try again.',
      errorCode: 'NETWORK_ERROR'
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

    if (!parentPhone || !studentName || !amount || !paymentLink || !schoolName) {
      console.error('[SMS Service] Missing required parameters');
      throw new Error('Missing required parameters for payment link SMS');
    }

    const formattedAmount = `₦${amount.toLocaleString()}`;
    
    let message = `Dear ${parentName || 'Parent'},\n\n`;
    message += `School fee payment for ${studentName} is due.\n`;
    message += `Amount: ${formattedAmount}\n\n`;
    
    if (dueDate) {
      const dueDateStr = new Date(dueDate).toLocaleDateString('en-GB');
      message += `Due: ${dueDateStr}\n`;
    }
    
    message += `Pay securely here: ${paymentLink}\n\n`;
    message += `${schoolName}`;

    console.log('[SMS Service] Sending payment link');
    console.log('[SMS Service] Student:', studentName);
    console.log('[SMS Service] Amount:', formattedAmount);

    return await sendSMS(parentPhone, message);
  } catch (error) {
    console.error('[SMS Service] Error sending payment link:', error);
    return { 
      success: false, 
      error: error.message,
      errorCode: 'PAYMENT_LINK_ERROR'
    };
  }
};

/**
 * Send bulk SMS messages
 */
const sendBulkMessages = async (messages) => {
  try {
    console.log(`[SMS Service] Sending ${messages.length} bulk messages`);
    
    const results = [];
    
    for (const msg of messages) {
      const result = await sendSMS(msg.to, msg.message);
      results.push({
        to: msg.to,
        ...result
      });
      
      // Delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`[SMS Service] Bulk send complete: ${successCount}/${messages.length} successful`);
    
    return results;
  } catch (error) {
    console.error('[SMS Service] Bulk send error:', error);
    throw error;
  }
};

/**
 * Send result notification
 */
const sendResultNotification = async (phoneNumber, studentName, className, term, schoolName) => {
  try {
    const message = 
      `Dear Parent,\n\n` +
      `${studentName}'s ${term} result for ${className} is now available.\n\n` +
      `Please check your email or contact the school for details.\n\n` +
      `${schoolName}`;

    console.log('[SMS Service] Sending result notification');
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('[SMS Service] Error sending result notification:', error);
    return { 
      success: false, 
      error: error.message,
      errorCode: 'RESULT_NOTIFICATION_ERROR'
    };
  }
};

export default {
  sendSMS,
  sendPaymentLink,
  sendBulkMessages,
  sendResultNotification
};