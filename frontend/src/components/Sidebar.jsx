import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Shield,
  CalendarCheck,
  FileBarChart2,
  Building,
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin, isEmployee } = useAuth();

  return (
    <aside className="sidebar no-print">
      {/* Brand Header */}
      <div className="sidebar-header">
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

      </nav>


    </aside>
  );
};

export default Sidebar;
