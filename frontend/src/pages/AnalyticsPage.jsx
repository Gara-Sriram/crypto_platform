import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Layout/Navbar';
import api from '../api/axios';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trades/analytics')
      .then(({ data }) => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pieData = analytics ? [
    { name: 'Winners', value: analytics.winners, color: '#10b981' },
    { name: 'Losers', value: analytics.losers, color: '#ef4444' },
  ] : [];

  const monthlyData = analytics ? Object.entries(analytics.monthly || {}).map(([month, pnl]) => ({ month, pnl: parseFloat(pnl.toFixed(2)) })) : [];

  const symbolData = analytics ? Object.entries(analytics.bySymbol || {}).map(([symbol, data]) => ({
    symbol: symbol.replace('USDT', ''),
    pnl: parseFloat(data.pnl.toFixed(2)),
    trades: data.trades,
    winRate: data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(1) : 0,
  })) : [];

  const stats = [
    { label: 'Total Trades', value: analytics?.total || 0, icon: Target, color: 'text-brand-400', bg: 'bg-brand-400/10' },
    { label: 'Win Rate', value: `${analytics?.winRate || 0}%`, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Total P&L', value: `$${(analytics?.totalPnL || 0).toFixed(2)}`, icon: DollarSign, color: analytics?.totalPnL >= 0 ? 'text-success' : 'text-danger', bg: analytics?.totalPnL >= 0 ? 'bg-success/10' : 'bg-danger/10' },
    { label: 'Portfolio Balance', value: `$${(analytics?.balance || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: BarChart2, color: 'text-accent-400', bg: 'bg-accent-400/10' },
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="pt-16 max-w-[1400px] mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-brand-400" /> Performance Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your paper trading performance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-slate-400 text-sm">{label}</span>
              </div>
              <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Win/Loss Pie */}
          <div className="card">
            <h3 className="font-semibold mb-4">Win / Loss Ratio</h3>
            {analytics?.total > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
                      <span className="text-sm text-slate-400">{entry.name}</span>
                      <span className="font-bold ml-auto">{entry.value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 pt-1">Win Rate: <span className="text-success font-bold">{analytics?.winRate}%</span></p>
                </div>
              </div>
            ) : <p className="text-slate-500 text-center py-8">No closed trades yet</p>}
          </div>

          {/* Monthly P&L */}
          <div className="card">
            <h3 className="font-semibold mb-4">Monthly P&L</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: '8px' }} formatter={(v) => [`$${v}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[4,4,0,0]}>
                    {monthlyData.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500 text-center py-8">No data yet</p>}
          </div>

          {/* By Symbol */}
          {symbolData.length > 0 && (
            <div className="card lg:col-span-2">
              <h3 className="font-semibold mb-4">Performance by Symbol</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-dark-500">
                      {['Symbol','Trades','P&L','Win Rate'].map((h) => <th key={h} className="text-left pb-2 pr-6">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {symbolData.map((row) => (
                      <tr key={row.symbol} className="border-b border-dark-600/50">
                        <td className="py-3 pr-6 font-bold">{row.symbol}</td>
                        <td className="py-3 pr-6 text-slate-400">{row.trades}</td>
                        <td className={`py-3 pr-6 font-mono font-bold ${row.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                          {row.pnl >= 0 ? '+' : ''}${row.pnl}
                        </td>
                        <td className={`py-3 font-semibold ${parseFloat(row.winRate) >= 50 ? 'text-success' : 'text-danger'}`}>
                          {row.winRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}