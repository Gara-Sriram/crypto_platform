// routes/auth.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendOTP, verifyOTP, login, getProfile, updateProfile } = require('../controllers/authController');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;