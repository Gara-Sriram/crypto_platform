const mongoose = require('mongoose');

const agentOpinionSchema = new mongoose.Schema({
  agentName: String,
  strategy: String,
  opinion: String,
  recommendation: { type: String, enum: ['BUY', 'SELL', 'HOLD'] },
  confidence: Number,
}, { _id: false });

const signalSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  action: { type: String, enum: ['BUY', 'SELL', 'HOLD'], required: true },
  entryPrice: { type: Number, required: true },
  takeProfit: { type: Number },
  stopLoss: { type: Number },
  confidence: { type: Number, min: 0, max: 100 },
  reasoning: { type: String },
  agentDiscussions: [agentOpinionSchema],
  judgeVerdict: { type: String },
  indicators: {
    rsi: Number,
    macd: Number,
    macdSignal: Number,
    ma20: Number,
    ma50: Number,
    volume: Number,
  },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  status: { type: String, enum: ['ACTIVE', 'TP_HIT', 'SL_HIT', 'EXPIRED'], default: 'ACTIVE' },
  actualResult: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

module.exports = mongoose.model('Signal', signalSchema);