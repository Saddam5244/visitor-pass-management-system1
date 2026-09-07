import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'cyan', subtitle }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {Icon ? <Icon size={24} /> : null}
      </div>
      <div>
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value ?? '—'}</div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
