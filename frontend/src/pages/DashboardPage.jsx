import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

const CryptoCard = ({ ticker, onClick }) => {
  const isPositive = Number(ticker.changePercent) >= 0;

  return (
    <div onClick={onClick} className="card-hover cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-display font-bold text-base">
            {ticker.symbol?.replace('USDT', '')}
          </p>
          <p className="text-xs text-slate-500">{ticker.symbol}</p>
        </div>

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isPositive ? 'bg-success/15' : 'bg-danger/15'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-danger" />
          )}
        </div>
      </div>

      <p className="text-xl font-mono font-bold">
        $
        {Number(ticker.price || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })}
      </p>

      <div className="flex items-center justify-between mt-2">
        <span
          className={`text-sm font-semibold ${
            isPositive ? 'text-success' : 'text-danger'
          }`}
        >
          {isPositive ? '+' : ''}
          {Number(ticker.changePercent || 0).toFixed(2)}%
        </span>

        <span className="text-xs text-slate-500">
          Vol: {((ticker.quoteVolume || 0) / 1e6).toFixed(1)}M
        </span>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { tickerData } = useSocket();

  const [tickers, setTickers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/crypto/dashboard');

      // 🔥 FIX: ensure it's always an array
      const safeData = Array.isArray(data) ? data : Object.values(data || {});
      setTickers(safeData);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // 🔥 SAFE ARRAY
  const safeTickers = Array.isArray(tickers) ? tickers : [];

  // 🔥 Merge socket updates safely
  const mergedTickers = safeTickers.map((t) =>
    tickerData?.[t.symbol]
      ? { ...t, ...tickerData[t.symbol] }
      : t
  );

  const totalMarketChange =
    mergedTickers.length > 0
      ? mergedTickers.reduce(
          (sum, t) => sum + Number(t.changePercent || 0),
          0
        ) / mergedTickers.length
      : 0;

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      <main className="pt-16 max-w-[1400px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">
              Market Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Live cryptocurrency prices via Binance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border ${
                totalMarketChange >= 0
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-danger/10 border-danger/30 text-danger'
              }`}
            >
              <Activity className="w-4 h-4" />
              Market {totalMarketChange >= 0 ? '+' : ''}
              {totalMarketChange.toFixed(2)}%
            </div>

            <button
              onClick={fetchDashboard}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-32 bg-dark-600" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {mergedTickers.map((ticker) => (
              <CryptoCard
                key={ticker.symbol}
                ticker={ticker}
                onClick={() => navigate(`/crypto/${ticker.symbol}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}