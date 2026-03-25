const WebSocket = require('ws');
const axios = require('axios');

const BINANCE_REST = 'https://api.binance.com/api/v3';
const BINANCE_WS = 'wss://stream.binance.com:9443';

// Active WebSocket connections
const connections = new Map();

// ─── REST: Get current price ────────────────────────────────────────────────
const getPrice = async (symbol) => {
  const { data } = await axios.get(`${BINANCE_REST}/ticker/price?symbol=${symbol}`);
  return parseFloat(data.price);
};

// ─── REST: Get 24h ticker stats ─────────────────────────────────────────────
const get24hTicker = async (symbol) => {
  const { data } = await axios.get(`${BINANCE_REST}/ticker/24hr?symbol=${symbol}`);
  return {
    symbol: data.symbol,
    price: parseFloat(data.lastPrice),
    change: parseFloat(data.priceChange),
    changePercent: parseFloat(data.priceChangePercent),
    high: parseFloat(data.highPrice),
    low: parseFloat(data.lowPrice),
    volume: parseFloat(data.volume),
    quoteVolume: parseFloat(data.quoteVolume),
  };
};

// ─── REST: Get multiple tickers ─────────────────────────────────────────────
const getMultipleTickers = async (symbols) => {
  try {
    const promises = symbols.map((s) => get24hTicker(s));
    return await Promise.all(promises);
  } catch (error) {
    console.error('getMultipleTickers error:', error.message);
    return [];
  }
};

// ─── REST: Get Kline/Candlestick data ───────────────────────────────────────
const getKlines = async (symbol, interval = '1h', limit = 100) => {
  const { data } = await axios.get(
    `${BINANCE_REST}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  return data.map(([
    openTime, open, high, low, close, volume,
    closeTime, quoteVolume, trades,
  ]) => ({
    time: Math.floor(openTime / 1000),
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close),
    volume: parseFloat(volume),
  }));
};

// ─── REST: Get order book depth ─────────────────────────────────────────────
const getOrderBook = async (symbol, limit = 20) => {
  const { data } = await axios.get(`${BINANCE_REST}/depth?symbol=${symbol}&limit=${limit}`);
  return {
    bids: data.bids.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) })),
    asks: data.asks.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) })),
  };
};

// ─── REST: Get recent trades ─────────────────────────────────────────────────
const getRecentTrades = async (symbol, limit = 20) => {
  const { data } = await axios.get(`${BINANCE_REST}/trades?symbol=${symbol}&limit=${limit}`);
  return data.map((t) => ({
    id: t.id,
    price: parseFloat(t.price),
    qty: parseFloat(t.qty),
    time: t.time,
    isBuyerMaker: t.isBuyerMaker,
  }));
};

// ─── WebSocket: Subscribe to ticker stream ───────────────────────────────────
const subscribeTicker = (symbol, onData, onError) => {
  const stream = `${symbol.toLowerCase()}@ticker`;
  const wsUrl = `${BINANCE_WS}/ws/${stream}`;

  if (connections.has(stream)) {
    connections.get(stream).close();
  }

  const ws = new WebSocket(wsUrl);

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      onData({
        symbol: data.s,
        price: parseFloat(data.c),
        change: parseFloat(data.p),
        changePercent: parseFloat(data.P),
        high: parseFloat(data.h),
        low: parseFloat(data.l),
        volume: parseFloat(data.v),
        quoteVolume: parseFloat(data.q),
      });
    } catch (e) {
      console.error('WS parse error:', e.message);
    }
  });

  ws.on('error', (err) => {
    console.error(`WS error for ${symbol}:`, err.message);
    if (onError) onError(err);
  });

  ws.on('close', () => {
    connections.delete(stream);
  });

  connections.set(stream, ws);
  return ws;
};

// ─── WebSocket: Subscribe to kline stream ────────────────────────────────────
const subscribeKline = (symbol, interval, onData) => {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  const wsUrl = `${BINANCE_WS}/ws/${stream}`;

  if (connections.has(stream)) {
    connections.get(stream).close();
  }

  const ws = new WebSocket(wsUrl);

  ws.on('message', (raw) => {
    try {
      const { k } = JSON.parse(raw);
      onData({
        time: Math.floor(k.t / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
        isFinal: k.x,
      });
    } catch (e) {
      console.error('Kline WS parse error:', e.message);
    }
  });

  ws.on('error', (err) => console.error(`Kline WS error ${symbol}:`, err.message));
  ws.on('close', () => connections.delete(stream));

  connections.set(stream, ws);
  return ws;
};

// ─── WebSocket: Multi-stream combined ────────────────────────────────────────
const subscribeMulti = (symbols, onData) => {
  const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join('/');
  const wsUrl = `${BINANCE_WS}/stream?streams=${streams}`;

  const ws = new WebSocket(wsUrl);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      const data = msg.data;
      onData({
        symbol: data.s,
        price: parseFloat(data.c),
        change: parseFloat(data.p),
        changePercent: parseFloat(data.P),
        high: parseFloat(data.h),
        low: parseFloat(data.l),
        volume: parseFloat(data.v),
      });
    } catch (e) {
      console.error('Multi-stream parse error:', e.message);
    }
  });

  ws.on('error', (err) => console.error('Multi WS error:', err.message));

  return ws;
};

// ─── Close all connections ────────────────────────────────────────────────────
const closeAll = () => {
  for (const [key, ws] of connections.entries()) {
    ws.close();
    connections.delete(key);
  }
};

module.exports = {
  getPrice,
  get24hTicker,
  getMultipleTickers,
  getKlines,
  getOrderBook,
  getRecentTrades,
  subscribeTicker,
  subscribeKline,
  subscribeMulti,
  closeAll,
};