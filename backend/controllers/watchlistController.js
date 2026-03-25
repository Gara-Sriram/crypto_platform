const User = require('../models/User');
const binanceService = require('../services/binanceService');

exports.getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('watchlist');
    if (!user.watchlist || user.watchlist.length === 0) return res.json([]);

    const tickers = await binanceService.getMultipleTickers(user.watchlist);
    res.json(tickers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
};

exports.addToWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    const user = await User.findById(req.user._id);
    if (user.watchlist.includes(symbol.toUpperCase())) {
      return res.status(400).json({ error: 'Symbol already in watchlist' });
    }
    if (user.watchlist.length >= 20) {
      return res.status(400).json({ error: 'Watchlist limit reached (20 max)' });
    }

    user.watchlist.push(symbol.toUpperCase());
    await user.save();
    res.json({ watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.params;
    const user = await User.findById(req.user._id);
    user.watchlist = user.watchlist.filter((s) => s !== symbol.toUpperCase());
    await user.save();
    res.json({ watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};