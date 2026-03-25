const Signal = require('../models/Signal');
const Notification = require('../models/Notification');
const User = require('../models/User');
const binanceService = require('../services/binanceService');
const { computeAllIndicators } = require('../services/technicalIndicators');
const { runMultiAgentAnalysis } = require('../services/aiAgentService');
const { sendSignalAlert } = require('../services/emailService');

// ─── Generate new signal ───────────────────────────────────────────────────
exports.generateSignal = async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', interval = '1h' } = req.body;

    // Fetch market data
    const [marketData, klines] = await Promise.all([
      binanceService.get24hTicker(symbol),
      binanceService.getKlines(symbol, interval, 200),
    ]);

    if (!klines || klines.length < 50) {
      return res.status(400).json({ error: 'Insufficient historical data' });
    }

    // Compute indicators
    const indicators = computeAllIndicators(klines);

    // Run multi-agent analysis
    const analysis = await runMultiAgentAnalysis(marketData, indicators);

    // Create signal document
    const signal = new Signal({
      symbol,
      action: analysis.finalDecision,
      entryPrice: analysis.entryPrice || marketData.price,
      takeProfit: analysis.takeProfit,
      stopLoss: analysis.stopLoss,
      confidence: analysis.confidence,
      reasoning: analysis.judgeVerdict,
      agentDiscussions: analysis.agentDiscussions,
      judgeVerdict: analysis.judgeVerdict,
      indicators: {
        rsi: indicators.rsi,
        macd: indicators.macd,
        macdSignal: indicators.macdSignal,
        ma20: indicators.ma20,
        ma50: indicators.ma50,
        volume: indicators.volume,
      },
      riskLevel: analysis.riskLevel || 'MEDIUM',
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    });

    await signal.save();

    // Notify all subscribed users
    if (analysis.finalDecision !== 'HOLD') {
      notifyUsers(signal, req.app.get('io'));
    }

    res.status(201).json(signal);
  } catch (error) {
    console.error('generateSignal error:', error);
    res.status(500).json({ error: error.message || 'Signal generation failed' });
  }
};

// ─── Get all signals ──────────────────────────────────────────────────────────
exports.getSignals = async (req, res) => {
  try {
    const { symbol, action, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (symbol) filter.symbol = symbol.toUpperCase();
    if (action) filter.action = action.toUpperCase();

    const signals = await Signal.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Signal.countDocuments(filter);

    res.json({ signals, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
};

// ─── Get single signal ────────────────────────────────────────────────────────
exports.getSignal = async (req, res) => {
  try {
    const signal = await Signal.findById(req.params.id);
    if (!signal) return res.status(404).json({ error: 'Signal not found' });
    res.json(signal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signal' });
  }
};

// ─── Notify users via socket + email ─────────────────────────────────────────
const notifyUsers = async (signal, io) => {
  try {
    const users = await User.find({ isVerified: true, notificationsEnabled: true });

    for (const user of users) {
      // Save notification to DB
      const notification = new Notification({
        user: user._id,
        type: 'SIGNAL',
        title: `${signal.action} Signal: ${signal.symbol}`,
        message: `AI generated a ${signal.action} signal for ${signal.symbol} @ $${signal.entryPrice?.toFixed(2)}. Confidence: ${signal.confidence}%`,
        data: { signalId: signal._id, symbol: signal.symbol, action: signal.action },
      });
      await notification.save();

      // Emit socket event
      if (io) {
        io.to(`user_${user._id}`).emit('notification', notification);
        io.to(`user_${user._id}`).emit('new_signal', signal);
      }

      // Send email
      try {
        await sendSignalAlert(user.email, signal);
      } catch (emailError) {
        console.error(`Email failed for ${user.email}:`, emailError.message);
      }
    }
  } catch (error) {
    console.error('notifyUsers error:', error.message);
  }
};