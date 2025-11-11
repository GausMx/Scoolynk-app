// server/services/smsService.js - COMPLETE FIXED VERSION

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
    const formattedPhone = formatPhoneNumber(to);
    
    const payload = {
      api_key: TERMII_API_KEY,
      to: formattedPhone,
      from: TERMII_SENDER_ID || 'Scoolynk',
      sms: message,
      type: 'plain',
      channel: 'generic',
    };

    console.log('[SMS Service] Sending to:', formattedPhone);

    const response = await axios.post(TERMII_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data && response.data.code === 'ok') {
      console.log(`✅ SMS sent successfully to ${formattedPhone}`);
      return { success: true, data: response.data };
    } else {
      console.error(`❌ Failed to send SMS:`, response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('❌ Termii SMS Error:', error.message);
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

    console.log('[SMS Service] Sending payment link to:', parentPhone);
    console.log('[SMS Service] Student:', studentName);
    console.log('[SMS Service] Amount:', formattedAmount);

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
      await new Promise(resolve => setTimeout(resolve, 100));
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