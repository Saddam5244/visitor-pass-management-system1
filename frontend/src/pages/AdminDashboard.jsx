import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileCheck2,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';

const AdminDashboard = () => {
  const { showToast } = useNotification();
  const [stats, setStats] = useState({
    totalVisitorsAllTime: 0,
    todayAppointments: 0,
    todayPassesIssued: 0,
    currentlyInsideCount: 0,
    todayCheckIns: 0,
    overstayCount: 0,
  });
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Staff Modal State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffData, setStaffData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: 'Engineering',
    phone: '',
    organizationName: 'Apex Global Technologies',
  });
  const [creatingStaff, setCreatingStaff] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, auditRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/auth/users'),
        api.get('/reports/audit-logs'),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success && usersRes.users) setUsers(usersRes.users);
      if (auditRes.success && auditRes.logs) setAuditLogs(auditRes.logs);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreatingStaff(true);
    try {
      const res = await api.post('/auth/register', staffData);
      if (res.success) {
        showToast(`Staff account for ${staffData.name} saved in database!`, 'success');
        setStaffModalOpen(false);
        setStaffData({
          name: '',
          email: '',
          password: '',
          role: 'employee',
          department: 'Engineering',
          phone: '',
          organizationName: 'Apex Global Technologies',
        });
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create staff account', 'error');
    } finally {
      setCreatingStaff(false);
    }
  };

  return (
    <div className="page-body">
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard color="#2563eb" size={24} /> Admin Dashboard & Directory
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            System-wide statistics, staff directory, and database compliance audit logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchAdminData} className="btn btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setStaffModalOpen(true)} className="btn btn-primary">
            <UserPlus size={15} /> Add Staff Member
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Visitors"
          value={stats.totalVisitorsAllTime}
          icon={Users}
          color="cyan"
          subtitle="Registered in database"
        />
        <StatCard
          title="Active Inside"
          value={stats.currentlyInsideCount}
          icon={Shield}
          color="emerald"
          subtitle="Currently on site"
        />
        <StatCard
          title="Today's Entries"
          value={stats.todayCheckIns}
          icon={FileCheck2}
          color="cyan"
          subtitle="Scanned today"
        />
        <StatCard
          title="Overstay Alerts"
          value={stats.overstayCount}
          icon={AlertTriangle}
          color={stats.overstayCount > 0 ? 'rose' : 'amber'}
          subtitle={stats.overstayCount > 0 ? 'Exceeded allowed hours' : 'Zero overstay alerts'}
        />
      </div>

      {/* Staff Directory Table */}
      <div className="card">
        <div style={{ marginBottom: '16px' }}>
          <h3>Staff Directory (MongoDB Database)</h3>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            Active system administrators, security officers, and employee hosts.
          </p>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background:
                          u.role === 'admin'
                            ? '#eff6ff'
                            : u.role === 'security'
                            ? '#ecfdf5'
                            : '#f8fafc',
                        color:
                          u.role === 'admin'
                            ? '#1d4ed8'
                            : u.role === 'security'
                            ? '#065f46'
                            : '#334155',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{u.department}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <span style={{ color: u.isActive ? '#059669' : '#dc2626', fontWeight: 600, fontSize: '12px' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Audit Logs Table */}
      <div className="card">
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity color="#2563eb" size={16} /> Compliance & Security Audit Trail
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            Persistent MongoDB audit records of logins, pass issuances, approvals, and security scans.
          </p>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 15).map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{log.userName}</td>
                    <td>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b' }}>
                        {log.role}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#f1f5f9',
                          color: '#0f172a',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ color: '#475569' }}>{log.resource}</td>
                    <td style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title="Add Staff Member"
      >
        <form onSubmit={handleCreateStaff}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Officer James Rhodes"
              value={staffData.name}
              onChange={(e) => setStaffData({ ...staffData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Work Email *</label>
              <input
                type="email"
                className="form-control"
                placeholder="james@company.com"
                value={staffData.email}
                onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Min 6 characters"
                value={staffData.password}
                onChange={(e) => setStaffData({ ...staffData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={staffData.role}
                onChange={(e) => setStaffData({ ...staffData, role: e.target.value })}
              >
                <option value="employee">Host Employee</option>
                <option value="security">Security Guard / Frontdesk</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                placeholder="Corporate Security / Facilities / Legal"
                value={staffData.department}
                onChange={(e) => setStaffData({ ...staffData, department: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={creatingStaff}
            >
              {creatingStaff ? 'Saving...' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => setStaffModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
