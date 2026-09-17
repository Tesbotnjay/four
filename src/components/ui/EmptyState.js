import React from 'react';

const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      {description && <p style={{ color: 'var(--text-muted)' }}>{description}</p>}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
};

export { EmptyState };
export default EmptyState;
