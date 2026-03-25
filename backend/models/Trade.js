const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true }, // e.g. BTCUSDT
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number, default: null },
  quantity: { type: Number, required: true },
  amount: { type: Number, required: true }, // entryPrice * quantity
  takeProfit: { type: Number },
  stopLoss: { type: Number },
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'TP_HIT', 'SL_HIT'],
    default: 'OPEN',
  },
  pnl: { type: Number, default: 0 },
  pnlPercent: { type: Number, default: 0 },
  closedAt: { type: Date },
  note: { type: String, default: '' },
  signalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signal' },
  createdAt: { type: Date, default: Date.now },
});

// Virtual: current P&L helper (used server-side)
tradeSchema.methods.calculatePnL = function (currentPrice) {
  if (this.type === 'BUY') {
    this.pnl = (currentPrice - this.entryPrice) * this.quantity;
  } else {
    this.pnl = (this.entryPrice - currentPrice) * this.quantity;
  }
  this.pnlPercent = (this.pnl / this.amount) * 100;
  return this.pnl;
};

module.exports = mongoose.model('Trade', tradeSchema);