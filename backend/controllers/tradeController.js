const Trade = require('../models/Trade');
const User = require('../models/User');
const Notification = require('../models/Notification');
const binanceService = require('../services/binanceService');

// ─── Open a dummy trade ───────────────────────────────────────────────────────
exports.openTrade = async (req, res) => {
  try {
    const { symbol, type, quantity, takeProfit, stopLoss, signalId, note } = req.body;

    if (!symbol || !type || !quantity) {
      return res.status(400).json({ error: 'symbol, type, and quantity are required' });
    }

    const user = await User.findById(req.user._id);
    const currentPrice = await binanceService.getPrice(symbol);
    const amount = currentPrice * quantity;

    if (amount > user.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct from balance
    user.balance -= amount;
    await user.save();

    const trade = new Trade({
      user: req.user._id,
      symbol,
      type,
      entryPrice: currentPrice,
      quantity,
      amount,
      takeProfit,
      stopLoss,
      note,
      signalId,
    });

    await trade.save();

    res.status(201).json({ trade, newBalance: user.balance });
  } catch (error) {
    console.error('openTrade error:', error);
    res.status(500).json({ error: 'Failed to open trade' });
  }
};

// ─── Close a trade ────────────────────────────────────────────────────────────
exports.closeTrade = async (req, res) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, user: req.user._id });

    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'OPEN') return res.status(400).json({ error: 'Trade is already closed' });

    const currentPrice = await binanceService.getPrice(trade.symbol);

    if (trade.type === 'BUY') {
      trade.pnl = (currentPrice - trade.entryPrice) * trade.quantity;
    } else {
      trade.pnl = (trade.entryPrice - currentPrice) * trade.quantity;
    }

    trade.pnlPercent = (trade.pnl / trade.amount) * 100;
    trade.exitPrice = currentPrice;
    trade.status = 'CLOSED';
    trade.closedAt = new Date();

    await trade.save();

    // Return funds + PnL to balance
    const user = await User.findById(req.user._id);
    user.balance += trade.amount + trade.pnl;
    await user.save();

    // Create notification
    const io = req.app.get('io');
    const notification = new Notification({
      user: req.user._id,
      type: 'TRADE_CLOSED',
      title: `Trade Closed: ${trade.symbol}`,
      message: `Your ${trade.type} trade on ${trade.symbol} was closed. P&L: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)} (${trade.pnlPercent.toFixed(2)}%)`,
      data: { tradeId: trade._id, pnl: trade.pnl },
    });
    await notification.save();

    if (io) {
      io.to(`user_${req.user._id}`).emit('notification', notification);
      io.to(`user_${req.user._id}`).emit('trade_update', { trade, balance: user.balance });
    }

    res.json({ trade, newBalance: user.balance });
  } catch (error) {
    console.error('closeTrade error:', error);
    res.status(500).json({ error: 'Failed to close trade' });
  }
};

// ─── Get user trades ──────────────────────────────────────────────────────────
exports.getTrades = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status.toUpperCase();

    const trades = await Trade.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('signalId', 'action confidence');

    const total = await Trade.countDocuments(filter);

    // Get current prices for open trades
    const openTrades = trades.filter((t) => t.status === 'OPEN');
    if (openTrades.length > 0) {
      const symbols = [...new Set(openTrades.map((t) => t.symbol))];
      const pricePromises = symbols.map((s) => binanceService.getPrice(s).catch(() => null));
      const prices = await Promise.all(pricePromises);
      const priceMap = {};
      symbols.forEach((s, i) => { if (prices[i]) priceMap[s] = prices[i]; });

      trades.forEach((t) => {
        if (t.status === 'OPEN' && priceMap[t.symbol]) {
          const cp = priceMap[t.symbol];
          t._doc = t.toObject();
          if (t.type === 'BUY') {
            t._doc.currentPnl = (cp - t.entryPrice) * t.quantity;
          } else {
            t._doc.currentPnl = (t.entryPrice - cp) * t.quantity;
          }
          t._doc.currentPnlPercent = (t._doc.currentPnl / t.amount) * 100;
          t._doc.currentPrice = cp;
        }
      });
    }

    res.json({ trades: trades.map((t) => t._doc || t.toObject()), total, page: parseInt(page) });
  } catch (error) {
    console.error('getTrades error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
};

// ─── Get trade analytics ──────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const trades = await Trade.find({ user: req.user._id, status: { $ne: 'OPEN' } });

    const total = trades.length;
    const winners = trades.filter((t) => t.pnl > 0).length;
    const losers = trades.filter((t) => t.pnl <= 0).length;
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = total > 0 ? (winners / total) * 100 : 0;

    const bySymbol = {};
    trades.forEach((t) => {
      if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { trades: 0, pnl: 0, wins: 0 };
      bySymbol[t.symbol].trades++;
      bySymbol[t.symbol].pnl += t.pnl;
      if (t.pnl > 0) bySymbol[t.symbol].wins++;
    });

    // Monthly PnL
    const monthly = {};
    trades.forEach((t) => {
      const key = t.closedAt
        ? `${t.closedAt.getFullYear()}-${String(t.closedAt.getMonth() + 1).padStart(2, '0')}`
        : 'unknown';
      if (!monthly[key]) monthly[key] = 0;
      monthly[key] += t.pnl;
    });

    const user = await User.findById(req.user._id);

    res.json({
      total,
      winners,
      losers,
      winRate: parseFloat(winRate.toFixed(2)),
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      balance: user.balance,
      bySymbol,
      monthly,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};