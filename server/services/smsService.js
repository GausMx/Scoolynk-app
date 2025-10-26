// server/services/smsService.js - RENAMED FROM whatsappService.js

import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; // Changed from TWILIO_WHATSAPP_NUMBER

class SMSService {
  constructor() {
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      this.enabled = true;
    } else {
      this.enabled = false;
      console.warn('[SMS Service] Twilio credentials not configured. Messages will be logged only.');
    }
  }

  /**
   * Format phone number for SMS (Nigerian format)
   * @param {String} phone - Phone number
   * @returns {String} - Formatted phone number with country code
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Add + if missing
    if (!cleaned.startsWith('+')) {
      // Assume Nigeria if no country code (starts with 0)
      if (cleaned.startsWith('0')) {
        cleaned = '+234' + cleaned.substring(1); // Remove leading 0 and add +234
      } else {
        cleaned = '+234' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Send SMS message
   * @param {String} to - Recipient phone number
   * @param {String} message - Message body
   * @param {Object} school - School document (optional, for tracking)
   * @returns {Promise<Object>} - Message details
   */
  async sendMessage(to, message, school = null) {
    const formattedNumber = this.formatPhoneNumber(to);

    // If Twilio not configured, just log (demo mode)
    if (!this.enabled) {
      console.log('[SMS Service - DEMO MODE]');
      console.log('To:', formattedNumber);
      console.log('Message:', message);
      console.log('---');
      return {
        success: true,
        mode: 'demo',
        to: formattedNumber,
        message
      };
    }

    try {
      const result = await this.client.messages.create({
        from: TWILIO_PHONE_NUMBER,
        to: formattedNumber,
        body: message
      });

      console.log('[SMS Sent]', result.sid, 'to', formattedNumber);
      
      return {
        success: true,
        sid: result.sid,
        to: formattedNumber,
        status: result.status,
        provider: 'platform'
      };
    } catch (error) {
      console.error('[SMS Error]', error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send payment link via SMS to parent
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>}
   */
  async sendPaymentLink(params, school = null) {
    const { 
      parentPhone, 
      parentName, 
      studentName, 
      amount, 
      paymentLink, 
      schoolName,
      dueDate 
    } = params;

    const formattedAmount = `N${amount.toLocaleString()}`; // N for Naira in SMS
    const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString('en-GB') : 'soon';

    // Shorter message for SMS (160 characters is standard)
    const message = `Dear ${parentName || 'Parent'},\n\n` +
      `${schoolName}: Pay ${formattedAmount} for ${studentName}\n` +
      `Due: ${formattedDate}\n\n` +
      `Pay now: ${paymentLink}\n\n` +
      `Methods: Card, USSD, Bank Transfer`;

    return await this.sendMessage(parentPhone, message, school);
  }

  /**
   * Send payment reminder (no link)
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>}
   */
  async sendPaymentReminder(params, school = null) {
    const { 
      parentPhone, 
      parentName, 
      studentName, 
      className,
      totalFee,
      amountPaid,
      balance,
      schoolName,
      schoolPhone 
    } = params;

    const formattedFee = `N${totalFee.toLocaleString()}`;
    const formattedPaid = `N${amountPaid.toLocaleString()}`;
    const formattedBalance = `N${balance.toLocaleString()}`;

    let message;
    
    if (balance > 0) {
      // Reminder for unpaid/partial
      message = `${schoolName}\n\n` +
        `Dear ${parentName || 'Parent'} of ${studentName} (${className})\n\n` +
        `Fee: ${formattedFee}\n` +
        `Paid: ${formattedPaid}\n` +
        `Balance: ${formattedBalance}\n\n` +
        `Please complete payment.\n` +
        `Call: ${schoolPhone}`;
    } else {
      // Thank you message for paid
      message = `${schoolName}\n\n` +
        `Dear ${parentName || 'Parent'} of ${studentName}\n\n` +
        `Thank you for paying ${formattedFee} for ${className}.\n\n` +
        `Payment confirmed!`;
    }

    return await this.sendMessage(parentPhone, message, school);
  }

  /**
   * Send payment confirmation SMS
   * @param {Object} params - Confirmation parameters
   * @returns {Promise<Object>}
   */
  async sendPaymentConfirmation(params, school = null) {
    const {
      parentPhone,
      parentName,
      studentName,
      amount,
      reference,
      schoolName
    } = params;

    const message = `${schoolName}\n\n` +
      `Payment Confirmed!\n\n` +
      `Student: ${studentName}\n` +
      `Amount: N${amount.toLocaleString()}\n` +
      `Ref: ${reference}\n\n` +
      `Thank you!`;

    return await this.sendMessage(parentPhone, message, school);
  }

  /**
   * Send bulk SMS messages
   * @param {Array} messages - Array of {to, message} objects
   * @returns {Promise<Array>} - Results
   */
  async sendBulkMessages(messages) {
    const results = [];

    for (const msg of messages) {
      try {
        const result = await this.sendMessage(msg.to, msg.message);
        results.push({ ...result, originalTo: msg.to });
        
        // Rate limiting: 1 message per second to avoid Twilio limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          success: false,
          originalTo: msg.to,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Test Twilio credentials
   * @param {Object} credentials - Twilio credentials to test
   */
  async testCredentials(credentials) {
    try {
      const { accountSid, authToken } = credentials;
      const client = twilio(accountSid, authToken);
      
      // Try to fetch account info to verify credentials
      const account = await client.api.accounts(accountSid).fetch();
      
      return {
        valid: true,
        accountName: account.friendlyName,
        status: account.status
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

export default new SMSService();