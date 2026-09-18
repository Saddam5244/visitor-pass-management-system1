import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import {
  Camera,
  Keyboard,
  LogIn,
  LogOut,
  X,
  RefreshCw,
  Upload,
  QrCode as QrIcon,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import StatusPill from './StatusPill';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'upload', 'manual'
  const [passNumberInput, setPassNumberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedPass, setScannedPass] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [selectedGate, setSelectedGate] = useState('Main Entrance');
  const [belongings, setBelongings] = useState('Laptop / Mobile');

  // Camera devices
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  // Sample QR display helper
  const [showSampleQR, setShowSampleQR] = useState(false);
  const [sampleQRImage, setSampleQRImage] = useState('');
  const [samplePassNumber, setSamplePassNumber] = useState('VP-2026-1001');

  const html5QrCodeRef = useRef(null);

  // Generate Sample QR Code on request
  useEffect(() => {
    QRCode.toDataURL(samplePassNumber, {
      margin: 2,
      width: 260,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0f1d', light: '#ffffff' },
    })
      .then((url) => setSampleQRImage(url))
      .catch(() => {});
  }, [samplePassNumber]);

  // Handle Pass Verification
  const handleVerify = useCallback(
    async (codeToVerify) => {
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
    },
    [passNumberInput, showToast]
  );

  // Live Camera Scanner Lifecycle
  useEffect(() => {
    let qrInstance = null;

    if (isOpen && activeTab === 'camera' && !scannedPass) {
      const startScanner = async () => {
        try {
          setCameraError('');
          await new Promise((resolve) => setTimeout(resolve, 250));
          const element = document.getElementById('qr-reader-viewport');
          if (!element) return;

          qrInstance = new Html5Qrcode('qr-reader-viewport');
          html5QrCodeRef.current = qrInstance;

          // Fetch available cameras
          const devices = await Html5Qrcode.getCameras().catch(() => []);
          setCameras(devices || []);

          const scannerConfig = {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const edge = Math.max(160, Math.floor(minEdge * 0.75));
              return { width: edge, height: edge };
            },
            aspectRatio: 1.0,
          };

          const onScanSuccess = (decodedText) => {
            handleVerify(decodedText);
            if (html5QrCodeRef.current?.isScanning) {
              html5QrCodeRef.current.stop().catch(() => {});
            }
          };

          const cameraIdToUse = selectedCameraId || (devices && devices.length > 0 ? devices[0].id : null);

          if (cameraIdToUse) {
            await qrInstance.start(cameraIdToUse, scannerConfig, onScanSuccess, () => {});
          } else {
            // Default facing mode
            try {
              await qrInstance.start({ facingMode: 'environment' }, scannerConfig, onScanSuccess, () => {});
            } catch {
              await qrInstance.start({ facingMode: 'user' }, scannerConfig, onScanSuccess, () => {});
            }
          }
        } catch (err) {
          console.warn('Camera start issue:', err);
          setCameraError('Webcam not detected or permission denied. Switch to File Upload or Manual Entry.');
        }
      };

      startScanner();
    }

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen, activeTab, scannedPass, selectedCameraId, handleVerify]);

  // Handle Image File Upload Scanning
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let instance = html5QrCodeRef.current;
      if (!instance) {
        instance = new Html5Qrcode('qr-reader-file-dummy');
        html5QrCodeRef.current = instance;
      }
      const decodedText = await instance.scanFile(file, true);
      handleVerify(decodedText);
    } catch {
      showToast('Could not find a valid QR code in this image. Try another photo or enter pass ID.', 'warning');
    } finally {
      setLoading(false);
      e.target.value = '';
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
      <div className="modal-dialog" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
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
          {/* Tab Selector */}
          {!scannedPass && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <button
                className={`btn btn-sm ${activeTab === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('camera')}
                style={{ flex: 1, fontSize: '12px' }}
              >
                <Camera size={13} /> Live Camera
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('upload')}
                style={{ flex: 1, fontSize: '12px' }}
              >
                <Upload size={13} /> Upload QR
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('manual')}
                style={{ flex: 1, fontSize: '12px' }}
              >
                <Keyboard size={13} /> Manual / Test
              </button>
            </div>
          )}

          {/* Quick Helper Toggle to display a Sample QR code */}
          {!scannedPass && (
            <div style={{ marginBottom: '14px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowSampleQR(!showSampleQR)}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '11px',
                  background: showSampleQR ? '#fef3c7' : '#f8fafc',
                  color: showSampleQR ? '#92400e' : '#475569',
                  borderColor: showSampleQR ? '#fde68a' : '#cbd5e1',
                }}
              >
                <QrIcon size={13} /> {showSampleQR ? 'Hide Test QR Badge' : '⚡ Show Test QR Badge on Screen'}
              </button>
            </div>
          )}

          {/* Sample QR Display Drawer */}
          {showSampleQR && !scannedPass && (
            <div
              style={{
                background: '#fff',
                border: '2px dashed #93c5fd',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
                Test Visitor Pass QR Code
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                Hold your phone camera to this QR code or click "Instant Test Scan" below:
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
                {['VP-2026-1001', 'VP-2026-1002', 'VP-2026-1003'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setSamplePassNumber(code)}
                    className={`btn btn-sm ${samplePassNumber === code ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    {code}
                  </button>
                ))}
              </div>

              {sampleQRImage && (
                <div style={{ background: '#ffffff', display: 'inline-block', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <img
                    src={sampleQRImage}
                    alt="Sample QR Code"
                    style={{ width: '160px', height: '160px', display: 'block' }}
                  />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                    {samplePassNumber}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => handleVerify(samplePassNumber)}
                  className="btn btn-success btn-sm"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                  disabled={loading}
                >
                  <Sparkles size={13} /> Instant Test Scan ({samplePassNumber})
                </button>
              </div>
            </div>
          )}

          {/* SCANNED PASS DETAILS */}
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
                      {scannedPass.validTo
                        ? new Date(scannedPass.validTo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Today'}
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
              {/* Camera Selector Dropdown */}
              {cameras.length > 1 && (
                <div style={{ marginBottom: '10px' }}>
                  <select
                    className="form-select"
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    style={{ fontSize: '12px' }}
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Camera ${c.id.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="scanner-viewport">
                <div id="qr-reader-viewport" style={{ width: '100%', height: '100%' }} />
                <div className="scanner-laser" />
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
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('upload')}>
                      <Upload size={12} /> Upload QR Image
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('manual')}>
                      <Keyboard size={12} /> Manual Pass ID
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0, fontWeight: 500 }}>
                    Hold the visitor's QR code in front of the camera
                  </p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    (QR code ko camera ke saamne laayein)
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'upload' ? (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '30px 16px',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <Upload size={36} color="#2563eb" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Upload QR Code Image or Screenshot
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                  Select a picture containing the pass QR code from your phone or PC
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />

                <button type="button" className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
                  Choose Image File
                </button>
              </div>

              <div id="qr-reader-file-dummy" style={{ display: 'none' }} />
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
                  <button onClick={() => handleVerify()} className="btn btn-primary" disabled={loading}>
                    Lookup
                  </button>
                </div>
              </div>

              {/* Demo Database Passes */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
                  ⚡ Quick Test Passes (Click to Instant Scan):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    className="role-pill-btn"
                    style={{ justifyContent: 'space-between' }}
                    onClick={() => {
                      setPassNumberInput('VP-2026-1001');
                      handleVerify('VP-2026-1001');
                    }}
                  >
                    <span>
                      <strong>VP-2026-1001</strong> - Alice Johnson (Client Demo)
                    </span>
                    <span style={{ fontSize: '11px', color: '#2563eb' }}>Verify Pass →</span>
                  </button>
                  <button
                    className="role-pill-btn"
                    style={{ justifyContent: 'space-between' }}
                    onClick={() => {
                      setPassNumberInput('VP-2026-1002');
                      handleVerify('VP-2026-1002');
                    }}
                  >
                    <span>
                      <strong>VP-2026-1002</strong> - Bob Smith (Contractor Inside)
                    </span>
                    <span style={{ fontSize: '11px', color: '#2563eb' }}>Verify Pass →</span>
                  </button>
                  <button
                    className="role-pill-btn"
                    style={{ justifyContent: 'space-between' }}
                    onClick={() => {
                      setPassNumberInput('VP-2026-1003');
                      handleVerify('VP-2026-1003');
                    }}
                  >
                    <span>
                      <strong>VP-2026-1003</strong> - Claire Vance (Overstay Alert)
                    </span>
                    <span style={{ fontSize: '11px', color: '#2563eb' }}>Verify Pass →</span>
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
