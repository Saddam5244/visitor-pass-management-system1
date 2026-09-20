import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Download,
  Search,
  Clock,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import StatusPill from '../components/StatusPill';

const ReportsPage = () => {
  const { showToast } = useNotification();
  const [analytics, setAnalytics] = useState({
    peakHours: [],
    purposeBreakdown: [],
    weeklyTrend: [],
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gateFilter, setGateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, logsRes] = await Promise.all([
        api.get('/reports/analytics'),
        api.get(`/checklogs?${gateFilter ? `gate=${gateFilter}&` : ''}${statusFilter ? `status=${statusFilter}` : ''}`),
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes);
      if (logsRes.success && logsRes.logs) setLogs(logsRes.logs);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [gateFilter, statusFilter]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const blob = await api.downloadBlob('/reports/export/csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Visitor_Entry_Report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('CSV Report exported successfully from database!', 'success');
    } catch (err) {
      showToast('Failed to export CSV: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchQuery.toLowerCase();
    const visitor = log.visitorId?.fullName?.toLowerCase() || '';
    const comp = log.visitorId?.company?.toLowerCase() || '';
    const pass = log.passId?.passNumber?.toLowerCase() || '';
    return visitor.includes(term) || comp.includes(term) || pass.includes(term);
  });

  const maxHourlyCount = Math.max(...(analytics.peakHours?.map((h) => h.visitors) || [1]), 1);

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
            <FileBarChart2 color="#2563eb" size={24} /> Visitor Reports & Analytics
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Traffic histograms, visit categories, and CSV data export.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchReportsData} className="btn btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExportCSV} className="btn btn-primary" disabled={exporting}>
            <Download size={14} /> {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>

      {/* Analytics Visualizations Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Peak Hours Histogram */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '1.05rem' }}>
            <Clock color="#2563eb" size={16} /> Peak Entry Hours (08:00 - 18:00)
          </h3>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '6px', padding: '10px 0' }}>
            {analytics.peakHours?.map((item, idx) => {
              const heightPercent = Math.max((item.visitors / maxHourlyCount) * 100, 8);
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600, marginBottom: '2px' }}>
                    {item.visitors > 0 ? item.visitors : ''}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPercent}%`,
                      background: '#2563eb',
                      borderRadius: '3px 3px 0 0',
                    }}
                    title={`${item.hour}: ${item.visitors} check-in(s)`}
                  />
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#64748b',
                      marginTop: '4px',
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.hour.slice(0, 5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visitor Purpose Distribution */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '1.05rem' }}>
            <PieChart color="#2563eb" size={16} /> Visitor Categories & Purposes
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics.purposeBreakdown?.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                No category data recorded yet.
              </div>
            ) : (
              analytics.purposeBreakdown?.map((p, idx) => {
                const total = analytics.purposeBreakdown.reduce((acc, curr) => acc + curr.value, 0) || 1;
                const pct = Math.round((p.value / total) * 100);
                const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626'];
                const color = colors[idx % colors.length];

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                      <span style={{ color: '#64748b' }}>
                        {p.value} visits ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: color,
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Historical Check Logs Table */}
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
            <h3>Security Verification & Entry History</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Historical entry and exit records stored permanently in MongoDB.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search visitor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '30px', height: '34px', fontSize: '12px' }}
              />
            </div>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '120px', height: '34px', fontSize: '12px', padding: '4px 8px' }}
            >
              <option value="">All Status</option>
              <option value="IN">Currently IN</option>
              <option value="OUT">Checked OUT</option>
            </select>

            <select
              className="form-select"
              value={gateFilter}
              onChange={(e) => setGateFilter(e.target.value)}
              style={{ width: '140px', height: '34px', fontSize: '12px', padding: '4px 8px' }}
            >
              <option value="">All Gates</option>
              <option value="Main Entrance">Main Entrance</option>
              <option value="VIP Gate">VIP Gate</option>
              <option value="North Turnstile">North Turnstile</option>
              <option value="Basement Parking">Basement Parking</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Pass Number</th>
                <th>Visitor</th>
                <th>Company</th>
                <th>Gate</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Stay Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading entry records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                    No check logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>
                        {log.passId?.passNumber || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {log.visitorId?.fullName || 'Visitor'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {log.visitorId?.phone}
                      </div>
                    </td>
                    <td>{log.visitorId?.company || 'Independent'}</td>
                    <td>{log.gate}</td>
                    <td style={{ fontSize: '12px' }}>
                      {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                        <span style={{ color: '#059669', fontWeight: 600 }}>Inside</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {log.durationMinutes ? `${log.durationMinutes} mins` : 'In Progress'}
                      </span>
                    </td>
                    <td>
                      <StatusPill status={log.status === 'IN' ? 'checked_in' : 'checked_out'} label={log.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
