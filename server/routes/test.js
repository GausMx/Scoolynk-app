// server/routes/test.js
import express from 'express';
import { sendTempPasswordEmail } from '../utils/email.js';

const router = express.Router();

router.get('/send-test-email', async (req, res) => {
  try {
    await sendTempPasswordEmail('lawalgaus7@gmail.com', 'Temp1234');
    res.send('Test email sent');
  } catch (err) {
    res.status(500).send('Failed to send test email');
  }
});

export default router;
