import React from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, LogOut, Building2 } from 'lucide-react';

const Navbar = ({ onOpenScanner }) => {
  const { user, logout, isSecurity } = useAuth();

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

        {/* Quick QR Scanner for Security / Admin */}
        {isSecurity && onOpenScanner && (
          <button onClick={onOpenScanner} className="btn btn-primary btn-sm">
            <QrCode size={14} /> Scan Pass QR
          </button>
        )}



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
