import React from 'react';

const Badge = ({ variant = 'hadir', children }) => {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
};

export { Badge };
export default Badge;
