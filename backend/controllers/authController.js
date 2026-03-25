const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOTPEmail } = require('../services/emailService');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ─── Send OTP ──────────────────────────────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { email, name, purpose } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let user = await User.findOne({ email });

    if (purpose === 'register' && user && user.isVerified) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE) || 10) * 60 * 1000);

    if (!user) {
      user = new User({ email, name: name || 'User', otp, otpExpiry });
    } else {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      if (name) user.name = name;
    }

    await user.save();
    await sendOTPEmail(email, otp, purpose || 'login');

    res.json({ message: 'OTP sent successfully', email });
  } catch (error) {
    console.error('sendOTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// ─── Verify OTP & Login/Register ───────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, name, password, purpose } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ error: 'OTP expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    if (purpose === 'register') {
      if (name) user.name = name;
      if (password) user.password = password;
    }

    await user.save();

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        riskProfile: user.riskProfile,
        watchlist: user.watchlist,
      },
    });
  } catch (error) {
    console.error('verifyOTP error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// ─── Password Login (optional fallback) ───────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isVerified)
      return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        riskProfile: user.riskProfile,
        watchlist: user.watchlist,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

// ─── Get Profile ───────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpiry');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ─── Update Profile ────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, riskProfile, notificationsEnabled } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (riskProfile) updates.riskProfile = riskProfile;
    if (notificationsEnabled !== undefined) updates.notificationsEnabled = notificationsEnabled;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password -otp -otpExpiry');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};