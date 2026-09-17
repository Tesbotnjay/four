import React from 'react';

const ConnectionIndicator = ({ isConnected }) => {
  return (
    <div className="connection-indicator">
      <div 
        className="indicator-dot" 
        style={{ backgroundColor: isConnected ? 'var(--status-hadir)' : 'var(--status-ditolak)' }}
      ></div>
      <span style={{ color: isConnected ? 'var(--status-hadir)' : 'var(--status-ditolak)' }}>
        {isConnected ? 'TERHUBUNG' : 'REAL-TIME TERPUTUS'}
      </span>
    </div>
  );
};

export { ConnectionIndicator };
export default ConnectionIndicator;
