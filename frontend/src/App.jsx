import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import DashboardPage from './pages/DashboardPage';
import CryptoDetailPage from './pages/CryptoDetailPage';
import SignalsPage from './pages/SignalsPage';
import TradesPage from './pages/TradesPage';
import WatchlistPage from './pages/WatchlistPage';
import BacktestPage from './pages/BacktestPage';
import AnalyticsPage from './pages/AnalyticsPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-body">Loading CryptoNex...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
    <Route path="/crypto/:symbol" element={<PrivateRoute><CryptoDetailPage /></PrivateRoute>} />
    <Route path="/signals" element={<PrivateRoute><SignalsPage /></PrivateRoute>} />
    <Route path="/trades" element={<PrivateRoute><TradesPage /></PrivateRoute>} />
    <Route path="/watchlist" element={<PrivateRoute><WatchlistPage /></PrivateRoute>} />
    <Route path="/backtest" element={<PrivateRoute><BacktestPage /></PrivateRoute>} />
    <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#fff',
                border: '1px solid #2d2d4a',
                borderRadius: '12px',
                fontFamily: 'DM Sans, sans-serif',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <AppRoutes />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}