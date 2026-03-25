import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../Notifications/NotificationDropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/signals', label: 'AI Signals' },
    { to: '/trades', label: 'Trades' },
    { to: '/watchlist', label: 'Watchlist' },
    { to: '/backtest', label: 'Backtest' },
    { to: '/analytics', label: 'Analytics' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-dark-800/80 backdrop-blur-xl border-b border-dark-500">
      <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-display font-bold text-gradient hidden sm:block">CryptoNex</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === to
                  ? 'bg-brand-400/20 text-brand-400'
                  : 'text-slate-400 hover:text-white hover:bg-dark-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Balance */}
          <div className="hidden sm:flex items-center gap-1.5 bg-dark-600 border border-dark-400 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 text-xs">Balance</span>
            <span className="text-success text-sm font-mono font-semibold">
              ${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
              className="relative w-9 h-9 rounded-xl bg-dark-600 border border-dark-400 hover:border-brand-400/50 flex items-center justify-center transition-all"
            >
              <Bell className="w-4 h-4 text-slate-400" />
            </button>
            {showNotif && <NotificationDropdown onClose={() => setShowNotif(false)} />}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
              className="flex items-center gap-2 bg-dark-600 border border-dark-400 hover:border-brand-400/50 rounded-xl px-3 py-1.5 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">{user?.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-dark-700 border border-dark-500 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-dark-500">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <Link to="/analytics" onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-dark-600 transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}