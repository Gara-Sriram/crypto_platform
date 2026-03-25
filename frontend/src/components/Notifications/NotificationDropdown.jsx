import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

export default function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=10');
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('notification', (n) => {
      setNotifications((prev) => [n, ...prev.slice(0, 9)]);
      setUnread((u) => u + 1);
    });
    return () => socket.off('notification');
  }, [socket]);

  const markAllRead = async () => {
    await api.put('/notifications/all/read');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const typeColors = {
    SIGNAL: 'bg-brand-400/20 text-brand-400',
    TRADE_CLOSED: 'bg-accent-400/20 text-accent-400',
    TP_HIT: 'bg-success/20 text-success',
    SL_HIT: 'bg-danger/20 text-danger',
    SYSTEM: 'bg-warning/20 text-warning',
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-dark-700 border border-dark-500 rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-500">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-sm">Notifications</span>
          {unread > 0 && (
            <span className="bg-brand-400 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <div key={n._id}
              className={`flex gap-3 px-4 py-3 border-b border-dark-600 hover:bg-dark-600 transition-colors ${!n.isRead ? 'bg-dark-600/50' : ''}`}>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 h-fit mt-0.5 ${typeColors[n.type] || 'bg-dark-500 text-slate-400'}`}>
                {n.type.replace('_', ' ')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-slate-600 mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
              </div>
              {!n.isRead && <div className="w-2 h-2 bg-brand-400 rounded-full shrink-0 mt-1.5" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}