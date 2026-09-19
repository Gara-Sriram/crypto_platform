# CryptoNex 🚀

A full-stack AI-powered crypto paper trading platform with real-time market data, multi-agent trading signals, backtesting, and live portfolio analytics.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Live Dashboard** | Real-time prices for top 10 coins via Binance WebSocket |
| 🤖 **AI Signals** | Multi-agent system (Conservative + Aggressive + Technical) judged by an LLM |
| 📈 **Paper Trading** | Simulated BUY/SELL trades with a $100,000 starting balance |
| 🔬 **Backtesting** | RSI + MA strategy backtester with equity curve visualization |
| 📉 **Analytics** | Win rate, P&L breakdown by coin, monthly performance charts |
| 👁 **Watchlist** | Track up to 20 custom coins with live price feeds |
| 🔔 **Notifications** | Real-time alerts via Socket.IO + email (signal & trade events) |
| 🔐 **OTP Auth** | Email-based OTP login/register — no passwords required |

---

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js v24 + Express v5
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.IO + Binance WebSocket streams
- **AI:** Groq SDK (`llama-3.3-70b-versatile`) — multi-agent analysis
- **Auth:** JWT + bcryptjs + Nodemailer OTP
- **Market Data:** Binance REST API + WebSocket

### Frontend
- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4 + custom design system
- **Charts:** Lightweight Charts (TradingView) + Recharts
- **Icons:** Lucide React
- **State:** React Context (Auth + Socket)
- **HTTP:** Axios with JWT interceptor

---

## 📂 Project Structure

```
crypto_platform/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── email.js            # Email transporter config
│   ├── controllers/
│   │   ├── authController.js   # OTP send/verify, login, profile
│   │   ├── backtestController.js
│   │   ├── cryptoController.js
│   │   ├── notificationController.js
│   │   ├── signalController.js
│   │   ├── tradeController.js
│   │   └── watchlistController.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── models/
│   │   ├── Notification.js
│   │   ├── Signal.js
│   │   ├── Trade.js
│   │   ├── User.js
│   │   └── Watchlist.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── backtest.js
│   │   ├── crypto.js
│   │   ├── notifications.js
│   │   ├── signals.js
│   │   ├── trades.js
│   │   └── watchlist.js
│   ├── services/
│   │   ├── aiAgentService.js      # Multi-agent LLM signal generation
│   │   ├── backtestService.js     # RSI+MA strategy backtester
│   │   ├── binanceService.js      # REST + WebSocket Binance client
│   │   ├── emailService.js        # OTP & signal alert emails
│   │   └── technicalIndicators.js # RSI, MACD, MA computations
│   ├── socket/
│   │   └── socketHandler.js       # Socket.IO auth + stream routing
│   ├── .env                       # Environment variables (not committed)
│   ├── package.json
│   └── server.js                  # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js           # Axios instance + interceptors
    │   ├── components/
    │   │   ├── Auth/              # Login & Register components
    │   │   ├── Layout/            # Sidebar, Navbar, Shell
    │   │   └── Notifications/     # Notification panel
    │   ├── context/
    │   │   ├── AuthContext.jsx    # User auth state
    │   │   └── SocketContext.jsx  # Socket.IO + live ticker state
    │   ├── pages/
    │   │   ├── AnalyticsPage.jsx
    │   │   ├── BacktestPage.jsx
    │   │   ├── CryptoDetailPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── SignalsPage.jsx
    │   │   ├── TradesPage.jsx
    │   │   └── WatchlistPage.jsx
    │   ├── styles/
    │   │   └── globals.css        # Tailwind v4 theme + utility classes
    │   ├── App.jsx                # Routes + providers
    │   └── main.jsx               # React entry point
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Groq API key → [console.groq.com](https://console.groq.com)
- Gmail account (for OTP emails)

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd crypto_platform
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cryptonex

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

OTP_EXPIRE=10
FRONTEND_URL=http://localhost:5173
```

> **Gmail App Password:** Go to Google Account → Security → 2FA → App Passwords → generate one for "Mail".

Start the backend:
```bash
npm start
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Send OTP to email |
| `POST` | `/api/auth/verify-otp` | Verify OTP, get JWT |
| `POST` | `/api/auth/login` | Password login (fallback) |
| `GET` | `/api/auth/profile` | Get current user |
| `PUT` | `/api/auth/profile` | Update profile |

### Crypto
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/crypto/dashboard` | Top coins + market overview |
| `GET` | `/api/crypto/ticker/:symbol` | 24h stats for a coin |
| `GET` | `/api/crypto/klines/:symbol` | Candlestick OHLCV data |
| `GET` | `/api/crypto/orderbook/:symbol` | Order book depth |

### Signals
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/signals/generate` | Run multi-agent AI analysis |
| `GET` | `/api/signals` | List all signals |
| `GET` | `/api/signals/:id` | Single signal detail |

### Trades
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trades/open` | Open a paper trade |
| `PUT` | `/api/trades/:id/close` | Close a trade |
| `GET` | `/api/trades` | List trades (filter by status) |
| `GET` | `/api/trades/analytics` | Win rate, P&L, stats |

### Watchlist
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/watchlist` | Get watchlist with live prices |
| `POST` | `/api/watchlist` | Add a symbol |
| `DELETE` | `/api/watchlist/:symbol` | Remove a symbol |

### Backtest
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/backtest/run` | Run RSI+MA backtest |

---

## 🔄 Real-time Events (Socket.IO)

Connect with JWT token in `socket.handshake.auth.token`.

| Event | Direction | Description |
|---|---|---|
| `ticker_update` | Server → Client | Live price tick for watched coins |
| `kline_update` | Server → Client | New candlestick from Binance stream |
| `notification` | Server → Client | Trade closed / signal alert |
| `trade_update` | Server → Client | Balance update after trade |
| `new_signal` | Server → Client | New AI signal generated |
| `subscribe_kline` | Client → Server | Start kline stream for `{symbol, interval}` |
| `unsubscribe_kline` | Client → Server | Stop kline stream |

---

## 🤖 AI Signal System

Signals are generated by a **multi-agent debate** system:

```
Market Data + Technical Indicators
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
Conservative  Aggressive  Technical
  Agent       Agent       Agent
    └──────┬──────┘
           ▼
         Judge
      (Final Decision)
           │
     BUY / SELL / HOLD
```

Each agent returns `{ recommendation, confidence, entry, tp, sl }`. The Judge weighs all three opinions and emits the final signal with an entry price, take profit, and stop loss.

---

## 🧪 Backtesting

The backtester replays historical Binance klines with the following strategy:

- **Buy signal:** RSI < `rsiOversold` AND price > MA20
- **Sell signal:** RSI > `rsiOverbought` OR price < MA20
- **Exit:** Take profit % or stop loss % hit

Returns: total trades, win rate, total P&L, max drawdown, and a full equity curve.

---

## 🛡️ Environment Notes

- All protected routes require `Authorization: Bearer <token>` header
- Paper trading uses a **simulated $100,000 balance** — no real money
- Rate limiting: 200 requests per 15 minutes per IP on `/api/*`
- CORS: All `localhost` origins are allowed in development

---

## 📝 License

MIT
