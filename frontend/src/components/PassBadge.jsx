// ==========================================
// 1. Zaroori Libraries aur Components Import
// ==========================================
import QRCode from 'qrcode'; // QR Code generate karne ke liye library
import React, { useState, useEffect } from 'react'; // React ke basic hooks (state aur effect)
import { Download, Printer } from 'lucide-react'; // Download aur Printer ke sundar icons
import html2canvas from 'html2canvas'; // HTML card ko photo/image me convert karne ke liye
import api from '../services/api'; // Backend API call karne wala helper
import StatusPill from './StatusPill'; // Status (Approved/Checked-in) dikhane wala chota badge

// ====================================================
// 2. Download Options (User in formats me download karega)
// ====================================================
const FORMAT_OPTIONS = [
  { id: 'pdf', label: 'PDF Document', ext: '.pdf', icon: '📄', desc: 'Official printable PDF' },
  { id: 'png', label: 'PNG Image', ext: '.png', icon: '🖼️', desc: 'High-res card image' },
  { id: 'jpg', label: 'JPG Image', ext: '.jpg', icon: '📷', desc: 'Standard photo format' },
  { id: 'qr', label: 'QR Code Only', ext: '.png', icon: '🏁', desc: 'Direct scanner code' },
];

// ====================================================
// 3. Main PassBadge Component (Visitor Card UI)
// ====================================================
const PassBadge = ({ pass, visitor, host, organization }) => {
  // Yahan hum component ki states bana rahe hain
  const [qrImage, setQrImage] = useState(pass?.qrCodeData || null); // QR code image URL store karne ke liye
  const [selectedFormat, setSelectedFormat] = useState('pdf'); // User kaunsa format download karna chahta hai (default: pdf)
  const [isDownloading, setIsDownloading] = useState(false); // Download ke time loading dikhane ke liye

  // Yeh effect tab chalega jab pass ka data aayega ya change hoga
  useEffect(() => {
    // Agar pass ka data nahi hai toh aage kuch mat karo
    if (!pass) return;

    // Pass number ko QR code ke andar text ke roop me encode karenge
    const qrPayload = pass.passNumber || 'PASS-DEMO';

    // QRCode library se base64 image URL banate hain
    QRCode.toDataURL(qrPayload, {
      margin: 2,
      width: 260,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0f1d', light: '#ffffff' },
    })
      .then((url) => {
        // Successfully QR ban gaya, state me save kar lo
        setQrImage(url);
      })
      .catch(() => {
        // Agar koi error aaye toh backend ka purana QR code dikhao
        if (pass.qrCodeData) setQrImage(pass.qrCodeData);
      });
  }, [pass]);

  // Agar pass hi nahi mila toh screen par kuch mat dikhao
  if (!pass) return null;

  // Visitor, Host aur Company ki details alag variables me nikaal lete hain
  const currentVisitor = visitor || pass.visitorId;
  const currentHost = host || pass.hostId;
  const currentOrg = organization || pass.organizationId;

  // ====================================================
  // 4. Download Handle Function (PDF, PNG, JPG, QR Code)
  // ====================================================
  const handleDownload = async (format = selectedFormat) => {
    // Loading shuru kar rahe hain taaki button par status dikhe
    setIsDownloading(true);
    const passCode = pass.passNumber || 'PASS';

    try {
      // Option 1: Agar user ne PDF format chuna hai
      if (format === 'pdf') {
        try {
          // Backend server se official PDF file mangwate hain
          const blob = await api.downloadBlob(`/passes/${pass._id}/pdf`);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `VisitorBadge-${passCode}.pdf`;
          document.body.appendChild(a);
          a.click(); // Automatically browser me download start ho jayega
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (pdfErr) {
          console.warn('Backend PDF endpoint error, fallback to image...', pdfErr);
          // Agar server PDF me koi issue aaye toh card ka snapshot download kar do
          const badgeEl = document.getElementById('printable-badge');
          if (badgeEl) {
            const canvas = await html2canvas(badgeEl, {
              scale: 3,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
            });
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `VisitorBadge-${passCode}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
          }
        }
      } 
      // Option 2: Agar user ne PNG Image format chuna hai
      else if (format === 'png') {
        // Card wale HTML div ko pakadte hain
        const badgeEl = document.getElementById('printable-badge');
        if (!badgeEl) return;

        // html2canvas library se pure badge card ki photo banate hain
        const canvas = await html2canvas(badgeEl, {
          scale: 3, // 3x scale taaki photo bilkul clear aur HD aaye
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `VisitorBadge-${passCode}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } 
      // Option 3: Agar user ne JPG Image format chuna hai
      else if (format === 'jpg') {
        // Card wale HTML div ko pakadte hain
        const badgeEl = document.getElementById('printable-badge');
        if (!badgeEl) return;

        // html2canvas se JPEG image generate karte hain
        const canvas = await html2canvas(badgeEl, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/jpeg', 0.95);
        a.download = `VisitorBadge-${passCode}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } 
      // Option 4: Agar user ko sirf QR Code image download karni hai
      else if (format === 'qr') {
        // High resolution QR code direct generate kar rahe hain
        const qrDataUrl = await QRCode.toDataURL(passCode, {
          margin: 2,
          width: 600,
          errorCorrectionLevel: 'H',
          color: { dark: '#0a0f1d', light: '#ffffff' },
        });
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `QRCode-${passCode}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Download error: ' + (err.message || 'Please try again.'));
    } finally {
      // Download process complete hone ke baad loading false kar dete hain
      setIsDownloading(false);
    }
  };

  // Badge ko print karne ka simple function
  const handlePrint = () => {
    window.print();
  };

  // Date aur time ko ache format me dikhane ke liye format kar rahe hain
  const validToStr = pass.validTo ? new Date(pass.validTo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End of Day';
  const validDateStr = pass.validFrom ? new Date(pass.validFrom).toLocaleDateString() : new Date().toLocaleDateString();
  const activeFormatMeta = FORMAT_OPTIONS.find((f) => f.id === selectedFormat) || FORMAT_OPTIONS[0];

  return (
    <div>
      {/* ==================================================== */}
      {/* 5. Physical Lanyard Badge Card (Design & Details)    */}
      {/* ==================================================== */}
      <div className="pass-badge-container" id="printable-badge">
        {/* Card me lanyard taangne wala hole design */}
        <div className="badge-lanyard-hole" />

        {/* Top Header: Company ka naam aur Pass Type */}
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

        {/* Badge Card ki Body */}
        <div className="badge-body">
          {/* Visitor ki Photo */}
          <div className="badge-photo-wrapper">
            {currentVisitor?.photoUrl ? (
              <img
                src={
                  currentVisitor.photoUrl.startsWith('http') || currentVisitor.photoUrl.startsWith('data:')
                    ? currentVisitor.photoUrl
                    : (import.meta.env.PROD ? currentVisitor.photoUrl : `http://localhost:5000${currentVisitor.photoUrl}`)
                }
                alt={currentVisitor.fullName}
                crossOrigin="anonymous"
              />
            ) : (
              // Agar photo upload nahi hui toh visitor ke naam ka pehla letter dikhao
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

          {/* Visitor ka Naam aur Company */}
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

          {/* Pass ka status (Approved / Checked-In etc.) */}
          <div>
            <StatusPill status={pass.status} />
          </div>

          {/* Gate par scan karne ke liye QR Code */}
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

          {/* Visitor aur Host ki sari information grid */}
          <div className="badge-details-grid">
            {/* Host Employee ka Naam */}
            <div className="badge-detail-item">
              <div className="label">Host Employee</div>
              <div className="value">{currentHost?.name || 'Reception'}</div>
            </div>

            {/* Department */}
            <div className="badge-detail-item">
              <div className="label">Department</div>
              <div className="value">{currentHost?.department || 'Services'}</div>
            </div>

            {/* Pass Valid Date */}
            <div className="badge-detail-item">
              <div className="label">Valid Date</div>
              <div className="value">{validDateStr}</div>
            </div>

            {/* Pass Valid Time */}
            <div className="badge-detail-item">
              <div className="label">Valid Until</div>
              <div className="value" style={{ color: '#0284c7' }}>{validToStr}</div>
            </div>

            {/* Kis Gate se entry allowed hai */}
            <div className="badge-detail-item" style={{ gridColumn: 'span 2' }}>
              <div className="label">Authorized Gates</div>
              <div className="value" style={{ fontSize: '11px' }}>
                {pass.allowedGates?.length ? pass.allowedGates.join(', ') : 'Main Entrance'}
              </div>
            </div>
          </div>
        </div>

        {/* Badge Card ka Footer Rule */}
        <div className="badge-footer">
          <div>Display badge visibly at all times on company premises.</div>
          <div>Return or scan out at Security upon departure.</div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 6. Format Selector aur Action Buttons (No Print)     */}
      {/* ==================================================== */}
      <div
        className="no-print"
        style={{
          maxWidth: '400px',
          margin: '22px auto 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Format Selector Bar: User yahan format select karega */}
        <div
          style={{
            width: '100%',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary, #64748b)',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Choose Download Format</span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>{activeFormatMeta.desc}</span>
          </div>

          {/* Charon format ke selectable buttons (PDF, PNG, JPG, QR) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
            }}
          >
            {FORMAT_OPTIONS.map((opt) => {
              const isSelected = selectedFormat === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedFormat(opt.id)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid #0284c7' : '1px solid var(--border-color, #e2e8f0)',
                    background: isSelected ? '#f0f9ff' : 'var(--bg-primary, #f8fafc)',
                    color: isSelected ? '#0284c7' : 'var(--text-primary, #0f172a)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{opt.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700 }}>{opt.label.split(' ')[0]}</span>
                  <span style={{ fontSize: '9px', color: isSelected ? '#0369a1' : '#94a3b8' }}>
                    {opt.ext}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: Download aur Print Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {/* Selected Format me download karne ka main button */}
          <button
            onClick={() => handleDownload(selectedFormat)}
            disabled={isDownloading}
            className="btn btn-primary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <Download size={16} />
            {isDownloading
              ? `Generating ${selectedFormat.toUpperCase()}...`
              : `Download ${activeFormatMeta.label}`}
          </button>

          {/* Pass ko direct printer se print karne ka button */}
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '11px 16px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Printer size={16} /> Print Badge
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassBadge;
