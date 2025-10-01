// routes/testEmail.js
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Test email route
router.get("/send-test-email", async (req, res) => {
  try {
    // create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // your gmail
        pass: process.env.GMAIL_PASS  // your app password
      }
    });

    // send test email
    const info = await transporter.sendMail({
      from: `"Scoolynk Test" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // send to yourself
      subject: "✅ Test Email from Scoolynk",
      text: "If you see this, your Render server can send emails successfully.",
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("Email test failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
