import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // App password or Gmail password (use app password for 2FA)
  },
});

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
  await transporter.sendMail(mailOptions);
}
