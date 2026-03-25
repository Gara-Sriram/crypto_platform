const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getDashboard, getTicker, getKlines, getIndicators,
  getOrderBook, getRecentTrades, getDefaultSymbols,
} = require('../controllers/cryptoController');

router.get('/symbols', getDefaultSymbols);
router.get('/dashboard', auth, getDashboard);
router.get('/ticker/:symbol', auth, getTicker);
router.get('/klines/:symbol', auth, getKlines);
router.get('/indicators/:symbol', auth, getIndicators);
router.get('/orderbook/:symbol', auth, getOrderBook);
router.get('/trades/:symbol', auth, getRecentTrades);

module.exports = router;