import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
  error?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  label, value, onChange, show, onToggleShow, placeholder, error,
}) => (
  <div>
    <label style={{
      display: 'block', fontSize: '0.75rem', fontWeight: 600,
      marginBottom: 6, color: 'var(--color-primary-700)', letterSpacing: '0.02em',
    }}>
      {label}
    </label>

    <div style={{ position: 'relative' }}>
      {/* Lock icon */}
      <span style={{
        position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
        color: error ? 'var(--color-error-text)' : 'var(--color-primary-400)',
        pointerEvents: 'none', opacity: 0.7,
      }}>
        <Lock size={15} />
      </span>

      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus-ring transition-base"
        style={{
          width: '100%', paddingLeft: 38, paddingRight: 42,
          paddingTop: 10, paddingBottom: 10,
          borderRadius: 12, fontSize: '0.875rem',
          border: `1.5px solid ${error ? 'var(--color-error-border)' : 'var(--color-primary-200)'}`,
          background: error ? 'var(--color-error-bg)' : 'rgba(255,255,255,0.8)',
          color: 'var(--color-primary-900)', outline: 'none',
          boxSizing: 'border-box', fontFamily: 'var(--font-body)',
          transition: 'border-color 0.2s, background 0.2s',
        }}
        onFocus={e => {
          if (!error) e.currentTarget.style.borderColor = 'var(--color-primary-400)';
        }}
        onBlur={e => {
          if (!error) e.currentTarget.style.borderColor = 'var(--color-primary-200)';
        }}
      />

      {/* Eye toggle */}
      <button
        type="button"
        onClick={onToggleShow}
        className="transition-fast"
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-primary-400)', background: 'none',
          border: 'none', cursor: 'pointer', padding: 2, borderRadius: 6,
          display: 'flex', alignItems: 'center',
        }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>

    {/* Error message */}
    {error && (
      <p style={{
        marginTop: 5, fontSize: '0.75rem',
        color: 'var(--color-error-text)', fontWeight: 500,
      }}>
        {error}
      </p>
    )}
  </div>
);

export default PasswordField;