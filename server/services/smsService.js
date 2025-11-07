// src/services/smsService.js
import axios from 'axios';

const TERMII_API_URL = 'https://api.ng.termii.com/api/sms/send';
const { TERMII_API_KEY, TERMII_SENDER_ID } = process.env;

const sendSMS = async (to, message) => {
  try {
    const payload = {
      api_key: TERMII_API_KEY,
      to,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain', // or 'unicode' if you send special characters
      channel: 'generic',
    };

    const response = await axios.post(TERMII_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data && response.data.code === 'ok') {
      console.log(`✅ SMS sent successfully to ${to}`);
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

export default { sendSMS };
