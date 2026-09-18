import React, { useState, useEffect } from 'react';
import {
  Shield,
  QrCode,
  Users,
  AlertTriangle,
  Clock,
  LogOut,
  UserCheck,
  RefreshCw,
  Search,
  PlusCircle,
  Eye,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import StatCard from '../components/StatCard';
import StatusPill from '../components/StatusPill';
import QRScannerModal from '../components/QRScannerModal';
import Modal from '../components/Modal';
import PassBadge from '../components/PassBadge';

const SecurityDashboard = () => {
  const { showToast } = useNotification();
  const [stats, setStats] = useState({
    currentlyInsideCount: 0,
    todayCheckIns: 0,
    overstayCount: 0,
  });
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingOutId, setCheckingOutId] = useState(null);

  // Walk-in modal state
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInData, setWalkInData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    purpose: 'On-site Meeting',
    hostId: '',
  });
  const [hosts, setHosts] = useState([]);
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  // Badge viewer modal state
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);

  const fetchHosts = async () => {
    try {
      const res = await api.get('/auth/hosts');
      if (res.success && res.hosts) {
        setHosts(res.hosts);
        if (res.hosts.length > 0) {
          setWalkInData((prev) => ({ ...prev, hostId: res.hosts[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching hosts:', err);
    }
  };

  const handleOpenWalkIn = () => {
    fetchHosts();
    setWalkInModalOpen(true);
  };

  const handleCreateWalkInPass = async (e) => {
    e.preventDefault();
    if (!walkInData.fullName || !walkInData.phone || !walkInData.hostId) {
      showToast('Please enter full name, phone number, and select a host', 'warning');
      return;
    }
    setSubmittingWalkIn(true);
    try {
      const payload = {
        ...walkInData,
        email: walkInData.email || `visitor.${Date.now()}@walkin.guest`,
        autoApprove: true,
      };
      const res = await api.post('/visitors/register', payload);
      if (res.success && res.pass) {
        showToast(`Pass created with QR Code: ${res.pass.passNumber}`, 'success');
        setWalkInModalOpen(false);
        setWalkInData({
          fullName: '',
          phone: '',
          email: '',
          company: '',
          purpose: 'On-site Meeting',
          hostId: hosts[0]?._id || '',
        });
        fetchDashboardData();
        setSelectedPass(res.pass);
        setBadgeModalOpen(true);
      } else {
        showToast(res.message || 'Pass created', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Failed to issue walk-in pass', 'error');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const handleOpenBadge = async (passOrNumber) => {
    if (typeof passOrNumber === 'object' && passOrNumber !== null) {
      setSelectedPass(passOrNumber);
      setBadgeModalOpen(true);
      return;
    }
    try {
      const res = await api.get(`/passes/number/${passOrNumber}`);
      if (res.success && res.pass) {
        setSelectedPass(res.pass);
        setBadgeModalOpen(true);
      } else {
        showToast('Pass details not found', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error retrieving pass', 'error');
    }
  };


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, insideRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/checklogs/inside'),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (insideRes.success && insideRes.visitors) {
        setActiveVisitors(insideRes.visitors);
      }
    } catch (err) {
      console.error('Error fetching security desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFastCheckOut = async (passNumber) => {
    setCheckingOutId(passNumber);
    try {
      const res = await api.post('/checklogs/check-out', {
        passNumber,
        gate: 'Main Entrance',
      });

      if (res.success) {
        showToast(res.message, 'success');
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Check-out failed', 'error');
    } finally {
      setCheckingOutId(null);
    }
  };

  const filteredVisitors = activeVisitors.filter((item) => {
    const term = searchQuery.toLowerCase();
    const name = item.visitorId?.fullName?.toLowerCase() || '';
    const comp = item.visitorId?.company?.toLowerCase() || '';
    const pass = item.passId?.passNumber?.toLowerCase() || '';
    return name.includes(term) || comp.includes(term) || pass.includes(term);
  });

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
            <Shield color="#2563eb" size={24} /> Security Desk & Visitor Scanner
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Live evacuation roll call, QR badge verification, and visitor entry/exit tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleOpenWalkIn} className="btn btn-success">
            <PlusCircle size={15} /> Issue Walk-In Pass
          </button>
          <button onClick={() => setScannerOpen(true)} className="btn btn-primary">
            <QrCode size={15} /> Open QR Scanner
          </button>
          <button onClick={fetchDashboardData} className="btn btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Quick Test QR Badges Strip */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#2563eb" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            Pre-Generated Pass Badges:
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Click to view and scan official QR badges
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['VP-2026-1001', 'VP-2026-1002', 'VP-2026-1003'].map((code) => (
            <button
              key={code}
              onClick={() => handleOpenBadge(code)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <QrCode size={12} color="#2563eb" /> {code} Badge
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Currently Inside"
          value={stats.currentlyInsideCount}
          icon={Users}
          color="emerald"
          subtitle="Present on site"
        />
        <StatCard
          title="Check-Ins Today"
          value={stats.todayCheckIns}
          icon={UserCheck}
          color="cyan"
          subtitle="Total entries logged"
        />
        <StatCard
          title="Overstay Alerts"
          value={stats.overstayCount}
          icon={AlertTriangle}
          color={stats.overstayCount > 0 ? 'rose' : 'amber'}
          subtitle={stats.overstayCount > 0 ? 'Exceeded allowed hours' : 'No overdue visitors'}
        />
      </div>

      {/* Overstay Warning Banner */}
      {stats.overstayCount > 0 && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertTriangle size={20} color="#dc2626" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '13px' }}>
              Security Alert: {stats.overstayCount} visitor(s) have exceeded their scheduled validity!
            </div>
            <div style={{ fontSize: '12px', color: '#b91c1c' }}>
              Please review the highlighted rows below and notify the corresponding host employees.
            </div>
          </div>
        </div>
      )}

      {/* Active Visitors Inside Table */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3>Active Inside Visitors (Evacuation Roll Call)</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              All external visitors currently inside the facility stored in database.
            </p>
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by visitor, pass, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Pass Number</th>
                <th>Gate</th>
                <th>Check-In Time</th>
                <th>Stay Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading active visitor roll call from database...
                  </td>
                </tr>
              ) : filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                    No visitors are currently inside the building.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((item) => (
                  <tr
                    key={item._id}
                    style={{
                      background: item.isOverstay ? '#fff5f5' : 'transparent',
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: '#e0e7ff',
                            color: '#3730a3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          {item.visitorId?.photoUrl ? (
                            <img
                              src={item.visitorId.photoUrl}
                              alt="V"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            item.visitorId?.fullName?.charAt(0) || 'V'
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {item.visitorId?.fullName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {item.visitorId?.company || 'Independent'} • {item.visitorId?.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <button
                        onClick={() => handleOpenBadge(item.passId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontWeight: 600,
                          color: '#2563eb',
                          fontSize: '13px',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textAlign: 'left',
                        }}
                        title="Click to view QR badge"
                      >
                        {item.passId?.passNumber}
                      </button>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {item.passId?.badgeType || 'VISITOR'}
                      </div>
                    </td>

                    <td>{item.gate}</td>

                    <td>
                      {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="#64748b" />
                        <span style={{ fontWeight: 600, color: item.isOverstay ? '#dc2626' : '#0f172a' }}>
                          {item.currentDurationMinutes} mins
                        </span>
                      </div>
                      {item.isOverstay && (
                        <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
                          +{item.overstayMinutes}m overdue
                        </div>
                      )}
                    </td>

                    <td>
                      {item.isOverstay ? (
                        <StatusPill status="overstay" label="OVERSTAY" />
                      ) : (
                        <StatusPill status="checked_in" label="INSIDE" />
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenBadge(item.passId)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="View QR Badge"
                        >
                          <Eye size={12} /> Badge
                        </button>
                        <button
                          onClick={() => handleFastCheckOut(item.passId?.passNumber)}
                          className="btn btn-danger btn-sm"
                          disabled={checkingOutId === item.passId?.passNumber}
                        >
                          <LogOut size={13} /> Check Out
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={() => {
          fetchDashboardData();
        }}
      />

      {/* Issue Walk-In Pass Modal */}
      <Modal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        title="Issue Instant Walk-In Pass with QR"
      >
        <form onSubmit={handleCreateWalkInPass}>
          <div className="form-group">
            <label className="form-label">Visitor Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Rahul Verma"
              value={walkInData.fullName}
              onChange={(e) => setWalkInData({ ...walkInData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 98765 00000"
                value={walkInData.phone}
                onChange={(e) => setWalkInData({ ...walkInData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <input
                type="email"
                className="form-control"
                placeholder="rahul@example.com"
                value={walkInData.email}
                onChange={(e) => setWalkInData({ ...walkInData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company / Organization</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Partner Services"
                value={walkInData.company}
                onChange={(e) => setWalkInData({ ...walkInData, company: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Host Employee *</label>
              <select
                className="form-select"
                value={walkInData.hostId}
                onChange={(e) => setWalkInData({ ...walkInData, hostId: e.target.value })}
                required
              >
                {hosts.length === 0 && <option value="">Loading hosts...</option>}
                {hosts.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Purpose of Visit</label>
            <input
              type="text"
              className="form-control"
              value={walkInData.purpose}
              onChange={(e) => setWalkInData({ ...walkInData, purpose: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setWalkInModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={submittingWalkIn}>
              <PlusCircle size={15} /> {submittingWalkIn ? 'Generating Pass...' : 'Issue Pass & Show QR'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Pass Badge Modal */}
      {badgeModalOpen && selectedPass && (
        <Modal
          isOpen={badgeModalOpen}
          onClose={() => {
            setBadgeModalOpen(false);
            setSelectedPass(null);
          }}
          title={`Visitor Badge: ${selectedPass.passNumber}`}
        >
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <PassBadge
              pass={selectedPass}
              visitor={selectedPass.visitorId}
              host={selectedPass.hostId}
              organization={selectedPass.organizationId}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SecurityDashboard;
