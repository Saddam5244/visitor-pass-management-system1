import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { QrCode, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';

const Login = () => {
  const { login, demoLogin } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please provide both email and password', 'warning');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      redirectByRole(user.role);
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role) => {
    setLoading(true);
    try {
      const user = await demoLogin(role);
      showToast(`Logged in as ${role.toUpperCase()}: ${user.name}`, 'success');
      redirectByRole(user.role);
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'security') navigate('/security');
    else navigate('/host');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f8fafc',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          boxShadow: 'var(--shadow-md)',
          padding: '32px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <QrCode size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '4px' }}>
            PassPulse Portal
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Visitor Pass & Access Management System
          </p>
        </div>

        {/* Quick Demo Switcher Bar */}
        <div
          style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#475569',
              letterSpacing: '0.04em',
              marginBottom: '8px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={14} color="#2563eb" /> 1-Click Demo Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="role-pill-btn"
              onClick={() => handleDemoClick('admin')}
              disabled={loading}
            >
              👑 Admin
            </button>
            <button
              type="button"
              className="role-pill-btn"
              onClick={() => handleDemoClick('security')}
              disabled={loading}
            >
              🛡️ Security
            </button>
            <button
              type="button"
              className="role-pill-btn"
              onClick={() => handleDemoClick('employee')}
              disabled={loading}
            >
              💼 Host (Sarah)
            </button>
            <button
              type="button"
              className="role-pill-btn"
              onClick={() => handleDemoClick('hr')}
              disabled={loading}
            >
              🤝 Host (HR)
            </button>
          </div>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="user@visitorpass.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={15} />
          </button>
        </form>

        {/* Bottom Actions */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <button
            onClick={() => navigate('/public-register')}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            <UserPlus size={15} /> Visitor Self-Registration Kiosk
          </button>

          <div style={{ fontSize: '12px', color: '#64748b' }}>
            New employee?{' '}
            <Link to="/register" style={{ color: '#2563eb', fontWeight: 600 }}>
              Register account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
