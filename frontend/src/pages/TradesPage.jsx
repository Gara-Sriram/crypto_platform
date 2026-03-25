import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const SYMBOLS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','AVAXUSDT'];

function TradeModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ symbol: 'BTCUSDT', type: 'BUY', quantity: '', takeProfit: '', stopLoss: '', note: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantity || parseFloat(form.quantity) <= 0) return toast.error('Enter valid quantity');
    setLoading(true);
    try {
      const { data } = await api.post('/trades', { ...form, quantity: parseFloat(form.quantity), takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : undefined, stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined });
      toast.success(`${form.type} trade opened on ${form.symbol}`);
      onSuccess(data.newBalance);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to open trade');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-700 border border-dark-500 rounded-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-dark-500">
          <h3 className="font-display font-bold text-lg">Open Dummy Trade</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Symbol</label>
              <select value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="input">
                {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['BUY', 'SELL'].map((t) => (
                  <button key={t} type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${form.type === t ? (t === 'BUY' ? 'bg-success/20 border-2 border-success text-success' : 'bg-danger/20 border-2 border-danger text-danger') : 'bg-dark-600 border border-dark-400 text-slate-400'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" placeholder="0.001" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Take Profit (optional)</label>
              <input type="number" step="any" value={form.takeProfit} onChange={(e) => setForm({ ...form, takeProfit: e.target.value })} className="input" placeholder="TP price" />
            </div>
            <div>
              <label className="label">Stop Loss (optional)</label>
              <input type="number" step="any" value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} className="input" placeholder="SL price" />
            </div>
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input" placeholder="Why are you taking this trade?" />
          </div>
          <button type="submit" disabled={loading} className={`w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${form.type === 'BUY' ? 'btn-success' : 'btn-danger'}`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Open ${form.type} Trade`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TradesPage() {
  const { updateUser } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [closing, setClosing] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const { data } = await api.get(`/trades${params}`);
      setTrades(data.trades);
    } catch { toast.error('Failed to load trades'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrades(); }, [filter]);

  const closeTrade = async (id) => {
    setClosing(id);
    try {
      const { data } = await api.put(`/trades/${id}/close`);
      toast.success('Trade closed');
      updateUser({ balance: data.newBalance });
      fetchTrades();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close');
    } finally { setClosing(null); }
  };

  const statusColors = { OPEN: 'text-accent-400', CLOSED: 'text-slate-400', TP_HIT: 'text-success', SL_HIT: 'text-danger' };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="pt-16 max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">My Trades</h1>
            <p className="text-slate-400 text-sm mt-1">Paper trading with virtual balance</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Trade
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['ALL', 'OPEN', 'CLOSED', 'TP_HIT', 'SL_HIT'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-brand-400 text-white' : 'bg-dark-600 text-slate-400 hover:text-white'}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="card animate-pulse h-20 bg-dark-600" />)}
          </div>
        ) : trades.length === 0 ? (
          <div className="card text-center py-16">
            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No trades yet. Open your first trade above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => {
              const pnl = trade.status === 'OPEN' ? trade.currentPnl : trade.pnl;
              const pnlPct = trade.status === 'OPEN' ? trade.currentPnlPercent : trade.pnlPercent;
              const isPos = pnl >= 0;
              return (
                <div key={trade._id} className="card flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trade.type === 'BUY' ? 'bg-success/15' : 'bg-danger/15'}`}>
                      {trade.type === 'BUY' ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-danger" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{trade.symbol}</span>
                        <span className={`badge badge-${trade.type?.toLowerCase()}`}>{trade.type}</span>
                        <span className={`text-xs font-medium ${statusColors[trade.status]}`}>{trade.status}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Entry: <span className="font-mono text-slate-300">${parseFloat(trade.entryPrice).toLocaleString()}</span>
                        {' · '}Qty: <span className="font-mono text-slate-300">{trade.quantity}</span>
                        {' · '}{new Date(trade.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {pnl !== undefined && (
                      <div className="text-right">
                        <p className={`font-mono font-bold ${isPos ? 'text-success' : 'text-danger'}`}>
                          {isPos ? '+' : ''}${parseFloat(pnl || 0).toFixed(2)}
                        </p>
                        <p className={`text-xs ${isPos ? 'text-success/70' : 'text-danger/70'}`}>
                          {isPos ? '+' : ''}{parseFloat(pnlPct || 0).toFixed(2)}%
                        </p>
                      </div>
                    )}
                    {trade.status === 'OPEN' && (
                      <button onClick={() => closeTrade(trade._id)} disabled={closing === trade._id}
                        className="btn-danger text-xs px-3 py-2 flex items-center gap-1">
                        {closing === trade._id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Close'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
  <TradeModal
    onClose={() => setShowModal(false)}
    onSuccess={(newBalance) => {
      updateUser({ balance: newBalance }); // 🔥 FIX
      fetchTrades();
    }}
  />
)}
    </div>
  );
}