import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import api from '../api/axios';

const ALL_SYMBOLS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','AVAXUSDT','DOTUSDT','MATICUSDT','LINKUSDT','UNIUSDT','ATOMUSDT','LTCUSDT','FILUSDT'];

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchWatchlist = async () => {
    try {
      const { data } = await api.get('/watchlist');
      setWatchlist(data);
    } catch { toast.error('Failed to load watchlist'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWatchlist(); }, []);

  const addSymbol = async (symbol) => {
    setAdding(true);
    try {
      await api.post('/watchlist', { symbol });
      toast.success(`${symbol} added to watchlist`);
      fetchWatchlist();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add'); }
    finally { setAdding(false); setSearch(''); }
  };

  const removeSymbol = async (symbol) => {
    try {
      await api.delete(`/watchlist/${symbol}`);
      toast.success(`${symbol} removed`);
      setWatchlist((prev) => prev.filter((t) => t.symbol !== symbol));
    } catch { toast.error('Failed to remove'); }
  };

  const watchedSymbols = watchlist.map((t) => t.symbol);
  const filteredSuggestions = ALL_SYMBOLS.filter(
    (s) => !watchedSymbols.includes(s) && s.toLowerCase().includes(search.toLowerCase()) && search
  );

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="pt-16 max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-warning" fill="currentColor" /> Watchlist
            </h1>
            <p className="text-slate-400 text-sm mt-1">Track your favourite cryptocurrencies</p>
          </div>
        </div>

        {/* Add search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Search symbol to add (e.g. BTC)..."
          />
          {filteredSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-dark-700 border border-dark-500 rounded-xl overflow-hidden z-20 shadow-xl">
              {filteredSuggestions.map((s) => (
                <button key={s} onClick={() => addSymbol(s)} disabled={adding}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-dark-600 text-sm transition-colors">
                  <span>{s.replace('USDT', '')} <span className="text-slate-500 text-xs">{s}</span></span>
                  <Plus className="w-4 h-4 text-brand-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => <div key={i} className="card animate-pulse h-32 bg-dark-600" />)}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="card text-center py-16">
            <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Your watchlist is empty. Search above to add coins.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {watchlist.map((ticker) => {
              const isPos = ticker.changePercent >= 0;
              return (
                <div key={ticker.symbol} className="card-hover group relative">
                  <button onClick={() => removeSymbol(ticker.symbol)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div onClick={() => navigate(`/crypto/${ticker.symbol}`)} className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPos ? 'bg-success/15' : 'bg-danger/15'}`}>
                        {isPos ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-danger" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{ticker.symbol.replace('USDT', '')}</p>
                        <p className="text-xs text-slate-500">USDT</p>
                      </div>
                    </div>
                    <p className="text-xl font-mono font-bold">
                      ${parseFloat(ticker.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </p>
                    <p className={`text-sm font-semibold mt-1 ${isPos ? 'text-success' : 'text-danger'}`}>
                      {isPos ? '+' : ''}{parseFloat(ticker.changePercent).toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}