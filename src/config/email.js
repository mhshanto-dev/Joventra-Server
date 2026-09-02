import nodemailer from 'nodemailer';
import { ENV } from './env.js';

let transporter = null;

if (ENV.SMTP_USER && ENV.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASS,
    },
  });
} else {
  // Mock transporter for local dev / testing
  transporter = {
    sendMail: async (mailOptions) => {
      console.log(`\n📧 [EMAIL NOTIFICATION DISPATCHED]`);
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Preview: ${mailOptions.text || 'HTML Content'}\n`);
      return { messageId: `mock_${Date.now()}` };
    }
  };
}

export { transporter };
