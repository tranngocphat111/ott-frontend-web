import React from 'react';
import { Phone } from 'lucide-react';
import ChangePhoneWarning from './ChangePhoneWarning';

interface PhoneStepProps {
  newPhone: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const PhoneStep: React.FC<PhoneStepProps> = ({
  newPhone, onChange, onSubmit, isLoading,
}) => (
  <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <ChangePhoneWarning />

    <div>
      <label style={{
        display: 'block', fontSize: '0.75rem', fontWeight: 600,
        marginBottom: 6, color: 'var(--color-primary-700)', letterSpacing: '0.02em',
      }}>
        Số điện thoại mới
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-primary-400)',
          pointerEvents: 'none', opacity: 0.7,
        }}>
          <Phone size={15} />
        </span>
        <input
          type="tel"
          value={newPhone}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
          placeholder="0123 456 789"
          required
          maxLength={11}
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
      <p style={{ marginTop: 5, fontSize: '0.72rem', color: 'var(--color-primary-400)' }}>
        Nhập số điện thoại 10–11 chữ số
      </p>
    </div>

    <div style={{ height: 1, background: 'var(--color-primary-100)' }} />

    <button
      type="submit"
      disabled={isLoading || newPhone.length < 10}
      className="btn-ripple transition-base"
      style={{
        width: '100%', padding: '12px 0', borderRadius: 14,
        border: 'none',
        cursor: isLoading || newPhone.length < 10 ? 'not-allowed' : 'pointer',
        background: isLoading || newPhone.length < 10
          ? 'var(--color-primary-200)'
          : 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
        color: 'white', fontSize: '0.9375rem', fontWeight: 700,
        fontFamily: 'var(--font-body)',
        boxShadow: newPhone.length >= 10 && !isLoading ? 'var(--shadow-md)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {isLoading ? (
        <>
          <span className="animate-spin" style={{
            width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: 'white', borderRadius: '50%', display: 'inline-block',
          }} />
          Đang gửi...
        </>
      ) : 'Gửi mã xác thực'}
    </button>
  </form>
);

export default PhoneStep;