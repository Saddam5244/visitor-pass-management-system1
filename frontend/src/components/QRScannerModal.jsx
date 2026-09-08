import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, LogIn, LogOut, X, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import StatusPill from './StatusPill';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'manual'
  const [passNumberInput, setPassNumberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedPass, setScannedPass] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [selectedGate, setSelectedGate] = useState('Main Entrance');
  const [belongings, setBelongings] = useState('Laptop / Mobile');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    let qrInstance = null;

    if (isOpen && activeTab === 'camera' && !scannedPass) {
      const startScanner = async () => {
        try {
          setCameraError('');
          await new Promise((resolve) => setTimeout(resolve, 300));
          const element = document.getElementById('qr-reader-viewport');
          if (!element) return;

          qrInstance = new Html5Qrcode('qr-reader-viewport');
          html5QrCodeRef.current = qrInstance;

          const scannerConfig = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          };

          const onScanSuccess = (decodedText) => {
            handleVerify(decodedText);
            if (html5QrCodeRef.current?.isScanning) {
              html5QrCodeRef.current.stop().catch(() => {});
            }
          };

          // Try environment camera (mobile), then user webcam (laptops/desktops)
          try {
            await qrInstance.start({ facingMode: 'environment' }, scannerConfig, onScanSuccess, () => {});
          } catch (envErr) {
            console.warn('Environment camera unavailable, falling back to front/user webcam:', envErr);
            try {
              await qrInstance.start({ facingMode: 'user' }, scannerConfig, onScanSuccess, () => {});
            } catch (userErr) {
              const devices = await Html5Qrcode.getCameras().catch(() => []);
              if (devices && devices.length > 0) {
                await qrInstance.start(devices[0].id, scannerConfig, onScanSuccess, () => {});
              } else {
                throw userErr;
              }
            }
          }
        } catch (err) {
          console.warn('Camera start issue:', err);
          setCameraError('Webcam not detected or permission denied. Please switch to Manual Pass Entry.');
        }
      };

      startScanner();
    }

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen, activeTab, scannedPass]);

  const handleVerify = async (codeToVerify) => {
    let target = (codeToVerify || passNumberInput || '').trim();
    if (!target) {
      showToast('Please enter or scan a pass number', 'warning');
      return;
    }

    // If QR code contains a URL, extract pass number from path
    if (target.includes('/pass/')) {
      const parts = target.split('/pass/')[1].split('?')[0].split('/');
      target = parts[0];
    }

    // If target is a JSON string payload from the QR code
    try {
      const parsed = JSON.parse(target);
      if (parsed.passNumber) target = parsed.passNumber;
    } catch {}

    setLoading(true);
    try {
      const res = await api.post('/passes/verify-qr', { qrData: target });
      if (res.success && res.pass) {
        setScannedPass(res.pass);
        showToast(`Pass verified: ${res.pass.passNumber}`, 'success');
      } else {
        showToast(res.message || 'Pass verification failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Pass not found in database', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!scannedPass) return;
    setLoading(true);
    try {
      const res = await api.post('/checklogs/check-in', {
        passNumber: scannedPass.passNumber,
        gate: selectedGate,
        belongingsDeclared: belongings,
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 60 });
        showToast(res.message, 'success');
        if (onScanSuccess) onScanSuccess(res.checkLog);
        resetScanner();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!scannedPass) return;
    setLoading(true);
    try {
      const res = await api.post('/checklogs/check-out', {
        passNumber: scannedPass.passNumber,
        gate: selectedGate,
      });

      if (res.success) {
        showToast(res.message, 'success');
        if (onScanSuccess) onScanSuccess(res.checkLog);
        resetScanner();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Check-out failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedPass(null);
    setPassNumberInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera color="#2563eb" size={18} />
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>Scan or Enter Pass</h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '5px' }}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body">
          {!scannedPass && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
              <button
                className={`btn btn-sm ${activeTab === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('camera')}
                style={{ flex: 1 }}
              >
                <Camera size={14} /> Live Camera Scanner
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('manual')}
                style={{ flex: 1 }}
              >
                <Keyboard size={14} /> Pass ID / Barcode Entry
              </button>
            </div>
          )}

          {scannedPass ? (
            <div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '20px',
                      fontWeight: 700,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {scannedPass.visitorId?.photoUrl ? (
                      <img
                        src={scannedPass.visitorId.photoUrl}
                        alt="Visitor"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      scannedPass.visitorId?.fullName?.charAt(0) || 'V'
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '2px' }}>
                      {scannedPass.visitorId?.fullName}
                    </h3>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      {scannedPass.visitorId?.company || 'Independent'} • {scannedPass.visitorId?.phone}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <StatusPill status={scannedPass.status} />
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#eff6ff',
                          color: '#2563eb',
                        }}
                      >
                        {scannedPass.passNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '12px',
                    background: '#ffffff',
                    border: '1px solid #edf2f7',
                    padding: '10px',
                    borderRadius: '6px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b' }}>Host:</span>{' '}
                    <strong style={{ color: '#0f172a' }}>{scannedPass.hostId?.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Dept:</span>{' '}
                    <strong style={{ color: '#0f172a' }}>{scannedPass.hostId?.department}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Valid Until:</span>{' '}
                    <strong style={{ color: '#2563eb' }}>
                      {scannedPass.validTo ? new Date(scannedPass.validTo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Badge Type:</span>{' '}
                    <strong style={{ color: '#0f172a' }}>{scannedPass.badgeType}</strong>
                  </div>
                </div>
              </div>

              {/* Gate & Belongings Selector */}
              <div className="form-row" style={{ marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Gate</label>
                  <select
                    className="form-select"
                    value={selectedGate}
                    onChange={(e) => setSelectedGate(e.target.value)}
                  >
                    <option value="Main Entrance">Main Entrance</option>
                    <option value="VIP Gate">VIP Gate</option>
                    <option value="North Turnstile">North Turnstile</option>
                    <option value="Basement Parking">Basement Parking</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Belongings</label>
                  <input
                    type="text"
                    className="form-control"
                    value={belongings}
                    onChange={(e) => setBelongings(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCheckIn}
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  disabled={loading || scannedPass.status === 'CHECKED_IN'}
                >
                  <LogIn size={15} /> Check-In Visitor
                </button>
                <button
                  onClick={handleCheckOut}
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={loading || scannedPass.status !== 'CHECKED_IN'}
                >
                  <LogOut size={15} /> Check-Out Visitor
                </button>
                <button onClick={resetScanner} className="btn btn-secondary" title="Scan Another">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          ) : activeTab === 'camera' ? (
            <div>
              <div className="scanner-viewport">
                <div id="qr-reader-viewport" style={{ width: '100%', height: '100%' }} />
              </div>

              {cameraError ? (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    marginTop: '14px',
                    fontSize: '12px',
                    textAlign: 'center',
                  }}
                >
                  {cameraError}
                  <div style={{ marginTop: '6px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveTab('manual')}
                    >
                      Switch to Manual Entry
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                  Position the visitor's QR code within view of the camera
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Pass Number or QR Code String</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. VP-2026-1001"
                    value={passNumberInput}
                    onChange={(e) => setPassNumberInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    autoFocus
                  />
                  <button
                    onClick={() => handleVerify()}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    Lookup
                  </button>
                </div>
              </div>

              {/* Demo Database Passes */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                  Pre-Seeded Database Passes:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    className="role-pill-btn"
                    onClick={() => {
                      setPassNumberInput('VP-2026-1001');
                      handleVerify('VP-2026-1001');
                    }}
                  >
                    VP-2026-1001 (Alice)
                  </button>
                  <button
                    className="role-pill-btn"
                    onClick={() => {
                      setPassNumberInput('VP-2026-1002');
                      handleVerify('VP-2026-1002');
                    }}
                  >
                    VP-2026-1002 (Bob)
                  </button>
                  <button
                    className="role-pill-btn"
                    onClick={() => {
                      setPassNumberInput('VP-2026-1003');
                      handleVerify('VP-2026-1003');
                    }}
                  >
                    VP-2026-1003 (Claire)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
