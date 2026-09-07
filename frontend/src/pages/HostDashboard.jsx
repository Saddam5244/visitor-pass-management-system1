import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  UserPlus,
  Check,
  X,
  Clock,
  Search,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';

const HostDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    company: '',
    purpose: 'Meeting',
    scheduledStartTime: new Date().toISOString().slice(0, 16),
    scheduledEndTime: new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16),
  });
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Approval Modal State
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      if (res.success && res.appointments) {
        setAppointments(res.appointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleApprove = async () => {
    if (!selectedAppt) return;
    setProcessingAction(true);
    try {
      const res = await api.put(`/appointments/${selectedAppt._id}/approve`, {
        remarks: approvalRemarks,
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 50 });
        showToast('Visitor pass authorized and stored in database!', 'success');
        setApproveModalOpen(false);
        fetchAppointments();
      }
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (appt) => {
    const reason = prompt('Please specify a reason or note:', 'Schedule conflict');
    if (reason === null) return;

    try {
      const res = await api.put(`/appointments/${appt._id}/reject`, {
        remarks: reason,
      });

      if (res.success) {
        showToast('Appointment request rejected in database', 'info');
        fetchAppointments();
      }
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setSubmittingInvite(true);
    try {
      const res = await api.post('/appointments/invite', inviteData);
      if (res.success) {
        confetti({ particleCount: 80, spread: 60 });
        showToast(`Pass created and invitation sent to ${inviteData.visitorEmail}!`, 'success');
        setInviteModalOpen(false);
        setInviteData({
          visitorName: '',
          visitorEmail: '',
          visitorPhone: '',
          company: '',
          purpose: 'Meeting',
          scheduledStartTime: new Date().toISOString().slice(0, 16),
          scheduledEndTime: new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16),
        });
        fetchAppointments();
      }
    } catch (err) {
      showToast(err.message || 'Invitation failed', 'error');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const pendingAppointments = appointments.filter((a) => a.status === 'PENDING');
  const filteredAppointments = appointments.filter((a) => {
    if (activeFilter !== 'ALL' && a.status !== activeFilter) return false;
    const term = searchQuery.toLowerCase();
    const name = a.visitorId?.fullName?.toLowerCase() || '';
    const comp = a.visitorId?.company?.toLowerCase() || '';
    const purpose = a.purpose?.toLowerCase() || '';
    return name.includes(term) || comp.includes(term) || purpose.includes(term);
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
            <CalendarCheck color="#2563eb" size={24} /> Host Portal & Appointments
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Approve guest requests, invite visitors, and view visit records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchAppointments} className="btn btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setInviteModalOpen(true)} className="btn btn-primary">
            <UserPlus size={15} /> Invite Visitor
          </button>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingAppointments.length > 0 && (
        <div
          className="card"
          style={{
            border: '1px solid #fde68a',
            background: '#fffbeb',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={18} color="#d97706" />
            <h3 style={{ color: '#92400e', fontSize: '1.1rem' }}>
              Pending Visitor Requests ({pendingAppointments.length})
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {pendingAppointments.map((appt) => (
              <div
                key={appt._id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                    {appt.visitorId?.fullName}
                  </div>
                  <StatusPill status={appt.status} />
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  {appt.visitorId?.company || 'Independent'} • {appt.visitorId?.email}
                </div>
                <div style={{ fontSize: '12px', color: '#2563eb', marginBottom: '6px' }}>
                  Purpose: <strong>{appt.purpose}</strong> {appt.customPurpose ? `(${appt.customPurpose})` : ''}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                  Arrival: {new Date(appt.scheduledStartTime).toLocaleString()}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setSelectedAppt(appt);
                      setApprovalRemarks('Authorized by Host');
                      setApproveModalOpen(true);
                    }}
                    className="btn btn-success btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Check size={13} /> Approve Pass
                  </button>
                  <button
                    onClick={() => handleReject(appt)}
                    className="btn btn-secondary btn-sm"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Appointments Table */}
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
            <h3>Scheduled Visits</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Historical and upcoming visitor appointments saved in database.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '200px' }}>
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

            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'PENDING', 'APPROVED', 'COMPLETED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`btn btn-sm ${activeFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Company</th>
                <th>Purpose</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading appointments from database...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                    No appointments found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => (
                  <tr key={appt._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {appt.visitorId?.fullName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {appt.visitorId?.email}
                      </div>
                    </td>
                    <td>{appt.visitorId?.company || 'Independent'}</td>
                    <td>
                      <span style={{ fontWeight: 500, color: '#2563eb' }}>
                        {appt.purpose}
                      </span>
                    </td>
                    <td>
                      <div>{new Date(appt.scheduledStartTime).toLocaleDateString()}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(appt.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <StatusPill status={appt.status} />
                    </td>
                    <td>
                      {appt.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => {
                              setSelectedAppt(appt);
                              setApprovalRemarks('Authorized by host');
                              setApproveModalOpen(true);
                            }}
                            className="btn btn-success btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(appt)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {appt.approvalRemarks || 'Authorized'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite a Visitor"
      >
        <form onSubmit={handleSendInvite}>
          <div className="form-group">
            <label className="form-label">Visitor Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dr. Jennifer Clark"
              value={inviteData.visitorName}
              onChange={(e) => setInviteData({ ...inviteData, visitorName: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Visitor Email *</label>
              <input
                type="email"
                className="form-control"
                placeholder="jennifer@example.com"
                value={inviteData.visitorEmail}
                onChange={(e) => setInviteData({ ...inviteData, visitorEmail: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="+1 (555) 0199"
                value={inviteData.visitorPhone}
                onChange={(e) => setInviteData({ ...inviteData, visitorPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company</label>
              <input
                type="text"
                className="form-control"
                placeholder="Client / Partner Corp"
                value={inviteData.company}
                onChange={(e) => setInviteData({ ...inviteData, company: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Purpose</label>
              <select
                className="form-select"
                value={inviteData.purpose}
                onChange={(e) => setInviteData({ ...inviteData, purpose: e.target.value })}
              >
                <option value="Meeting">Meeting</option>
                <option value="Interview">Interview</option>
                <option value="Client Demo">Client Demo</option>
                <option value="Vendor / Contractor">Vendor / Contractor</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Arrival Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={inviteData.scheduledStartTime}
                onChange={(e) => setInviteData({ ...inviteData, scheduledStartTime: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Departure Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={inviteData.scheduledEndTime}
                onChange={(e) => setInviteData({ ...inviteData, scheduledEndTime: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={submittingInvite}
            >
              {submittingInvite ? 'Saving...' : 'Send Invite & Issue Pass'}
            </button>
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Approval Confirmation Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Authorize Visitor Pass"
      >
        {selectedAppt && (
          <div>
            <p style={{ marginBottom: '14px', fontSize: '13px', color: '#475569' }}>
              Confirm authorization for <strong>{selectedAppt.visitorId?.fullName}</strong> ({selectedAppt.visitorId?.company}). An official QR pass badge will be generated in the database.
            </p>

            <div className="form-group">
              <label className="form-label">Host Approval Remarks / Gate Instructions</label>
              <textarea
                className="form-control"
                rows={3}
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="e.g. Please proceed to 3rd floor meeting room."
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={handleApprove}
                className="btn btn-success"
                style={{ flex: 1 }}
                disabled={processingAction}
              >
                {processingAction ? 'Saving to Database...' : 'Confirm Approval'}
              </button>
              <button onClick={() => setApproveModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HostDashboard;
