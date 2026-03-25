import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Star, Zap } from 'lucide-react';
import { createChart, CandlestickSeries, AreaSeries } from 'lightweight-charts';
import Navbar from '../components/Layout/Navbar';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export default function CryptoDetailPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const candleSeries = useRef(null);
  const [ticker, setTicker] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [interval, setInterval] = useState('1h');
  const [chartType, setChartType] = useState('candlestick');
  const [inWatchlist, setInWatchlist] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = createChart(chartRef.current, {
      layout: { background: { color: '#0d0d1a' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e1e3a' }, horzLines: { color: '#1e1e3a' } },
      crosshair: { mode: 1 },
      timeScale: { borderColor: '#2d2d4a', timeVisible: true },
      rightPriceScale: { borderColor: '#2d2d4a' },
      width: chartRef.current.clientWidth,
      height: 400,
    });

    const resizer = new ResizeObserver(() => {
      chartInstance.current?.applyOptions({ width: chartRef.current?.clientWidth });
    });
    resizer.observe(chartRef.current);

    return () => {
      resizer.disconnect();
      chartInstance.current?.remove();
    };
  }, []);

  // Load klines & draw chart
  useEffect(() => {
    const loadChart = async () => {
      try {
        const { data: klines } = await api.get(`/crypto/klines/${symbol}?interval=${interval}&limit=200`);
        if (!chartInstance.current) return;

        if (candleSeries.current) { chartInstance.current.removeSeries(candleSeries.current); }

        if (chartType === 'candlestick') {
  candleSeries.current = chartInstance.current.addSeries(CandlestickSeries, {
            upColor: '#10b981', downColor: '#ef4444',
            borderUpColor: '#10b981', borderDownColor: '#ef4444',
            wickUpColor: '#10b981', wickDownColor: '#ef4444',
          });
        } else {
          candleSeries.current = chartInstance.current.addSeries(AreaSeries, {
            lineColor: '#7c3aed', topColor: '#7c3aed30', bottomColor: '#7c3aed00', lineWidth: 2,
          });
        }

        const formatted = chartType === 'candlestick'
          ? klines.map((k) => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close }))
          : klines.map((k) => ({ time: k.time, value: k.close }));

        candleSeries.current.setData(formatted);
        chartInstance.current.timeScale().fitContent();
      } catch (e) { console.error('Chart load error:', e); }
    };
    loadChart();
  }, [symbol, interval, chartType]);

  // Load ticker & indicators
  useEffect(() => {
    api.get(`/crypto/ticker/${symbol}`).then(({ data }) => setTicker(data)).catch(console.error);
    api.get(`/crypto/indicators/${symbol}?interval=${interval}`).then(({ data }) => setIndicators(data)).catch(console.error);
  }, [symbol, interval]);

  // Live kline updates
  useEffect(() => {
    if (!socket) return;
    socket.emit('subscribe_kline', { symbol, interval });
    socket.on('kline_update', ({ kline }) => {
      if (!candleSeries.current) return;
      const point = chartType === 'candlestick'
        ? { time: kline.time, open: kline.open, high: kline.high, low: kline.low, close: kline.close }
        : { time: kline.time, value: kline.close };
      candleSeries.current.update(point);
    });
    return () => {
      socket.emit('unsubscribe_kline', { symbol, interval });
      socket.off('kline_update');
    };
  }, [socket, symbol, interval, chartType]);

  const toggleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${symbol}`);
        setInWatchlist(false);
        toast.success('Removed from watchlist');
      } else {
        await api.post('/watchlist', { symbol });
        setInWatchlist(true);
        toast.success('Added to watchlist');
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const isPos = ticker ? ticker.changePercent >= 0 : true;

  const indicatorItems = indicators ? [
    { label: 'RSI (14)', value: indicators.rsi?.toFixed(2), status: indicators.rsi < 30 ? '🟢 Oversold' : indicators.rsi > 70 ? '🔴 Overbought' : '🟡 Neutral' },
    { label: 'MACD', value: indicators.macd?.toFixed(4), status: indicators.macd > indicators.macdSignal ? '🟢 Bullish' : '🔴 Bearish' },
    { label: 'MA 20', value: `$${indicators.ma20?.toFixed(2)}`, status: indicators.price > indicators.ma20 ? '🟢 Above' : '🔴 Below' },
    { label: 'MA 50', value: `$${indicators.ma50?.toFixed(2)}`, status: indicators.price > indicators.ma50 ? '🟢 Above' : '🔴 Below' },
    { label: 'BB Upper', value: `$${indicators.bbUpper?.toFixed(2)}`, status: '' },
    { label: 'BB Lower', value: `$${indicators.bbLower?.toFixed(2)}`, status: '' },
    { label: 'ATR', value: indicators.atr?.toFixed(4), status: '' },
    { label: 'Vol Ratio', value: `${indicators.volumeRatio}x`, status: indicators.volumeRatio > 1.5 ? '🟢 High' : '🟡 Normal' },
  ] : [];

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="pt-16 max-w-[1400px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">{symbol?.replace('USDT', '')}</h1>
              <span className="text-slate-500">/ USDT</span>
              {ticker && (
                <span className={`badge ${isPos ? 'badge-buy' : 'badge-sell'}`}>
                  {isPos ? '+' : ''}{parseFloat(ticker.changePercent).toFixed(2)}%
                </span>
              )}
            </div>
            {ticker && (
              <p className="text-3xl font-mono font-bold mt-1">
                ${parseFloat(ticker.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleWatchlist}
              className={`btn-secondary p-2 ${inWatchlist ? 'text-warning border-warning/50' : ''}`}>
              <Star className="w-5 h-5" fill={inWatchlist ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => navigate('/signals')} className="btn-primary flex items-center gap-2">
              <Zap className="w-4 h-4" /> Get AI Signal
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Chart */}
          <div className="lg:col-span-3">
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-dark-500">
                {['candlestick', 'area'].map((t) => (
                  <button key={t} onClick={() => setChartType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${chartType === t ? 'bg-brand-400 text-white' : 'bg-dark-600 text-slate-400 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
                <div className="w-px h-5 bg-dark-500 mx-1" />
                {['15m','1h','4h','1d'].map((i) => (
                  <button key={i} onClick={() => setInterval(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${interval === i ? 'bg-brand-400/20 text-brand-400' : 'bg-dark-600 text-slate-400 hover:text-white'}`}>
                    {i}
                  </button>
                ))}
              </div>
              <div ref={chartRef} className="w-full" style={{ height: 400 }} />
            </div>

            {/* 24h stats */}
            {ticker && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { label: '24h High', value: `$${parseFloat(ticker.high).toLocaleString()}`, color: 'text-success' },
                  { label: '24h Low', value: `$${parseFloat(ticker.low).toLocaleString()}`, color: 'text-danger' },
                  { label: '24h Volume', value: `${(ticker.volume / 1e3).toFixed(1)}K`, color: 'text-white' },
                  { label: 'Quote Vol', value: `$${(ticker.quoteVolume / 1e6).toFixed(1)}M`, color: 'text-accent-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card text-center py-3">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className={`font-mono font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Indicators panel */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold mb-3 text-sm">Technical Indicators</h3>
              {indicators ? (
                <div className="space-y-2">
                  {indicatorItems.map(({ label, value, status }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-dark-600 last:border-0">
                      <span className="text-xs text-slate-500">{label}</span>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold">{value}</p>
                        {status && <p className="text-xs text-slate-500 mt-0.5">{status}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 bg-dark-600 rounded animate-pulse" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}