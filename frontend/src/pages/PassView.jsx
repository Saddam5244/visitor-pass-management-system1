import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import PassBadge from '../components/PassBadge';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const PassView = () => {
  const { id, passNumber } = useParams();
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPass = async () => {
      try {
        setLoading(true);
        const endpoint = passNumber ? `/passes/number/${passNumber}` : `/passes/${id}`;
        const res = await api.get(endpoint);
        if (res.success && res.pass) {
          setPass(res.pass);
        } else {
          setError(res.message || 'Pass not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve pass');
      } finally {
        setLoading(false);
      }
    };

    fetchPass();
  }, [id, passNumber]);

  return (
    <div style={{ minHeight: '100vh', padding: '40px 16px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="no-print" style={{ marginBottom: '20px' }}>
        <Link to="/login" className="btn btn-secondary btn-sm">
          <ArrowLeft size={15} /> Back to Portal
        </Link>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Loading Official Digital Pass...</h3>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertCircle size={48} color="#f43f5e" style={{ margin: '0 auto 12px' }} />
          <h3>Pass Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>{error}</p>
        </div>
      ) : (
        <PassBadge
          pass={pass}
          visitor={pass.visitorId}
          host={pass.hostId}
          organization={pass.organizationId}
        />
      )}
    </div>
  );
};

export default PassView;
