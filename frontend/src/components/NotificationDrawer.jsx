import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { X, Mail, MessageSquare, RefreshCw } from 'lucide-react';

const NotificationDrawer = () => {
  const { drawerOpen, setDrawerOpen, notifications, refreshNotifications } = useNotification();

  if (!drawerOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(2px)',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={() => setDrawerOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          height: '100%',
          boxShadow: 'var(--shadow-lg)',
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#0f172a' }}>Database Notifications</h3>
            <span
              style={{
                fontSize: '11px',
                background: '#eff6ff',
                color: '#2563eb',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 600,
              }}
            >
              Email & SMS
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={refreshNotifications}
              className="btn btn-secondary btn-sm"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
              <Mail size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px' }}>No notifications logged in database yet.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id || item.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.type === 'EMAIL' ? (
                      <span
                        style={{
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#0369a1',
                          background: '#e0f2fe',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        <Mail size={12} /> EMAIL
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#065f46',
                          background: '#d1fae5',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        <MessageSquare size={12} /> SMS
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(item.createdAt || item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>STORED IN DB</span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                  {item.subject}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                  Recipient: <span style={{ color: '#0f172a', fontWeight: 500 }}>{item.recipient}</span>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#334155',
                    background: '#ffffff',
                    border: '1px solid #edf2f7',
                    padding: '8px',
                    borderRadius: '6px',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
