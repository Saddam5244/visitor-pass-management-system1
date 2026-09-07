import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Bell, QrCode, UserPlus, LogOut, Building2 } from 'lucide-react';

const Navbar = ({ onOpenScanner }) => {
  const { user, logout, isSecurity } = useAuth();
  const { unreadCount, setDrawerOpen } = useNotification();
  const navigate = useNavigate();

  return (
    <header className="navbar no-print">
      {/* Left side: organization info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '13px' }}>
        <Building2 size={16} color="#2563eb" />
        <span style={{ fontWeight: 600, color: '#0f172a' }}>
          {user?.organizationName || 'Apex Global Technologies'}
        </span>
        <span style={{ color: '#cbd5e1' }}>•</span>
        <span style={{ color: '#64748b' }}>Main Campus</span>
      </div>

      {/* Right side: quick actions */}
      <div className="nav-actions">
        {/* Public Visitor Portal button */}
        <button
          onClick={() => navigate('/public-register')}
          className="btn btn-secondary btn-sm"
          title="Open Public Visitor Pre-Registration Kiosk"
        >
          <UserPlus size={14} /> Visitor Kiosk
        </button>

        {/* Quick QR Scanner for Security / Admin */}
        {isSecurity && onOpenScanner && (
          <button onClick={onOpenScanner} className="btn btn-primary btn-sm">
            <QrCode size={14} /> Scan Pass QR
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="btn btn-secondary btn-sm"
          style={{ position: 'relative', padding: '7px' }}
          title="Dispatched Email & SMS Alerts"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#dc2626',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              {user?.name || 'Authorized Staff'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
              {user?.role === 'employee' ? `${user?.department} Host` : user?.role}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{ padding: '7px' }}
          title="Sign Out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
