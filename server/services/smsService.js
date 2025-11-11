// server/services/smsService.js - FIXED WITH BETTER ERROR HANDLING

import axios from 'axios';

const TERMII_API_URL = 'https://api.ng.termii.com/api/sms/send';
const { TERMII_API_KEY, TERMII_SENDER_ID } = process.env;

/**
 * Format phone number to Nigerian format
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 234 (Nigeria)
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  }
  
  // If doesn't start with country code, add 234
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
    // Validate API key and sender ID
    if (!TERMII_API_KEY) {
      console.error('❌ TERMII_API_KEY is not set in environment variables');
      return { success: false, error: 'SMS service not configured' };
    }

    if (!TERMII_SENDER_ID) {
      console.error('❌ TERMII_SENDER_ID is not set in environment variables');
      return { success: false, error: 'SMS sender ID not configured' };
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
    console.log('[SMS Service] Message length:', message.length);
    console.log('[SMS Service] API Key (first 10 chars):', TERMII_API_KEY?.substring(0, 10) + '...');

    const response = await axios.post(TERMII_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[SMS Service] Response:', response.data);

    if (response.data && (response.data.code === 'ok' || response.data.message_id)) {
      console.log(`✅ SMS sent successfully to ${formattedPhone}`);
      return { success: true, data: response.data };
    } else {
      console.error(`❌ Failed to send SMS:`, response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('❌ Termii SMS Error:', error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('❌ Error Status:', error.response.status);
      console.error('❌ Error Data:', JSON.stringify(error.response.data, null, 2));
      console.error('❌ Error Headers:', error.response.headers);
      
      return { 
        success: false, 
        error: error.response.data?.message || error.response.data || error.message 
      };
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Send payment link SMS
 * @param {Object} options - Payment link options
 * @param {string} options.parentPhone - Parent's phone number
 * @param {string} options.parentName - Parent's name
 * @param {string} options.studentName - Student's name
 * @param {number} options.amount - Payment amount
 * @param {string} options.paymentLink - Payment URL
 * @param {string} options.schoolName - School name
 * @param {Date} options.dueDate - Due date (optional)
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
      console.error('[SMS Service] Missing required parameters:', {
        hasParentPhone: !!parentPhone,
        hasStudentName: !!studentName,
        hasAmount: !!amount,
        hasPaymentLink: !!paymentLink,
        hasSchoolName: !!schoolName
      });
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
    console.log('[SMS Service] Phone:', parentPhone);

    return await sendSMS(parentPhone, message);
  } catch (error) {
    console.error('[SMS Service] Error sending payment link:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send bulk SMS messages
 */
const sendBulkMessages = async (messages) => {
  try {
    console.log(`[SMS Service] Sending ${messages.length} bulk messages`);
    
    const results = [];
    
    // Send messages sequentially to avoid rate limits
    for (const msg of messages) {
      const result = await sendSMS(msg.to, msg.message);
      results.push({
        to: msg.to,
        ...result
      });
      
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('[SMS Service] Bulk send complete');
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
    return { success: false, error: error.message };
  }
};

export default {
  sendSMS,
  sendPaymentLink,
  sendBulkMessages,
  sendResultNotification
};