const binanceService = require('../services/binanceService');
const { computeAllIndicators } = require('../services/technicalIndicators');

const DEFAULT_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
];

exports.getDashboard = async (req, res) => {
  try {
    const symbols = req.query.symbols
      ? req.query.symbols.split(',')
      : DEFAULT_SYMBOLS;

    const tickers = await binanceService.getMultipleTickers(symbols);
    res.json(tickers);
  } catch (error) {
    console.error('getDashboard error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

exports.getTicker = async (req, res) => {
  try {
    const { symbol } = req.params;
    const ticker = await binanceService.get24hTicker(symbol.toUpperCase());
    res.json(ticker);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticker' });
  }
};

exports.getKlines = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 200 } = req.query;
    const klines = await binanceService.getKlines(symbol.toUpperCase(), interval, parseInt(limit));
    res.json(klines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch klines' });
  }
};

exports.getIndicators = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h' } = req.query;
    const klines = await binanceService.getKlines(symbol.toUpperCase(), interval, 200);
    const indicators = computeAllIndicators(klines);
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute indicators' });
  }
};

exports.getOrderBook = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20 } = req.query;
    const orderBook = await binanceService.getOrderBook(symbol.toUpperCase(), parseInt(limit));
    res.json(orderBook);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order book' });
  }
};

exports.getRecentTrades = async (req, res) => {
  try {
    const { symbol } = req.params;
    const trades = await binanceService.getRecentTrades(symbol.toUpperCase());
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent trades' });
  }
};

exports.getDefaultSymbols = async (req, res) => {
  res.json(DEFAULT_SYMBOLS);
};