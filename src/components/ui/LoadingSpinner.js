import React from 'react';

const LoadingSpinner = ({ size = 'md', fullPage = false }) => {
  const spinner = <div className={`spinner spinner-${size}`}></div>;

  if (fullPage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        {spinner}
      </div>
    );
  }

  return spinner;
};

export { LoadingSpinner };
export default LoadingSpinner;
