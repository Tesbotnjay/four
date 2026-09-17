import React from 'react';

const Input = ({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  id,
  name,
}) => {
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label">{label}{required && ' *'}</label>}
      <input
        type={type}
        id={id}
        name={name}
        className={`input ${error ? 'input-error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      {error && <div className="error-text">{error}</div>}
    </div>
  );
};

export { Input };
export default Input;
