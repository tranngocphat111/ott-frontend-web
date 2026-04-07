import React from 'react';
import { Mail } from 'lucide-react';

interface EmailStepProps {
  currentEmail: string;
  newEmail: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const EmailStep: React.FC<EmailStepProps> = ({
  currentEmail, newEmail, onChange, onSubmit, isLoading,
}) => (
  <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

    {/* Current email display */}
    <div style={{
      padding: '12px 16px', borderRadius: 12,
      background: 'var(--color-primary-50)',
      border: '1px solid var(--color-primary-100)',
    }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-primary-500)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Email hiện tại
      </p>
      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-800)', margin: 0 }}>
        {currentEmail || 'Chưa có'}
      </p>
    </div>

    {/* New email input */}
    <div>
      <label style={{
        display: 'block', fontSize: '0.75rem', fontWeight: 600,
        marginBottom: 6, color: 'var(--color-primary-700)', letterSpacing: '0.02em',
      }}>
        Email mới
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-primary-400)',
          pointerEvents: 'none', opacity: 0.7,
        }}>
          <Mail size={15} />
        </span>
        <input
          type="email"
          value={newEmail}
          onChange={e => onChange(e.target.value)}
          placeholder="newemail@example.com"
          className="focus-ring transition-base"
          style={{
            width: '100%', paddingLeft: 38, paddingRight: 14,
            paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, fontSize: '0.875rem',
            border: `1.5px solid var(--color-primary-200)}`,
            background: 'rgba(255,255,255,0.8)',
            color: 'var(--color-primary-900)', outline: 'none',
            boxSizing: 'border-box', fontFamily: 'var(--font-body)',
          }}
        />
      </div>
      
    </div>

    {/* Submit */}
    <button
      type="submit"
      disabled={isLoading}
      className="btn-ripple transition-base"
      style={{
        width: '100%', padding: '12px 0', borderRadius: 14,
        border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
        background: isLoading
          ? 'var(--color-primary-200)'
          : 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
        color: 'white', fontSize: '0.9375rem', fontWeight: 700,
        fontFamily: 'var(--font-body)',
        boxShadow: isLoading ? 'none' : 'var(--shadow-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {isLoading ? (
        <>
          <span className="animate-spin" style={{
            width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: 'white', borderRadius: '50%', display: 'inline-block',
          }} />
          Đang gửi OTP...
        </>
      ) : 'Tiếp tục'}
    </button>
  </form>
);

export default EmailStep;