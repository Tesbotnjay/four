import React from 'react';

const Select = ({
  label,
  options = [],
  error,
  value,
  onChange,
  required,
  id,
  name,
}) => {
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label">{label}{required && ' *'}</label>}
      <select
        id={id}
        name={name}
        className={`select ${error ? 'select-error' : ''}`}
        value={value}
        onChange={onChange}
        required={required}
      >
        <option value="" disabled>Pilih opsi</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
};

export { Select };
export default Select;
