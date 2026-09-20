import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const fetchRecentNotifications = async () => {
    try {
      const res = await api.get('/notifications/recent');
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.notifications.length);
      }
    } catch {
      // Ignore background fetch error
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('passpulse_token');
    if (token) {
      fetchRecentNotifications();
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        notifications,
        unreadCount,
        drawerOpen,
        setDrawerOpen,
        refreshNotifications: fetchRecentNotifications,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const colors = {
            success: { bg: 'rgba(6, 78, 59, 0.95)', border: '#10b981', icon: '✓' },
            error: { bg: 'rgba(127, 29, 29, 0.95)', border: '#f43f5e', icon: '✕' },
            warning: { bg: 'rgba(120, 53, 15, 0.95)', border: '#f59e0b', icon: '⚠' },
            info: { bg: 'rgba(15, 23, 42, 0.95)', border: '#0ea5e9', icon: 'ℹ' },
          }[toast.type] || { bg: 'rgba(15, 23, 42, 0.95)', border: '#0ea5e9', icon: 'ℹ' };

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                background: colors.bg,
                color: '#fff',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(12px)',
                padding: '12px 18px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
                maxWidth: '420px',
                fontSize: '14px',
                animation: 'slideUp 0.25s ease-out',
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '15px',
                  color: colors.border,
                }}
              >
                {colors.icon}
              </span>
              <span style={{ flex: 1 }}>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
