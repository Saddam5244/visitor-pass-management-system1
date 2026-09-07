import React from 'react';

const StatusPill = ({ status, label }) => {
  const normalized = (status || 'pending').toLowerCase();
  const displayLabel = label || status?.replace('_', ' ') || 'Pending';

  return <span className={`status-pill ${normalized}`}>{displayLabel}</span>;
};

export default StatusPill;
