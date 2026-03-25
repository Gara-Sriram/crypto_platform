const nodemailer = require('nodemailer');

// ─── Create Transporter ─────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true only for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // 🔥 prevents TLS issues
    },
  });
};

// ─── Send OTP Email ─────────────────────────────────────────────────
const sendOTPEmail = async (email, otp, purpose = 'login') => {
  try {
    const transporter = createTransporter();

    const subject =
      purpose === 'register'
        ? 'Verify Your CryptoNex Account'
        : 'CryptoNex Login OTP';

    const html = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>CryptoNex OTP</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in ${
          process.env.OTP_EXPIRE || 10
        } minutes.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"CryptoNex" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.response);

  } catch (error) {
    console.error("❌ EMAIL ERROR:", error); // 🔥 FULL DEBUG
    throw error;
  }
};

// ─── Send Trade Signal Alert (optional) ──────────────────────────────
const sendSignalAlert = async (email, signal) => {
  try {
    const transporter = createTransporter();

    const html = `
      <h2>Trade Signal</h2>
      <p><strong>${signal.action}</strong> ${signal.symbol}</p>
      <p>Entry: $${signal.entryPrice}</p>
      <p>TP: $${signal.takeProfit}</p>
      <p>SL: $${signal.stopLoss}</p>
    `;

    await transporter.sendMail({
      from: `"CryptoNex Signals" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${signal.action} Signal - ${signal.symbol}`,
      html,
    });

    console.log("✅ Signal email sent");

  } catch (error) {
    console.error("❌ SIGNAL EMAIL ERROR:", error);
  }
};

module.exports = { sendOTPEmail, sendSignalAlert };