import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Shield,
  CalendarCheck,
  QrCode,
  FileBarChart2,
  Building,
  LogOut,
  ExternalLink,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin, isEmployee } = useAuth();

  return (
    <aside className="sidebar no-print">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon">
          <QrCode size={20} />
        </div>
        <div>
          <div className="brand-text">PassPulse</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Visitor Management
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div style={{ fontSize: '11px', color: '#94a3b8', padding: '6px 12px', fontWeight: 600, letterSpacing: '0.04em' }}>
              ADMINISTRATION
            </div>
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
            <NavLink to="/security" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={16} /> Security Live Desk
            </NavLink>
            <NavLink to="/appointments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <CalendarCheck size={16} /> All Appointments
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileBarChart2 size={16} /> Reports & Logs
            </NavLink>
            <NavLink to="/organizations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Building size={16} /> Organizations
            </NavLink>
          </>
        )}

        {/* Security Officer Navigation */}
        {user?.role === 'security' && (
          <>
            <div style={{ fontSize: '11px', color: '#94a3b8', padding: '6px 12px', fontWeight: 600, letterSpacing: '0.04em' }}>
              SECURITY DESK
            </div>
            <NavLink to="/security" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={16} /> Security Live Desk
            </NavLink>
            <NavLink to="/appointments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <CalendarCheck size={16} /> Appointments
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileBarChart2 size={16} /> Entry Logs
            </NavLink>
          </>
        )}

        {/* Employee / Host Navigation */}
        {isEmployee && (
          <>
            <div style={{ fontSize: '11px', color: '#94a3b8', padding: '6px 12px', fontWeight: 600, letterSpacing: '0.04em' }}>
              MY VISITORS
            </div>
            <NavLink to="/host" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <CalendarCheck size={16} /> Appointments & Invites
            </NavLink>
          </>
        )}

        {/* Public kiosk jump */}
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <div
            style={{
              padding: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
              Self-Registration Kiosk
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
              Open public portal for visitor check-in.
            </p>
            <NavLink to="/public-register" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              <ExternalLink size={12} /> Open Kiosk
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {user?.email}
          </div>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm" style={{ padding: '5px' }} title="Logout">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
