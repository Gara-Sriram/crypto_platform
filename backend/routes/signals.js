const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateSignal, getSignals, getSignal } = require('../controllers/signalController');

router.get('/', auth, getSignals);
router.post('/generate', auth, generateSignal);
router.get('/:id', auth, getSignal);

module.exports = router;