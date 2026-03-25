/**
 * Technical Indicators Service
 * Implements RSI, MACD, Moving Averages, Bollinger Bands
 */

// ─── Simple Moving Average ────────────────────────────────────────────────────
const SMA = (data, period) => {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
};

// ─── Exponential Moving Average ──────────────────────────────────────────────
const EMA = (data, period) => {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
};

// ─── EMA Array (full series) ──────────────────────────────────────────────────
const EMAArray = (data, period) => {
  const result = [];
  if (data.length < period) return result;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  result.push(ema);
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
};

// ─── RSI ─────────────────────────────────────────────────────────────────────
const RSI = (closes, period = 14) => {
  if (closes.length < period + 1) return null;

  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));

  let avgGain = gains.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, v) => sum + v, 0) / period;

  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

// ─── MACD ────────────────────────────────────────────────────────────────────
const MACD = (closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (closes.length < slowPeriod + signalPeriod) return null;

  const fastEMA = EMAArray(closes, fastPeriod);
  const slowEMA = EMAArray(closes, slowPeriod);

  // Align arrays (fastEMA is longer)
  const diff = fastPeriod - slowPeriod; // negative
  const macdLine = slowEMA.map((slow, i) => fastEMA[i + (fastEMA.length - slowEMA.length)] - slow);

  if (macdLine.length < signalPeriod) return null;

  const signal = EMA(macdLine, signalPeriod);
  const histogram = macdLine[macdLine.length - 1] - signal;

  return {
    macd: macdLine[macdLine.length - 1],
    signal,
    histogram,
  };
};

// ─── Bollinger Bands ─────────────────────────────────────────────────────────
const BollingerBands = (closes, period = 20, stdDevMultiplier = 2) => {
  if (closes.length < period) return null;

  const slice = closes.slice(-period);
  const middle = slice.reduce((sum, v) => sum + v, 0) / period;
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: middle + stdDevMultiplier * stdDev,
    middle,
    lower: middle - stdDevMultiplier * stdDev,
    bandwidth: (stdDevMultiplier * 2 * stdDev) / middle,
  };
};

// ─── ATR (Average True Range) ─────────────────────────────────────────────────
const ATR = (highs, lows, closes, period = 14) => {
  if (closes.length < period + 1) return null;

  const trueRanges = closes.slice(1).map((close, i) => {
    const high = highs[i + 1];
    const low = lows[i + 1];
    const prevClose = closes[i];
    return Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  });

  return SMA(trueRanges, period);
};

// ─── Compute all indicators from kline data ───────────────────────────────────
const computeAllIndicators = (klines) => {
  const closes = klines.map((k) => k.close);
  const highs = klines.map((k) => k.high);
  const lows = klines.map((k) => k.low);
  const volumes = klines.map((k) => k.volume);

  const rsi = RSI(closes, 14);
  const macdResult = MACD(closes);
  const bb = BollingerBands(closes, 20);
  const atr = ATR(highs, lows, closes, 14);
  const ma20 = SMA(closes, 20);
  const ma50 = SMA(closes, 50);
  const ma200 = SMA(closes, 200);
  const ema9 = EMA(closes, 9);
  const ema21 = EMA(closes, 21);
  const avgVolume = SMA(volumes, 20);
  const currentVolume = volumes[volumes.length - 1];

  const currentPrice = closes[closes.length - 1];

  return {
    price: currentPrice,
    rsi: rsi ? parseFloat(rsi.toFixed(2)) : null,
    macd: macdResult ? parseFloat(macdResult.macd.toFixed(4)) : null,
    macdSignal: macdResult ? parseFloat(macdResult.signal.toFixed(4)) : null,
    macdHistogram: macdResult ? parseFloat(macdResult.histogram.toFixed(4)) : null,
    ma20: ma20 ? parseFloat(ma20.toFixed(2)) : null,
    ma50: ma50 ? parseFloat(ma50.toFixed(2)) : null,
    ma200: ma200 ? parseFloat(ma200.toFixed(2)) : null,
    ema9: ema9 ? parseFloat(ema9.toFixed(2)) : null,
    ema21: ema21 ? parseFloat(ema21.toFixed(2)) : null,
    bbUpper: bb ? parseFloat(bb.upper.toFixed(2)) : null,
    bbMiddle: bb ? parseFloat(bb.middle.toFixed(2)) : null,
    bbLower: bb ? parseFloat(bb.lower.toFixed(2)) : null,
    bbBandwidth: bb ? parseFloat(bb.bandwidth.toFixed(4)) : null,
    atr: atr ? parseFloat(atr.toFixed(4)) : null,
    volume: currentVolume,
    avgVolume: avgVolume ? parseFloat(avgVolume.toFixed(2)) : null,
    volumeRatio: avgVolume ? parseFloat((currentVolume / avgVolume).toFixed(2)) : null,
  };
};

// ─── Signal interpretation ────────────────────────────────────────────────────
const interpretSignals = (indicators) => {
  const signals = [];
  let bullCount = 0, bearCount = 0;

  if (indicators.rsi !== null) {
    if (indicators.rsi < 30) { signals.push('RSI oversold (bullish)'); bullCount++; }
    else if (indicators.rsi > 70) { signals.push('RSI overbought (bearish)'); bearCount++; }
    else if (indicators.rsi > 50) { signals.push('RSI above midline (bullish bias)'); bullCount += 0.5; }
    else { signals.push('RSI below midline (bearish bias)'); bearCount += 0.5; }
  }

  if (indicators.macd !== null && indicators.macdSignal !== null) {
    if (indicators.macd > indicators.macdSignal) { signals.push('MACD bullish crossover'); bullCount++; }
    else { signals.push('MACD bearish crossover'); bearCount++; }
    if (indicators.macdHistogram > 0) { signals.push('MACD histogram positive'); bullCount += 0.5; }
    else { signals.push('MACD histogram negative'); bearCount += 0.5; }
  }

  if (indicators.ma20 && indicators.ma50) {
    if (indicators.ma20 > indicators.ma50) { signals.push('MA20 above MA50 (golden cross bias)'); bullCount++; }
    else { signals.push('MA20 below MA50 (death cross bias)'); bearCount++; }
  }

  if (indicators.price && indicators.ma200) {
    if (indicators.price > indicators.ma200) { signals.push('Price above MA200 (bull market)'); bullCount++; }
    else { signals.push('Price below MA200 (bear market)'); bearCount++; }
  }

  if (indicators.volumeRatio && indicators.volumeRatio > 1.5) {
    signals.push('High volume confirmation');
    bullCount += 0.5;
  }

  const total = bullCount + bearCount;
  const bullishScore = total > 0 ? (bullCount / total) * 100 : 50;
  const direction = bullishScore > 60 ? 'BUY' : bullishScore < 40 ? 'SELL' : 'HOLD';

  return { signals, direction, bullishScore: parseFloat(bullishScore.toFixed(1)) };
};

module.exports = {
  SMA, EMA, EMAArray, RSI, MACD, BollingerBands, ATR,
  computeAllIndicators,
  interpretSignals,
};