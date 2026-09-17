import React from 'react';

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onClick,
  className = '',
  type = 'button',
}) => {
  const baseClass = 'btn';
  const variantClass = variant ? `btn-${variant}` : '';
  
  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="spinner spinner-sm"></span>}
      {children}
    </button>
  );
};

export { Button };
export default Button;
