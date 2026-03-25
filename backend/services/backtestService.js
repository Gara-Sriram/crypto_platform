const { computeAllIndicators, interpretSignals } = require('./technicalIndicators');

/**
 * Backtesting Engine
 * Tests trading strategies against historical kline data
 */

// ─── Simple strategy: indicator-based ────────────────────────────────────────
const backtestStrategy = (klines, config = {}) => {
  const {
    rsiOversold = 30,
    rsiOverbought = 70,
    takeProfitPct = 0.05,     // 5%
    stopLossPct = 0.03,        // 3%
    initialCapital = 10000,
    strategy = 'RSI_MA',
  } = config;

  const trades = [];
  let capital = initialCapital;
  let position = null;
  let peak = initialCapital;
  let maxDrawdown = 0;

  // We need at least 200 candles for MA200
  const startIdx = Math.max(50, klines.length - 500);

  for (let i = startIdx; i < klines.length; i++) {
    const slice = klines.slice(0, i + 1);
    const ind = computeAllIndicators(slice);
    const candle = klines[i];

    // Check if in position → check TP/SL
    if (position) {
      const currentPrice = candle.close;
      let closed = false;
      let exitReason = '';
      let exitPrice = currentPrice;

      if (position.type === 'LONG') {
        if (currentPrice >= position.tp) {
          exitPrice = position.tp;
          exitReason = 'TP_HIT';
          closed = true;
        } else if (currentPrice <= position.sl) {
          exitPrice = position.sl;
          exitReason = 'SL_HIT';
          closed = true;
        }
      } else {
        if (currentPrice <= position.tp) {
          exitPrice = position.tp;
          exitReason = 'TP_HIT';
          closed = true;
        } else if (currentPrice >= position.sl) {
          exitPrice = position.sl;
          exitReason = 'SL_HIT';
          closed = true;
        }
      }

      if (closed) {
        const pnl = position.type === 'LONG'
          ? (exitPrice - position.entry) * position.qty
          : (position.entry - exitPrice) * position.qty;

        capital += pnl;
        if (capital > peak) peak = capital;
        const drawdown = (peak - capital) / peak * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;

        trades.push({
          type: position.type,
          entry: position.entry,
          exit: exitPrice,
          tp: position.tp,
          sl: position.sl,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPct: parseFloat(((pnl / (position.entry * position.qty)) * 100).toFixed(2)),
          exitReason,
          entryTime: position.entryTime,
          exitTime: candle.time,
          capital: parseFloat(capital.toFixed(2)),
        });
        position = null;
      }
    }

    // No position → check for signal
    if (!position && ind.rsi && ind.ma20 && ind.ma50) {
      let signal = null;

      if (strategy === 'RSI_MA') {
        // Buy: RSI oversold + price above MA50
        if (ind.rsi < rsiOversold && candle.close > ind.ma50) {
          signal = 'LONG';
        }
        // Sell: RSI overbought + price below MA50
        else if (ind.rsi > rsiOverbought && candle.close < ind.ma50) {
          signal = 'SHORT';
        }
      } else if (strategy === 'MACD_CROSSOVER') {
        if (ind.macd > ind.macdSignal && ind.macdHistogram > 0 && ind.ma20 > ind.ma50) {
          signal = 'LONG';
        } else if (ind.macd < ind.macdSignal && ind.macdHistogram < 0 && ind.ma20 < ind.ma50) {
          signal = 'SHORT';
        }
      } else if (strategy === 'MA_CROSSOVER') {
        const prevSlice = klines.slice(0, i);
        if (prevSlice.length > 50) {
          const prevInd = computeAllIndicators(prevSlice);
          if (prevInd.ma20 < prevInd.ma50 && ind.ma20 > ind.ma50) signal = 'LONG';
          else if (prevInd.ma20 > prevInd.ma50 && ind.ma20 < ind.ma50) signal = 'SHORT';
        }
      }

      if (signal) {
        const entryPrice = candle.close;
        const positionSize = capital * 0.95; // Use 95% of capital
        const qty = positionSize / entryPrice;

        position = {
          type: signal,
          entry: entryPrice,
          qty,
          tp: signal === 'LONG'
            ? entryPrice * (1 + takeProfitPct)
            : entryPrice * (1 - takeProfitPct),
          sl: signal === 'LONG'
            ? entryPrice * (1 - stopLossPct)
            : entryPrice * (1 + stopLossPct),
          entryTime: candle.time,
        };
      }
    }
  }

  // Calculate stats
  const winners = trades.filter((t) => t.pnl > 0);
  const losers = trades.filter((t) => t.pnl <= 0);
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = trades.length > 0 ? (winners.length / trades.length) * 100 : 0;
  const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

  return {
    strategy,
    config,
    summary: {
      initialCapital,
      finalCapital: parseFloat(capital.toFixed(2)),
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      totalReturn: parseFloat(((capital - initialCapital) / initialCapital * 100).toFixed(2)),
      totalTrades: trades.length,
      winners: winners.length,
      losers: losers.length,
      winRate: parseFloat(winRate.toFixed(2)),
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    },
    trades,
  };
};

// ─── Equity curve from trades ────────────────────────────────────────────────
const buildEquityCurve = (trades, initialCapital) => {
  let equity = initialCapital;
  return trades.map((t) => {
    equity = t.capital;
    return { time: t.exitTime, equity: parseFloat(equity.toFixed(2)) };
  });
};

module.exports = { backtestStrategy, buildEquityCurve };