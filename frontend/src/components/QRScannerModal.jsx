import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  Camera,
  LogIn,
  LogOut,
  X,
  RefreshCw,
  Upload,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Clipboard,
  Download,
  PlusCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import StatusPill from './StatusPill';

/**
 * Robust Multi-Engine QR Decoder:
 * 1. jsQR with multi-scale passes (Original, 1000px, 600px, 380px, 220px)
 * 2. jsQR with high-contrast luminance thresholding (for washed out / dark phone photos)
 * 3. Native Browser BarcodeDetector (Chrome/Edge hardware accelerated)
 * 4. Html5Qrcode ZXing engine
 */
const decodeQRFromImageFile = async (file) => {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);

  await new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to read image file'));
    img.src = objectUrl;
  });

  try {
    const originalWidth = img.naturalWidth || img.width;
    const originalHeight = img.naturalHeight || img.height;

    // A. Pass through jsQR at multiple downscale factors
    const targetSizes = [
      { w: originalWidth, h: originalHeight },
      { w: 1000, h: Math.round(originalHeight * (1000 / originalWidth)) },
      { w: 600, h: Math.round(originalHeight * (600 / originalWidth)) },
      { w: 380, h: Math.round(originalHeight * (380 / originalWidth)) },
      { w: 220, h: Math.round(originalHeight * (220 / originalWidth)) },
    ].filter((s) => s.w >= 40 && s.h >= 40 && s.w <= 2400 && s.h <= 2400);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    for (const size of targetSizes) {
      canvas.width = size.w;
      canvas.height = size.h;
      ctx.drawImage(img, 0, 0, size.w, size.h);

      // 1. Standard RGBA pass (normal & inverted)
      const imageData = ctx.getImageData(0, 0, size.w, size.h);
      let result = jsQR(imageData.data, size.w, size.h, {
        inversionAttempts: 'attemptBoth',
      });
      if (result && result.data && result.data.trim()) {
        return result.data.trim();
      }

      // 2. High-contrast binarization pass (fixes low contrast, phone screen reflections)
      const data = imageData.data;
      let totalLum = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLum = totalLum / pixelCount;

      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const val = lum > avgLum ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      result = jsQR(data, size.w, size.h, {
        inversionAttempts: 'attemptBoth',
      });
      if (result && result.data && result.data.trim()) {
        return result.data.trim();
      }
    }

    // B. Try Native Chromium BarcodeDetector
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'data_matrix'] });
        const detected = await detector.detect(img);
        if (detected && detected.length > 0 && detected[0].rawValue) {
          return detected[0].rawValue.trim();
        }
      } catch (e) {
        console.warn('BarcodeDetector pass error:', e);
      }
    }

    // C. Try Html5Qrcode sandbox
    const sandboxEl = document.getElementById('qr-file-scan-sandbox');
    if (sandboxEl) {
      try {
        const html5qr = new Html5Qrcode('qr-file-scan-sandbox');
        const text = await html5qr.scanFile(file, false);
        try { html5qr.clear(); } catch {}
        if (text && text.trim()) return text.trim();
      } catch {}
    }

    throw new Error('No QR code detected in this image');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'upload', 'generate', 'manual'
  const [passNumberInput, setPassNumberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedPass, setScannedPass] = useState(null);
  const [externalScan, setExternalScan] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [selectedGate, setSelectedGate] = useState('Main Entrance');
  const [belongings, setBelongings] = useState('Laptop / Mobile');
  const [uploadError, setUploadError] = useState('');
  const [uploadedPreview, setUploadedPreview] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Instant Generator State
  const [genVisitorName, setGenVisitorName] = useState('Rahul Verma');
  const [genCompany, setGenCompany] = useState('Tech Solutions');
  const [genHostId, setGenHostId] = useState('');
  const [genPurpose, setGenPurpose] = useState('Meeting');
  const [hostsList, setHostsList] = useState([]);
  const [generatingPass, setGeneratingPass] = useState(false);
  const [lastGeneratedPass, setLastGeneratedPass] = useState(null);
  const [lastGeneratedQR, setLastGeneratedQR] = useState('');

  // Camera devices
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  // Sample QR display helper
  const [sampleQRImage, setSampleQRImage] = useState('');
  const [samplePassNumber, setSamplePassNumber] = useState('VP-2026-1001');

  // Test QR codes for instant scanning under camera
  const [testPasses, setTestPasses] = useState([
    {
      number: 'VP-2026-1001',
      name: 'Alice Johnson',
      tag: 'Client Demo',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d',
      qrUrl: '',
    },
    {
      number: 'VP-2026-1002',
      name: 'Bob Smith',
      tag: 'Contractor',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      qrUrl: '',
    },
    {
      number: 'VP-2026-1003',
      name: 'Claire Redfield',
      tag: 'Overstay',
      badgeBg: '#fee2e2',
      badgeColor: '#b91c1c',
      qrUrl: '',
    },
  ]);

  const html5QrCodeRef = useRef(null);

  // Fetch hosts when generator is opened
  useEffect(() => {
    if (activeTab === 'generate' && hostsList.length === 0) {
      api
        .get('/auth/hosts')
        .then((res) => {
          if (res.success && res.hosts) {
            setHostsList(res.hosts);
            if (res.hosts.length > 0 && !genHostId) {
              setGenHostId(res.hosts[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeTab, hostsList.length, genHostId]);

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

  // Generate real QR code data URLs for camera test badges
  useEffect(() => {
    const list = [
      {
        number: 'VP-2026-1001',
        name: 'Alice Johnson',
        tag: 'Client Demo',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
      },
      {
        number: 'VP-2026-1002',
        name: 'Bob Smith',
        tag: 'Contractor',
        badgeBg: '#fef3c7',
        badgeColor: '#b45309',
      },
      {
        number: 'VP-2026-1003',
        name: 'Claire Redfield',
        tag: 'Overstay',
        badgeBg: '#fee2e2',
        badgeColor: '#b91c1c',
      },
    ];

    Promise.all(
      list.map(async (item) => {
        try {
          const qrUrl = await QRCode.toDataURL(item.number, {
            margin: 1,
            width: 140,
            errorCorrectionLevel: 'M',
            color: { dark: '#0a0f1d', light: '#ffffff' },
          });
          return { ...item, qrUrl };
        } catch {
          return item;
        }
      })
    ).then((res) => setTestPasses(res));
  }, []);

  // Handle Pass Verification & External QR Handling
  const handleVerify = useCallback(
    async (codeToVerify) => {
      let target = (codeToVerify || passNumberInput || '').trim();
      if (!target) {
        showToast('Please enter or scan a pass number', 'warning');
        return;
      }

      setLoading(true);
      setScannedPass(null);
      setExternalScan(null);
      setUploadError('');

      // Clean target if URL
      let lookupCode = target;
      if (lookupCode.includes('/pass/')) {
        const parts = lookupCode.split('/pass/')[1].split('?')[0].split('/');
        if (parts[0]) lookupCode = parts[0];
      }

      // Parse JSON if QR contains a JSON payload
      try {
        const parsed = JSON.parse(lookupCode);
        if (parsed.passNumber) lookupCode = parsed.passNumber;
      } catch {}

      try {
        const res = await api.post('/passes/verify-qr', { qrData: lookupCode });
        if (res.success && res.pass) {
          setScannedPass(res.pass);
          showToast(`Pass verified: ${res.pass.passNumber}`, 'success');
        } else {
          // Detected QR is external or not an active pass in PassPulse
          setExternalScan({
            data: target,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            message: res.message || 'External QR Code (Not registered as an active PassPulse badge)',
          });
          showToast('External QR decoded successfully!', 'info');
        }
      } catch (err) {
        setExternalScan({
          data: target,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          message: err.message || 'External QR Code (Not found in system database)',
        });
        showToast('External QR detected!', 'info');
      } finally {
        setLoading(false);
      }
    },
    [passNumberInput, showToast]
  );

  // Generate a brand new live pass in the database with instant QR code
  const handleGenerateNewPass = async (e) => {
    if (e) e.preventDefault();
    setGeneratingPass(true);
    try {
      const res = await api.post('/visitors/register', {
        fullName: genVisitorName || 'Rahul Verma',
        email: `visitor.${Date.now()}@instantpass.local`,
        phone: '9876543210',
        company: genCompany || 'Tech Solutions',
        purpose: genPurpose || 'Meeting',
        hostId: genHostId || (hostsList[0]?._id),
        autoApprove: true,
      });

      if (res.success && res.pass) {
        setLastGeneratedPass(res.pass);
        const qrUrl = await QRCode.toDataURL(res.pass.passNumber, {
          margin: 2,
          width: 320,
          errorCorrectionLevel: 'M',
          color: { dark: '#0a0f1d', light: '#ffffff' },
        });
        setLastGeneratedQR(qrUrl);
        confetti({ particleCount: 70, spread: 60 });
        showToast(`Pass ${res.pass.passNumber} issued with QR Code!`, 'success');
      } else {
        showToast(res.message || 'Pass created', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate pass', 'error');
    } finally {
      setGeneratingPass(false);
    }
  };

  // Download QR Code as PNG image file
  const downloadQRFile = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename || 'pass'}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('QR Code image downloaded to your PC!', 'success');
  };

  // Process an uploaded Image File (from file picker, drag & drop, or clipboard paste)
  const processImageFile = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, WebP)', 'warning');
        return;
      }

      // Set thumbnail preview
      const previewUrl = URL.createObjectURL(file);
      setUploadedPreview(previewUrl);
      setLoading(true);
      setUploadError('');

      // Stop camera if running
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop().catch(() => {});
      }

      try {
        const decodedText = await decodeQRFromImageFile(file);
        if (decodedText) {
          handleVerify(decodedText);
        } else {
          throw new Error('No QR text found');
        }
      } catch (err) {
        console.warn('QR file scan error:', err);
        setUploadError(
          'Could not detect a QR code in this image. If the QR is small or blurry, try cropping closer to the QR code, or enter the ID below.'
        );
      } finally {
        setLoading(false);
      }
    },
    [handleVerify, showToast]
  );

  // Clipboard Paste listener (Ctrl + V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            setActiveTab('upload');
            processImageFile(file);
            showToast('Image pasted from clipboard!', 'info');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, processImageFile, showToast]);

  // Live Camera Scanner Lifecycle
  useEffect(() => {
    let qrInstance = null;

    if (isOpen && activeTab === 'camera' && !scannedPass && !externalScan) {
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
  }, [isOpen, activeTab, scannedPass, externalScan, selectedCameraId, handleVerify]);

  // Check-In for Verified System Pass
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

  // Check-In for External / Guest QR
  const handleGuestCheckIn = async () => {
    if (!externalScan) return;
    setLoading(true);
    try {
      const res = await api.post('/checklogs/check-in', {
        passNumber: externalScan.data,
        gate: selectedGate,
        belongingsDeclared: belongings,
        isGuest: true,
        createGuestIfMissing: true,
        guestName: guestName || 'Walk-in Visitor',
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 60 });
        showToast(res.message || 'Guest checked in successfully!', 'success');
        if (onScanSuccess) onScanSuccess(res.checkLog);
        resetScanner();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Guest check-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check-Out for Verified System Pass
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

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    showToast('QR data copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetScanner = () => {
    setScannedPass(null);
    setExternalScan(null);
    setPassNumberInput('');
    setGuestName('');
    setUploadError('');
    setUploadedPreview('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* Hidden dedicated sandbox container */}
      <div
        id="qr-file-scan-sandbox"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '320px',
          height: '320px',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      />

      <div className="modal-dialog" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
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
          {/* Tab Selector (Hidden if a pass or external result is active) */}
          {!scannedPass && !externalScan && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              <button
                className={`btn btn-sm ${activeTab === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setActiveTab('camera');
                  setUploadError('');
                }}
                style={{ flex: 1, fontSize: '11px', padding: '7px 4px' }}
              >
                <Camera size={12} /> Camera
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setActiveTab('upload');
                  setUploadError('');
                }}
                style={{ flex: 1, fontSize: '11px', padding: '7px 4px' }}
              >
                <Upload size={12} /> Upload QR
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'generate' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setActiveTab('generate');
                  setUploadError('');
                }}
                style={{ flex: 1.1, fontSize: '11px', padding: '7px 4px', background: activeTab === 'generate' ? '#2563eb' : '#eff6ff', color: activeTab === 'generate' ? '#fff' : '#1d4ed8' }}
              >
                <Sparkles size={12} /> ✨ Generate QR
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. SCENARIO: VERIFIED INTERNAL PASSPULSE PASS             */}
          {/* ========================================================= */}
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
          ) : externalScan ? (
            /* ========================================================= */
            /* 2. SCENARIO: EXTERNAL / UNREGISTERED QR CODE DECODED      */
            /* ========================================================= */
            <div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={24} color="#059669" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ fontSize: '1.05rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                        QR Code Successfully Decoded!
                      </h3>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                      Scanned at {externalScan.timestamp}
                    </p>
                  </div>
                </div>

                {/* Decoded QR Raw Content Display */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Decoded Content / Payload:
                    </label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(externalScan.data)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                      }}
                    >
                      {copied ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '12px',
                      fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      color: '#0f172a',
                      wordBreak: 'break-all',
                      maxHeight: '110px',
                      overflowY: 'auto',
                    }}
                  >
                    {externalScan.data}
                  </div>
                </div>

                {/* External Status Banner */}
                <div
                  style={{
                    background: '#fffbeb',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    border: '1px solid #fef3c7',
                    fontSize: '12px',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={16} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong>External or Unregistered QR:</strong> This code is not linked to a pre-issued PassPulse pass.
                    You can check them in as a <strong>Walk-in Guest</strong> or register them as a visitor.
                  </div>
                </div>
              </div>

              {/* Guest Check-in Controls */}
              <div className="form-row" style={{ marginBottom: '14px' }}>
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
                  <label className="form-label">Visitor Name / Note</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Guest Visitor / Delivery"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons for External QR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleGuestCheckIn}
                  className="btn btn-success"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                  disabled={loading}
                >
                  <LogIn size={15} /> Quick Check-In as Walk-In Guest
                </button>

                <button
                  onClick={resetScanner}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <RefreshCw size={13} /> Scan Another QR
                </button>
              </div>
            </div>
          ) : activeTab === 'generate' ? (
            /* ========================================================= */
            /* 3. SCENARIO: INSTANT QR CODE PASS GENERATOR TAB           */
            /* ========================================================= */
            <div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Sparkles size={18} color="#2563eb" />
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                    Generate Live Visitor Pass & QR Code
                  </h4>
                </div>

                <form onSubmit={handleGenerateNewPass}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                        Visitor Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={genVisitorName}
                        onChange={(e) => setGenVisitorName(e.target.value)}
                        placeholder="e.g. Rahul Verma"
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                        Company / Org
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={genCompany}
                        onChange={(e) => setGenCompany(e.target.value)}
                        placeholder="e.g. Tech Solutions"
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                        Meeting Host
                      </label>
                      <select
                        className="form-select"
                        value={genHostId}
                        onChange={(e) => setGenHostId(e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                      >
                        {hostsList.map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.name} ({h.department})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                        Purpose
                      </label>
                      <select
                        className="form-select"
                        value={genPurpose}
                        onChange={(e) => setGenPurpose(e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                      >
                        <option value="Meeting">Meeting</option>
                        <option value="Interview">Interview</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Vendor / Contractor">Vendor / Contractor</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
                    disabled={generatingPass}
                  >
                    {generatingPass ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={14} /> Create Pass & Generate QR Code
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Display Newly Generated QR Code */}
              {lastGeneratedQR && lastGeneratedPass ? (
                <div
                  style={{
                    background: '#ffffff',
                    border: '2px solid #2563eb',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.08)',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>
                    <CheckCircle2 size={13} /> Official QR Code Generated
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <img
                      src={lastGeneratedQR}
                      alt="Generated Pass QR"
                      style={{
                        width: '180px',
                        height: '180px',
                        margin: '0 auto',
                        display: 'block',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {lastGeneratedPass.visitorId?.fullName || genVisitorName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                    Pass: {lastGeneratedPass.passNumber}
                  </div>

                  {/* Actions for Generated QR */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => downloadQRFile(lastGeneratedQR, lastGeneratedPass.passNumber)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Download size={13} /> Download QR (.png)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(lastGeneratedPass.passNumber)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      ⚡ Test Scan This Pass
                    </button>
                  </div>
                </div>
              ) : (
                /* Preset Sample QR Showcase */
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '10px',
                    padding: '14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Or use pre-seeded test passes with instant QR:
                  </div>
                  {sampleQRImage && (
                    <img
                      src={sampleQRImage}
                      alt="Sample QR"
                      style={{
                        width: '130px',
                        height: '130px',
                        margin: '0 auto 8px',
                        display: 'block',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  )}
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '10px' }}>
                    {['VP-2026-1001', 'VP-2026-1002', 'VP-2026-1003'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setSamplePassNumber(code)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '10px',
                          padding: '3px 8px',
                          background: samplePassNumber === code ? '#2563eb' : '#fff',
                          color: samplePassNumber === code ? '#fff' : '#1e293b',
                        }}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => downloadQRFile(sampleQRImage, samplePassNumber)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px' }}
                    >
                      <Download size={12} /> Download {samplePassNumber}.png
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(samplePassNumber)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '11px' }}
                    >
                      ⚡ Test Scan Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'upload' ? (
            /* ========================================================= */
            /* 5. SCENARIO: ULTRA-ROBUST FILE UPLOAD & DROP SCANNER      */
            /* ========================================================= */
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) processImageFile(droppedFile);
                }}
                style={{
                  border: isDragging ? '2px dashed #2563eb' : '2px dashed #94a3b8',
                  borderRadius: '12px',
                  padding: uploadedPreview ? '18px 16px' : '28px 16px',
                  background: isDragging ? '#eff6ff' : '#f8fafc',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <div style={{ padding: '16px 0' }}>
                    <RefreshCw size={36} color="#2563eb" className="animate-spin" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                      Decoding QR Code...
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Multi-scale pixel analysis in progress
                    </p>
                  </div>
                ) : (
                  <>
                    {uploadedPreview ? (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={uploadedPreview}
                            alt="Uploaded QR Preview"
                            style={{
                              maxHeight: '140px',
                              maxWidth: '100%',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                          Click or drop another picture to replace
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={38} color="#2563eb" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                          Upload QR Code Image or Screenshot
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', maxWidth: '360px', margin: '0 auto 14px' }}>
                          Select or Drag & Drop any picture containing a QR code (PNG, JPG, WebP)
                        </p>
                      </>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file);
                        e.target.value = '';
                      }}
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

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button type="button" className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
                        <ImageIcon size={13} /> {uploadedPreview ? 'Change Image' : 'Choose Image File'}
                      </button>
                    </div>

                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Clipboard size={12} /> Or press <strong>Ctrl + V</strong> anywhere to paste screenshot
                    </div>
                  </>
                )}
              </div>

              {/* In-modal Error Feedback with Instant Manual Fallback */}
              {uploadError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    fontSize: '12px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <AlertTriangle size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
                    <div>{uploadError}</div>
                  </div>

                  {/* Instant Manual Pass Entry Form inside the Upload Tab */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      padding: '10px',
                      marginTop: '8px',
                    }}
                  >
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      Enter Pass Number or QR Code text manually:
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. VP-2026-1001 or any code"
                        value={passNumberInput}
                        onChange={(e) => setPassNumberInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                      />
                      <button
                        onClick={() => handleVerify()}
                        className="btn btn-primary btn-sm"
                        disabled={loading || !passNumberInput.trim()}
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* 5. SCENARIO: LIVE CAMERA SCANNER VIEW (DEFAULT)           */
            /* ========================================================= */
            <div>
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
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0, fontWeight: 500 }}>
                    Hold the visitor's QR code in front of the camera
                  </p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    (Supports internal passes or any external visitor QR code)
                  </p>
                </div>
              )}

              {/* Sample QR Badges below camera to test/scan */}
              <div
                style={{
                  marginTop: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={13} color="#2563eb" /> Test QR Codes (Click or Hold to Camera):
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    Tap badge to test instant scan
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {testPasses.map((pass) => (
                    <div
                      key={pass.number}
                      onClick={() => {
                        setPassNumberInput(pass.number);
                        handleVerify(pass.number);
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '8px 6px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                      }}
                      title={`Scan ${pass.number} (${pass.name})`}
                    >
                      {pass.qrUrl ? (
                        <img
                          src={pass.qrUrl}
                          alt={pass.number}
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <div style={{ width: '64px', height: '64px', background: '#e2e8f0', borderRadius: '4px' }} />
                      )}
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        {pass.number}
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {pass.name}
                      </div>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          background: pass.badgeBg,
                          color: pass.badgeColor,
                        }}
                      >
                        {pass.tag}
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{
                          width: '100%',
                          fontSize: '10px',
                          padding: '3px 0',
                          marginTop: '3px',
                          justifyContent: 'center',
                        }}
                      >
                        Scan QR →
                      </button>
                    </div>
                  ))}
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
