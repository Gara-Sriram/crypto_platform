const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  symbols: [{ type: String, uppercase: true, trim: true }],
  updatedAt: { type: Date, default: Date.now },
});

watchlistSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Watchlist', watchlistSchema);
