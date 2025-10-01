import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
// Ensure dotenv runs immediately to load variables
dotenv.config(); 

// Check if credentials exist before creating the transporter
if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error("!!! FATAL: GMAIL_USER or GMAIL_PASS is missing in environment variables. Email will not be sent. !!!");
    // Create a dummy object to prevent app crash if credentials are missing
    var transporter = {
      sendMail: async (mailOptions) => {
        console.log(`[DUMMY EMAIL] Skipping sending email to ${mailOptions.to}. Credentials missing.`);
        return { response: '250 OK (DUMMY)' };
      }
    };
} else {
    // Create a reusable transporter using Gmail SMTP
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_PASS, // App password
      },
    });
}


/**
 * Send a temporary password email to a user
 * @param {string} to - Recipient's email address
 * @param {string} tempPassword - The temporary password to send
 */
export async function sendTempPasswordEmail(to, tempPassword) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Your Temporary Password for Scoolynk',
    text: `Welcome to Scoolynk!\n\nYour account has been created.\n\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    // This is the critical log. Check your console for this specific message!
    console.error(`Error sending email to ${to}:`, error.message);
  }
}
