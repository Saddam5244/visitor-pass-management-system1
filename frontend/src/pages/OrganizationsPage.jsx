import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  RefreshCw,
  DoorOpen,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';

const OrganizationsPage = () => {
  const { showToast } = useNotification();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Org Modal
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgData, setOrgData] = useState({
    name: '',
    code: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    branchName: 'Main Campus',
    gates: 'Main Entrance, North Turnstile, Basement Parking',
  });
  const [submittingOrg, setSubmittingOrg] = useState(false);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organizations');
      if (res.success && res.organizations) {
        setOrganizations(res.organizations);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setSubmittingOrg(true);
    try {
      const branches = [
        {
          name: orgData.branchName,
          code: orgData.code + '-1',
          address: orgData.address,
          gates: orgData.gates.split(',').map((g) => g.trim()),
        },
      ];

      const res = await api.post('/organizations', {
        name: orgData.name,
        code: orgData.code,
        address: orgData.address,
        contactEmail: orgData.contactEmail,
        contactPhone: orgData.contactPhone,
        branches,
      });

      if (res.success) {
        showToast(`Organization ${orgData.name} saved in database!`, 'success');
        setOrgModalOpen(false);
        setOrgData({
          name: '',
          code: '',
          address: '',
          contactEmail: '',
          contactPhone: '',
          branchName: 'Main Campus',
          gates: 'Main Entrance, North Turnstile, Basement Parking',
        });
        fetchOrganizations();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create organization', 'error');
    } finally {
      setSubmittingOrg(false);
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
            <Building2 color="#2563eb" size={24} /> Organizations & Campuses
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Multi-organization entities, branch locations, and gate clearance definitions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchOrganizations} className="btn btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setOrgModalOpen(true)} className="btn btn-primary">
            <Plus size={15} /> Add Organization
          </button>
        </div>
      </div>

      {/* Organizations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            Loading organizations from database...
          </div>
        ) : organizations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
            No organizations registered yet.
          </div>
        ) : (
          organizations.map((org) => (
            <div key={org._id} className="card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '14px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>{org.name}</h2>
                    <span
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      {org.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    {org.address || 'Headquarters'} • {org.contactEmail}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      background: '#ecfdf5',
                      color: '#059669',
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    Active Organization
                  </span>
                </div>
              </div>

              {/* Campuses Sub-Grid */}
              <div>
                <h4 style={{ color: '#475569', marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Branch Locations & Access Gates ({org.branches?.length || 0})
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {org.branches?.map((branch, bIdx) => (
                    <div
                      key={bIdx}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '14px',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', marginBottom: '2px' }}>
                        {branch.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                        Code: <strong style={{ color: '#2563eb' }}>{branch.code}</strong> • {branch.address || 'Campus Grounds'}
                      </div>

                      <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                        <DoorOpen size={12} style={{ display: 'inline', marginRight: '3px' }} />
                        Configured Gates:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {branch.gates?.map((gate, gIdx) => (
                          <span
                            key={gIdx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: '#334155',
                            }}
                          >
                            {gate}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Organization Modal */}
      <Modal
        isOpen={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        title="Register Enterprise Organization"
      >
        <form onSubmit={handleCreateOrg}>
          <div className="form-group">
            <label className="form-label">Organization Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Acme Corporation"
              value={orgData.name}
              onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Organization Code *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. ACME"
                value={orgData.code}
                onChange={(e) => setOrgData({ ...orgData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="info@acme.com"
                value={orgData.contactEmail}
                onChange={(e) => setOrgData({ ...orgData, contactEmail: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Branch / Building Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Headquarters Tower"
              value={orgData.branchName}
              onChange={(e) => setOrgData({ ...orgData, branchName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Authorized Gates (comma-separated)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Main Gate, Turnstile East, VIP Entrance"
              value={orgData.gates}
              onChange={(e) => setOrgData({ ...orgData, gates: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={submittingOrg}
            >
              {submittingOrg ? 'Saving to Database...' : 'Create Organization'}
            </button>
            <button
              type="button"
              onClick={() => setOrgModalOpen(false)}
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

export default OrganizationsPage;
