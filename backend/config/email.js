const nodemailer = require('nodemailer');

/**
 * Creates and returns a configured Nodemailer transporter.
 * Uses Gmail SMTP by default; swap HOST/PORT for other providers.
 */
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for port 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use Gmail App Password (not your real password)
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
};

/**
 * Verify transporter connection on startup.
 * Call this once in server.js if you want an early warning on misconfiguration.
 */
const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email transporter is ready');
  } catch (error) {
    console.warn('⚠️  Email transporter failed to connect:', error.message);
    console.warn('   Check EMAIL_USER and EMAIL_PASS in your .env file.');
  }
};

module.exports = { createTransporter, verifyEmailConnection };