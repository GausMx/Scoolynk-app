import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Send a temporary password email to a user using Brevo API
 * @param {string} to - Recipient's email address
 * @param {string} tempPassword - The temporary password to send
 */
export async function sendTempPasswordEmail(to, tempPassword) {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
      to: [{ email: to }],
      sender: { email: 'scoolynkapp@gmail.com', name: 'Scoolynk' },
      subject: 'Your Temporary Password for Scoolynk',
      htmlContent: `
        <h3>Welcome to Scoolynk!</h3>
        <p>Your account has been created.</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please log in and change your password immediately.</p>
      `
    });

    await tranEmailApi.sendTransacEmail(sendSmtpEmail);
    console.log(`Temporary password email sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send temp password email to ${to}:`, err);
    throw err;
  }
}
