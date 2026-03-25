import React, { useState } from 'react';
import { FlaskConical, Play, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Navbar from '../components/Layout/Navbar';
import api from '../api/axios';

export default function BacktestPage() {
  const [form, setForm] = useState({
    symbol: 'BTCUSDT', interval: '1h', strategy: 'RSI_MA',
    rsiOversold: 30, rsiOverbought: 70,
    takeProfitPct: 0.05, stopLossPct: 0.03,
    initialCapital: 10000, limit: 500,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runBacktest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/backtest/run', form);
      setResult(data);
      toast.success(`Backtest complete: ${data.summary.totalTrades} trades`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Backtest failed');
    } finally { setLoading(false); }
  };

  const s = result?.summary;

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="pt-16 max-w-[1400px] mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-accent-400" /> Backtesting Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">Test strategies on historical Binance data</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Config panel */}
          <div className="card">
            <h3 className="font-semibold mb-4">Strategy Configuration</h3>
            <form onSubmit={runBacktest} className="space-y-3">
              {[
                { label: 'Symbol', key: 'symbol', type: 'select', options: ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT'] },
                { label: 'Interval', key: 'interval', type: 'select', options: ['15m','1h','4h','1d'] },
                { label: 'Strategy', key: 'strategy', type: 'select', options: ['RSI_MA','MACD_CROSSOVER','MA_CROSSOVER'] },
              ].map(({ label, key, type, options }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input">
                    {options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {[
                { label: 'RSI Oversold', key: 'rsiOversold' },
                { label: 'RSI Overbought', key: 'rsiOverbought' },
                { label: 'Take Profit %', key: 'takeProfitPct' },
                { label: 'Stop Loss %', key: 'stopLossPct' },
                { label: 'Initial Capital ($)', key: 'initialCapital' },
                { label: 'Candles (max 1000)', key: 'limit' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type="number" step="any" value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) })}
                    className="input" />
                </div>
              ))}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {loading ? 'Running...' : 'Run Backtest'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {!result ? (
              <div className="card flex items-center justify-center h-64 text-slate-500">
                <div className="text-center">
                  <FlaskConical className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>Configure and run a backtest to see results</p>
                </div>
              </div>
            ) : (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Return', value: `${s.totalReturn >= 0 ? '+' : ''}${s.totalReturn}%`, color: s.totalReturn >= 0 ? 'text-success' : 'text-danger' },
                    { label: 'Win Rate', value: `${s.winRate}%`, color: s.winRate >= 50 ? 'text-success' : 'text-danger' },
                    { label: 'Total Trades', value: s.totalTrades, color: 'text-white' },
                    { label: 'Profit Factor', value: s.profitFactor, color: s.profitFactor >= 1 ? 'text-success' : 'text-danger' },
                    { label: 'Max Drawdown', value: `${s.maxDrawdown}%`, color: 'text-danger' },
                    { label: 'Winners', value: s.winners, color: 'text-success' },
                    { label: 'Losers', value: s.losers, color: 'text-danger' },
                    { label: 'Final Capital', value: `$${s.finalCapital.toLocaleString()}`, color: s.finalCapital >= s.initialCapital ? 'text-success' : 'text-danger' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="card text-center py-3">
                      <p className={`text-lg font-mono font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-slate-500 mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Equity curve */}
                {result.equityCurve?.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold mb-4">Equity Curve</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={result.equityCurve}>
                        <defs>
                          <linearGradient id="equity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
                        <XAxis dataKey="time" tickFormatter={(v) => new Date(v * 1000).toLocaleDateString()} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: '8px' }}
                          formatter={(v) => [`$${v.toFixed(2)}`, 'Equity']} labelFormatter={(v) => new Date(v * 1000).toLocaleDateString()} />
                        <Area type="monotone" dataKey="equity" stroke="#7c3aed" fill="url(#equity)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent trades table */}
                <div className="card">
                  <h3 className="font-semibold mb-4">Recent Trades ({result.trades?.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 text-xs border-b border-dark-500">
                          {['Type','Entry','Exit','P&L','Exit Reason','Date'].map((h) => (
                            <th key={h} className="text-left pb-2 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.trades?.slice(-15).reverse().map((t, i) => (
                          <tr key={i} className="border-b border-dark-600/50 text-xs">
                            <td className="py-2 pr-4"><span className={`badge badge-${t.type?.toLowerCase()}`}>{t.type}</span></td>
                            <td className="py-2 pr-4 font-mono">${parseFloat(t.entry).toFixed(2)}</td>
                            <td className="py-2 pr-4 font-mono">${parseFloat(t.exit).toFixed(2)}</td>
                            <td className={`py-2 pr-4 font-mono font-bold ${t.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                              {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                            </td>
                            <td className="py-2 pr-4 text-slate-400">{t.exitReason}</td>
                            <td className="py-2 text-slate-500">{new Date(t.exitTime * 1000).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}