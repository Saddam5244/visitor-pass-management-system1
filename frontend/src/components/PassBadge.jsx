import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, ShieldCheck, Clock, UserCheck, Building } from 'lucide-react';
import api from '../services/api';
import StatusPill from './StatusPill';

const PassBadge = ({ pass, visitor, host, organization, onStatusChange }) => {
  if (!pass) return null;

  const currentVisitor = visitor || pass.visitorId;
  const currentHost = host || pass.hostId;
  const currentOrg = organization || pass.organizationId;

  const [qrImage, setQrImage] = useState(pass.qrCodeData || null);

  useEffect(() => {
    if (pass.qrCodeData && pass.qrCodeData.startsWith('data:image')) {
      setQrImage(pass.qrCodeData);
      return;
    }

    // Generate crisp QR code on the fly from pass details
    const qrPayload = JSON.stringify({
      passNumber: pass.passNumber,
      visitor: currentVisitor?.fullName || '',
      validTo: pass.validTo || '',
      issuedAt: pass.validFrom || new Date().toISOString(),
    });

    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 240,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setQrImage(url))
      .catch(() => {
        // Fallback to passNumber string
        QRCode.toDataURL(pass.passNumber || 'PASS-DEMO', { margin: 1, width: 240 })
          .then((url) => setQrImage(url))
          .catch(() => {});
      });
  }, [pass.passNumber, pass.qrCodeData, currentVisitor?.fullName, pass.validTo, pass.validFrom]);

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
                    : (import.meta.env.PROD ? currentVisitor.photoUrl : `http://localhost:5000${currentVisitor.photoUrl}`)
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
            {qrImage ? (
              <img
                src={qrImage}
                alt={`QR Code for ${pass.passNumber}`}
                style={{ width: '135px', height: '135px', display: 'block', margin: '0 auto', borderRadius: '4px' }}
              />
            ) : (
              <div style={{ width: 135, height: 135, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px' }}>
                Rendering QR Code...
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', fontWeight: 600, letterSpacing: '0.04em' }}>
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
