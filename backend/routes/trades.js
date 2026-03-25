// routes/trades.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { openTrade, closeTrade, getTrades, getAnalytics } = require('../controllers/tradeController');

router.get('/', auth, getTrades);
router.post('/', auth, openTrade);
router.put('/:id/close', auth, closeTrade);
router.get('/analytics', auth, getAnalytics);

module.exports = router;