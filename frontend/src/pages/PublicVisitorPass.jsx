import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Camera,
  CheckCircle2,
  Mail,
  Building,
  Clock,
  ArrowRight,
  Upload,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import PassBadge from '../components/PassBadge';

const PublicVisitorPass = () => {
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    idProofType: 'National ID',
    idProofNumber: '',
    hostId: '',
    branchName: 'HQ Tech Tower',
    purpose: 'Meeting',
    customPurpose: '',
    scheduledStartTime: new Date().toISOString().slice(0, 16),
    scheduledEndTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16),
    photoUrl: '',
  });

  const [hosts, setHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(true);

  // OTP State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Camera & Photo State
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [generatedPass, setGeneratedPass] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const res = await api.get('/auth/hosts');
        if (res.success && res.hosts) {
          setHosts(res.hosts);
          if (res.hosts.length > 0) {
            setFormData((prev) => ({ ...prev, hostId: res.hosts[0]._id }));
          }
        }
      } catch (err) {
        console.error('Error fetching hosts:', err);
      } finally {
        setLoadingHosts(false);
      }
    };

    fetchHosts();
  }, []);

  // Request OTP from MongoDB
  const handleSendOTP = async () => {
    if (!formData.email && !formData.phone) {
      showToast('Please enter an email or phone number first', 'warning');
      return;
    }

    const identifier = formData.email || formData.phone;
    setOtpLoading(true);
    try {
      const res = await api.post('/visitors/otp/request', {
        identifier,
        name: formData.fullName,
      });

      if (res.success) {
        setOtpSentTo(identifier);
        setDemoOtpHint(res.demoOtp || '');
        setOtpModalOpen(true);
        showToast(`Verification code sent to ${identifier}!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to send OTP', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP against MongoDB
  const handleVerifyOTP = async () => {
    if (!otpInput) {
      showToast('Please enter the 6-digit code', 'warning');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await api.post('/visitors/otp/verify', {
        identifier: otpSentTo,
        code: otpInput,
      });

      if (res.success) {
        setIsOtpVerified(true);
        setOtpModalOpen(false);
        showToast('Identity verified successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Invalid code. Try again or enter 999999 for demo.', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraActive(false);
      showToast('Webcam not available. Please upload an image file instead.', 'warning');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 300, 300);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));

    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    showToast('Photo captured!', 'success');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result }));
        showToast('Photo attached!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.hostId) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    if (!isOtpVerified) {
      showToast('Please verify your email/phone with OTP first', 'warning');
      handleSendOTP();
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/visitors/register', formData);
      if (res.success) {
        setSubmissionStatus(res.status);
        if (res.pass) {
          setGeneratedPass(res.pass);
          confetti({ particleCount: 90, spread: 60 });
          showToast('Pass issued and stored in database!', 'success');
        } else {
          showToast('Pre-registration saved! Awaiting host authorization.', 'success');
        }
      }
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px', maxWidth: '800px', margin: '0 auto', background: '#f8fafc' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '4px' }}>Visitor Registration</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Fill in your visit details to receive a digital visitor badge.
        </p>
      </div>

      {generatedPass ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ color: '#059669', marginBottom: '16px' }}>
            <CheckCircle2 size={44} style={{ margin: '0 auto 8px' }} />
            <h2 style={{ color: '#059669', fontSize: '1.4rem' }}>Pass Issued Successfully!</h2>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              Your pass has been recorded in the database. Present this badge upon arrival.
            </p>
          </div>

          <PassBadge pass={generatedPass} visitor={generatedPass.visitorId} host={generatedPass.hostId} />

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setGeneratedPass(null);
                setIsOtpVerified(false);
                setFormData((prev) => ({ ...prev, fullName: '', email: '', phone: '', photoUrl: '' }));
              }}
              className="btn btn-secondary"
            >
              Register Another Visitor
            </button>
            <button onClick={() => navigate('/login')} className="btn btn-outline">
              Staff Sign In
            </button>
          </div>
        </div>
      ) : submissionStatus === 'PENDING' ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <Clock size={48} color="#d97706" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.4rem' }}>Appointment Submitted (Pending Host Approval)</h2>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '10px auto 20px', fontSize: '13px' }}>
            Your visit request has been recorded in the system. The host employee will review and authorize your pass shortly.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button onClick={() => setSubmissionStatus(null)} className="btn btn-secondary">
              Back to Form
            </button>
            <button onClick={() => navigate('/login')} className="btn btn-primary">
              Employee Login
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', color: '#0f172a' }}>
            1. Personal Information
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Sarah Jenkins"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company / Organization</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Acme Tech / Independent"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-control"
                placeholder="sarah@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Phone Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="+1 (555) 0192"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          {/* OTP Verification Box */}
          <div
            style={{
              background: isOtpVerified ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${isOtpVerified ? '#a7f3d0' : '#fde68a'}`,
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: isOtpVerified ? '#065f46' : '#92400e' }}>
                {isOtpVerified ? '✓ Identity Verified via OTP' : 'Verification Required'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {isOtpVerified ? 'Your contact information is authenticated.' : 'A 6-digit code will be sent to confirm your details.'}
              </div>
            </div>

            {!isOtpVerified && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSendOTP}
                disabled={otpLoading}
              >
                {otpLoading ? 'Sending...' : 'Send OTP Code'}
              </button>
            )}
          </div>

          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', color: '#0f172a' }}>
            2. Photo & Identification
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#f1f5f9',
                flexShrink: 0,
              }}
            >
              {formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={26} color="#94a3b8" />
              )}
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                Badge Photograph
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!cameraActive ? (
                  <button type="button" onClick={startCamera} className="btn btn-secondary btn-sm">
                    <Camera size={13} /> Take Selfie
                  </button>
                ) : (
                  <button type="button" onClick={capturePhoto} className="btn btn-success btn-sm">
                    Capture Snap
                  </button>
                )}
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={13} /> Upload File
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {cameraActive && (
            <div style={{ marginBottom: '18px', textAlign: 'center' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '220px', height: '220px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #2563eb' }}
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Govt ID Type</label>
              <select
                className="form-select"
                value={formData.idProofType}
                onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
              >
                <option value="National ID">National ID</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Aadhaar">Aadhaar Card</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Govt ID Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="ID Number"
                value={formData.idProofNumber}
                onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
              />
            </div>
          </div>

          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', color: '#0f172a' }}>
            3. Visit Details & Host Selection
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Host Employee to Visit *</label>
              <select
                className="form-select"
                value={formData.hostId}
                onChange={(e) => setFormData({ ...formData, hostId: e.target.value })}
                required
              >
                {loadingHosts ? (
                  <option>Loading hosts from database...</option>
                ) : (
                  hosts.map((host) => (
                    <option key={host._id} value={host._id}>
                      {host.name} — {host.department}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Purpose of Visit</label>
              <select
                className="form-select"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              >
                <option value="Meeting">Meeting</option>
                <option value="Interview">Interview</option>
                <option value="Client Demo">Client Demo</option>
                <option value="Vendor / Contractor">Vendor / Contractor</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expected Arrival Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.scheduledStartTime}
                onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected Departure Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.scheduledEndTime}
                onChange={(e) => setFormData({ ...formData, scheduledEndTime: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Complete Pre-Registration'} <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn btn-secondary btn-lg"
            >
              Staff Login
            </button>
          </div>
        </form>
      )}

      {/* 6-Digit OTP Modal */}
      {otpModalOpen && (
        <div className="modal-backdrop" onClick={() => setOtpModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem' }}>Verify OTP Code</h3>
              <button onClick={() => setOtpModalOpen(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px' }}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                Enter the 6-digit code sent to <strong>{otpSentTo}</strong>:
              </p>

              {demoOtpHint && (
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '12px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                  }}
                >
                  Code: <strong>{demoOtpHint}</strong> (or <code>999999</code>)
                </div>
              )}

              <input
                type="text"
                className="form-control"
                placeholder="123456"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                style={{
                  fontSize: '22px',
                  textAlign: 'center',
                  letterSpacing: '6px',
                  fontWeight: 700,
                  marginBottom: '14px',
                }}
                autoFocus
              />

              <button
                type="button"
                onClick={handleVerifyOTP}
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={otpLoading}
              >
                {otpLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicVisitorPass;
