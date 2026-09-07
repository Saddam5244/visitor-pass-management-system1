import React from 'react';
import { Download, Printer, ShieldCheck, Clock, UserCheck, Building } from 'lucide-react';
import api from '../services/api';
import StatusPill from './StatusPill';

const PassBadge = ({ pass, visitor, host, organization, onStatusChange }) => {
  if (!pass) return null;

  const currentVisitor = visitor || pass.visitorId;
  const currentHost = host || pass.hostId;
  const currentOrg = organization || pass.organizationId;

  const handleDownloadPDF = async () => {
    try {
      const blob = await api.downloadBlob(`/passes/${pass._id}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VisitorBadge-${pass.passNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Could not download PDF: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const validToStr = pass.validTo ? new Date(pass.validTo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End of Day';
  const validDateStr = pass.validFrom ? new Date(pass.validFrom).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <div>
      {/* Physical Lanyard-style Badge Card */}
      <div className="pass-badge-container" id="printable-badge">
        <div className="badge-lanyard-hole" />

        {/* Top Header */}
        <div className="badge-header">
          <div className="badge-org-title">
            {currentOrg?.name || 'APEX GLOBAL TECH'}
          </div>
          <div>
            <span className="badge-type-pill">
              {pass.badgeType || 'VISITOR'} PASS
            </span>
          </div>
        </div>

        {/* Badge Body */}
        <div className="badge-body">
          {/* Visitor Photo */}
          <div className="badge-photo-wrapper">
            {currentVisitor?.photoUrl ? (
              <img
                src={
                  currentVisitor.photoUrl.startsWith('http') || currentVisitor.photoUrl.startsWith('data:')
                    ? currentVisitor.photoUrl
                    : `http://localhost:5000${currentVisitor.photoUrl}`
                }
                alt={currentVisitor.fullName}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #0284c7, #0f172a)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '28px',
                }}
              >
                {currentVisitor?.fullName ? currentVisitor.fullName.charAt(0).toUpperCase() : 'V'}
              </div>
            )}
          </div>

          <div className="badge-visitor-name">{currentVisitor?.fullName || 'Visitor'}</div>
          <div className="badge-visitor-company">{currentVisitor?.company || 'Independent Guest'}</div>

          {/* Pass Number Pill */}
          <div
            style={{
              margin: '10px 0 6px',
              display: 'inline-block',
              background: '#e0f2fe',
              color: '#0369a1',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '0.08em',
              padding: '4px 14px',
              borderRadius: '20px',
            }}
          >
            {pass.passNumber}
          </div>

          <div>
            <StatusPill status={pass.status} />
          </div>

          {/* Scannable QR Code */}
          <div className="badge-qr-box">
            {pass.qrCodeData ? (
              <img src={pass.qrCodeData} alt={`QR Code for ${pass.passNumber}`} />
            ) : (
              <div style={{ width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Generating QR...
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
              SCAN TO VERIFY / CHECK-IN
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="badge-details-grid">
            <div className="badge-detail-item">
              <div className="label">Host Employee</div>
              <div className="value">{currentHost?.name || 'Reception'}</div>
            </div>

            <div className="badge-detail-item">
              <div className="label">Department</div>
              <div className="value">{currentHost?.department || 'Services'}</div>
            </div>

            <div className="badge-detail-item">
              <div className="label">Valid Date</div>
              <div className="value">{validDateStr}</div>
            </div>

            <div className="badge-detail-item">
              <div className="label">Valid Until</div>
              <div className="value" style={{ color: '#0284c7' }}>{validToStr}</div>
            </div>

            <div className="badge-detail-item" style={{ gridColumn: 'span 2' }}>
              <div className="label">Authorized Gates</div>
              <div className="value" style={{ fontSize: '11px' }}>
                {pass.allowedGates?.length ? pass.allowedGates.join(', ') : 'Main Entrance'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="badge-footer">
          <div>Display badge visibly at all times on company premises.</div>
          <div>Return or scan out at Security upon departure.</div>
        </div>
      </div>

      {/* Action Buttons (Excluded from print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '20px',
        }}
      >
        <button onClick={handleDownloadPDF} className="btn btn-primary">
          <Download size={16} /> Download Official PDF Badge
        </button>
        <button onClick={handlePrint} className="btn btn-secondary">
          <Printer size={16} /> Print Badge
        </button>
      </div>
    </div>
  );
};

export default PassBadge;
