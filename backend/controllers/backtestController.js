const binanceService = require('../services/binanceService');
const { backtestStrategy, buildEquityCurve } = require('../services/backtestService');

exports.runBacktest = async (req, res) => {
  try {
    const {
      symbol = 'BTCUSDT',
      interval = '1h',
      strategy = 'RSI_MA',
      rsiOversold = 30,
      rsiOverbought = 70,
      takeProfitPct = 0.05,
      stopLossPct = 0.03,
      initialCapital = 10000,
      limit = 500,
    } = req.body;

    const klines = await binanceService.getKlines(symbol.toUpperCase(), interval, parseInt(limit));

    if (!klines || klines.length < 100) {
      return res.status(400).json({ error: 'Insufficient data for backtesting' });
    }

    const result = backtestStrategy(klines, {
      rsiOversold: parseFloat(rsiOversold),
      rsiOverbought: parseFloat(rsiOverbought),
      takeProfitPct: parseFloat(takeProfitPct),
      stopLossPct: parseFloat(stopLossPct),
      initialCapital: parseFloat(initialCapital),
      strategy,
    });

    const equityCurve = buildEquityCurve(result.trades, parseFloat(initialCapital));

    res.json({ ...result, equityCurve, symbol, interval });
  } catch (error) {
    console.error('runBacktest error:', error);
    res.status(500).json({ error: 'Backtesting failed: ' + error.message });
  }
};