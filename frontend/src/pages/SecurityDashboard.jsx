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
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import StatCard from '../components/StatCard';
import StatusPill from '../components/StatusPill';
import QRScannerModal from '../components/QRScannerModal';

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

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setScannerOpen(true)} className="btn btn-primary">
            <QrCode size={16} /> Open QR Scanner
          </button>
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
                      <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '13px' }}>
                        {item.passId?.passNumber}
                      </span>
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
                      <button
                        onClick={() => handleFastCheckOut(item.passId?.passNumber)}
                        className="btn btn-danger btn-sm"
                        disabled={checkingOutId === item.passId?.passNumber}
                      >
                        <LogOut size={13} /> Check Out
                      </button>
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
    </div>
  );
};

export default SecurityDashboard;
