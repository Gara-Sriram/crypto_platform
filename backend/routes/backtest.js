const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { runBacktest } = require('../controllers/backtestController');

router.post('/run', auth, runBacktest);

module.exports = router;