import React, { useState, useEffect } from 'react';
import { Bot, Zap, TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import api from '../api/axios';

const SYMBOLS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT','DOGEUSDT'];

const AgentCard = ({ agent }) => {
  const [expanded, setExpanded] = useState(false);
  const color = agent.recommendation === 'BUY' ? 'success' : agent.recommendation === 'SELL' ? 'danger' : 'warning';
  return (
    <div className="bg-dark-600 border border-dark-400 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-sm">{agent.agentName}</p>
          <p className="text-xs text-slate-500 capitalize">{agent.strategy} strategy</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge badge-${agent.recommendation?.toLowerCase()}`}>{agent.recommendation}</span>
          <span className="text-xs text-slate-400">{agent.confidence}%</span>
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide' : 'Show'} reasoning
      </button>
      {expanded && (
        <p className="mt-3 text-xs text-slate-400 leading-relaxed border-t border-dark-400 pt-3">{agent.opinion}</p>
      )}
    </div>
  );
};

const SignalCard = ({ signal }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card-hover animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold">{signal.symbol}</span>
            <span className={`badge badge-${signal.action?.toLowerCase()}`}>{signal.action}</span>
            <span className="badge bg-dark-500 text-slate-400">{signal.riskLevel}</span>
          </div>
          <p className="text-xs text-slate-500">{new Date(signal.createdAt).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand-400">{signal.confidence}%</p>
          <p className="text-xs text-slate-500">confidence</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Entry', value: signal.entryPrice, color: 'text-white' },
          { label: 'Take Profit', value: signal.takeProfit, color: 'text-success' },
          { label: 'Stop Loss', value: signal.stopLoss, color: 'text-danger' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-dark-600 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`font-mono font-bold text-sm ${color}`}>
              ${parseFloat(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-dark-600 border-l-4 border-brand-400 rounded-r-xl p-3 mb-3">
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{signal.judgeVerdict}</p>
      </div>

      <button onClick={() => setExpanded(!expanded)}
        className="text-xs text-brand-400 hover:text-accent-400 flex items-center gap-1 transition-colors">
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide' : 'View'} agent debate
      </button>

      {expanded && signal.agentDiscussions?.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent Discussions</p>
          {signal.agentDiscussions.map((agent, i) => (
            <AgentCard key={i} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SignalsPage() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1h');

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/signals?limit=10');
      setSignals(data.signals);
    } catch { toast.error('Failed to load signals'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSignals(); }, []);

  const generateSignal = async () => {
    setGenerating(true);
    try {
      toast.loading('Running multi-agent AI analysis...', { id: 'gen' });
      const { data } = await api.post('/signals/generate', { symbol, interval });
      setSignals((prev) => [data, ...prev]);
      toast.success(`Signal generated: ${data.action} ${data.symbol}`, { id: 'gen' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed', { id: 'gen' });
    } finally { setGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="pt-16 max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Bot className="w-6 h-6 text-brand-400" /> AI Trade Signals
            </h1>
            <p className="text-slate-400 text-sm mt-1">Multi-agent AI analysis with judge consensus</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="input w-auto text-sm py-2">
              {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={interval} onChange={(e) => setInterval(e.target.value)}
              className="input w-auto text-sm py-2">
              {['15m','1h','4h','1d'].map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <button onClick={generateSignal} disabled={generating} className="btn-primary flex items-center gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {generating ? 'Analyzing...' : 'Generate Signal'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1,2].map((i) => <div key={i} className="card animate-pulse h-64 bg-dark-600" />)}
          </div>
        ) : signals.length === 0 ? (
          <div className="card text-center py-16">
            <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No signals yet. Generate your first AI signal above.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {signals.map((s) => <SignalCard key={s._id} signal={s} />)}
          </div>
        )}
      </main>
    </div>
  );
}