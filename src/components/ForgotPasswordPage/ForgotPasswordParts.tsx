import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SubmitBtnProps {
  loading: boolean;
  label: string;
  loadingLabel: string;
  disabled?: boolean;
}

export const FpSubmitButton: React.FC<SubmitBtnProps> = ({
  loading, label, loadingLabel, disabled,
}) => (
  <button
    type="submit"
    disabled={loading || disabled}
    className="btn-ripple transition-base hover-lift"
    style={{
      width: '100%', paddingTop: 12, paddingBottom: 12,
      borderRadius: 12, fontSize: '0.875rem', fontWeight: 600, color: 'white',
      background: (loading || disabled)
        ? 'var(--color-primary-300)'
        : 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
      border: 'none',
      cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: (loading || disabled) ? 'none' : '0 4px 14px rgba(139,102,66,0.35)',
    }}
  >
    {loading && (
      <span
        className="animate-spin"
        style={{
          width: 15, height: 15,
          border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: 'white',
          borderRadius: '50%',
          display: 'inline-block',
        }}
      />
    )}
    {loading ? loadingLabel : label}
  </button>
);

interface BackBtnProps {
  label: string;
  onClick: () => void;
}

export const FpBackButton: React.FC<BackBtnProps> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="transition-fast"
    style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '8px 0', fontSize: '0.875rem', fontWeight: 500,
      color: 'var(--color-primary-600)',
      background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8,
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
  >
    <ArrowLeft size={15} />
    {label}
  </button>
);

/* ─── Field Wrapper ─────────────────────────────────── */
interface FieldWrapperProps {
  label: string;
  icon: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  delay?: string;
  children: React.ReactNode;
}

export const FpFieldWrapper: React.FC<FieldWrapperProps> = ({
  label, icon, error, hint, delay = '0ms', children,
}) => (
  <div className="animate-slide-up" style={{ animationDelay: delay }}>
    <label style={{
      display: 'block', fontSize: '0.75rem', fontWeight: 600,
      marginBottom: 6, color: 'var(--color-primary-700)', letterSpacing: '0.02em',
    }}>
      {label} <span style={{ color: 'var(--color-primary-400)' }}>*</span>
    </label>
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--color-primary-400)', pointerEvents: 'none',
      }}>
        {icon}
      </span>
      {children}
    </div>
    {error && (
      <p style={{ fontSize: '0.75rem', marginTop: 5, color: 'var(--color-error-text)' }}>{error}</p>
    )}
    {!error && hint && (
      <p style={{ fontSize: '0.75rem', marginTop: 5 }}>{hint}</p>
    )}
  </div>
);

interface StepIndicatorProps {
  current: number;
  total: number;
}

export const FpStepIndicator: React.FC<StepIndicatorProps> = ({ current, total }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 20 }}>
    {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
      <React.Fragment key={s}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8125rem', fontWeight: 700,
          transition: 'all 0.25s ease',
          background: current >= s
            ? 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))'
            : 'var(--color-primary-100)',
          color: current >= s ? 'white' : 'var(--color-primary-400)',
          boxShadow: current >= s ? '0 2px 8px rgba(139,102,66,0.3)' : 'none',
        }}>
          {s}
        </div>
        {s < total && (
          <div style={{
            width: 36, height: 2,
            background: current > s ? 'var(--color-primary-500)' : 'var(--color-primary-100)',
            transition: 'background 0.3s ease',
          }} />
        )}
      </React.Fragment>
    ))}
  </div>
);