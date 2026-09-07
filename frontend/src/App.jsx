import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import NotificationDrawer from './components/NotificationDrawer';
import QRScannerModal from './components/QRScannerModal';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PublicVisitorPass from './pages/PublicVisitorPass';
import PassView from './pages/PassView';
import AdminDashboard from './pages/AdminDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import HostDashboard from './pages/HostDashboard';
import ReportsPage from './pages/ReportsPage';
import OrganizationsPage from './pages/OrganizationsPage';

// Protected App Layout Wrapper
const ProtectedLayout = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const [scannerOpen, setScannerOpen] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: '#38bdf8',
          fontSize: '18px',
          fontWeight: 700,
        }}
      >
        Initializing PassPulse Security...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's home dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'security') return <Navigate to="/security" replace />;
    return <Navigate to="/host" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar onOpenScanner={() => setScannerOpen(true)} />
        {children}
      </div>

      <NotificationDrawer />
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={() => {
          // Trigger any global refresh if needed
        }}
      />
    </div>
  );
};

// Root Redirect Component
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'security') return <Navigate to="/security" replace />;
  return <Navigate to="/host" replace />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public-register" element={<PublicVisitorPass />} />
            <Route path="/pass/:id" element={<PassView />} />
            <Route path="/pass/number/:passNumber" element={<PassView />} />

            {/* Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedLayout allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/security"
              element={
                <ProtectedLayout allowedRoles={['security', 'admin']}>
                  <SecurityDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/host"
              element={
                <ProtectedLayout allowedRoles={['employee', 'admin']}>
                  <HostDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedLayout allowedRoles={['employee', 'security', 'admin']}>
                  <HostDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedLayout allowedRoles={['security', 'admin']}>
                  <ReportsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/organizations"
              element={
                <ProtectedLayout allowedRoles={['admin']}>
                  <OrganizationsPage />
                </ProtectedLayout>
              }
            />

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
