const jwt = require('jsonwebtoken');
const { subscribeMulti, subscribeKline } = require('../services/binanceService');

const DEFAULT_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
];

let multiStreamWS = null;
const klineStreams = new Map();

const socketHandler = (io) => {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join user's personal room for notifications
    socket.join(`user_${socket.userId}`);

    // ── Start global multi-stream ticker ──────────────────────────────────────
    if (!multiStreamWS || multiStreamWS.readyState > 1) {
      multiStreamWS = subscribeMulti(DEFAULT_SYMBOLS, (tickerData) => {
        io.emit('ticker_update', tickerData);
      });
    }

    // ── Subscribe to kline stream ─────────────────────────────────────────────
    socket.on('subscribe_kline', ({ symbol, interval }) => {
      const key = `${symbol}_${interval}`;
      socket.join(`kline_${key}`);

      if (!klineStreams.has(key)) {
        const ws = subscribeKline(symbol, interval, (kline) => {
          io.to(`kline_${key}`).emit('kline_update', { symbol, interval, kline });
        });
        klineStreams.set(key, { ws, subscribers: 1 });
      } else {
        klineStreams.get(key).subscribers++;
      }
    });

    // ── Unsubscribe from kline stream ─────────────────────────────────────────
    socket.on('unsubscribe_kline', ({ symbol, interval }) => {
      const key = `${symbol}_${interval}`;
      socket.leave(`kline_${key}`);

      if (klineStreams.has(key)) {
        const stream = klineStreams.get(key);
        stream.subscribers--;
        if (stream.subscribers <= 0) {
          stream.ws.close();
          klineStreams.delete(key);
        }
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;