import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [tickerData, setTickerData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');

    // 🔴 Do NOT connect if no token or user
    if (!token || !user) {
      console.log("❌ No token or user, skipping socket connection");
      return;
    }

    console.log("🔑 Token found, connecting socket...");

    const s = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    // ✅ SUCCESS
    s.on('connect', () => {
      console.log('✅ Socket connected:', s.id);
    });

    // ❌ ERROR HANDLING (VERY IMPORTANT)
    s.on('connect_error', (err) => {
      console.error('❌ Socket connect error:', err.message);
    });

    s.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    // 📡 RECEIVE LIVE DATA
    s.on('ticker_update', (data) => {
      // console.log("📡 ticker update:", data); // optional debug

      setTickerData((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    // Save socket instance
    setSocket(s);

    // Cleanup
    return () => {
      console.log("🧹 Cleaning socket...");
      s.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, tickerData }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);