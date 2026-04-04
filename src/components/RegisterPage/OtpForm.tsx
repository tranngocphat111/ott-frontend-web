import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { SubmitButton } from './RegisterForm';

type Props = { email: string; otp: string; loading: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onSubmit: (e: React.FormEvent) => void; onBack: () => void; };

export default function OtpForm({ email, otp, loading, onChange, onSubmit, onBack }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Info banner */}
      <div className="animate-slide-down" style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px', borderRadius: 12,
        background: 'var(--color-info-bg)',
        border: '1px solid var(--color-info-border)',
      }}>
        <ShieldCheck size={16} style={{ color: 'var(--color-primary-500)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-700)', lineHeight: 1.5 }}>
          Mã OTP đã gửi đến{' '}
          <strong style={{ color: 'var(--color-primary-800)', fontWeight: 600 }}>{email}</strong>
        </p>
      </div>

      {/* OTP input */}
      <div className="animate-slide-up" style={{ animationDelay: '60ms' }}>
        <label htmlFor="otp" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, textAlign: 'center', color: 'var(--color-primary-700)', letterSpacing: '0.04em' }}>
          Nhập mã 6 chữ số
        </label>
        <input
          id="otp" type="text" name="otp" value={otp} onChange={onChange}
          placeholder="· · · · · ·" maxLength={6} required inputMode="numeric" autoComplete="one-time-code"
          className="focus-ring transition-base"
          style={{
            width: '100%', padding: '16px 12px',
            borderRadius: 14, textAlign: 'center',
            fontSize: '2rem', fontWeight: 700, letterSpacing: '0.45em',
            fontFamily: 'monospace',
            border: '1.5px solid var(--color-primary-200)',
            background: 'rgba(255,255,255,0.8)',
            color: 'var(--color-primary-900)',
            outline: 'none',
            boxShadow: 'var(--shadow-sm)',
          }}
        />
        <p style={{ fontSize: '0.75rem', marginTop: 5, textAlign: 'center', color: 'var(--color-primary-400)' }}>
          Kiểm tra hộp thư đến và thư rác
        </p>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <SubmitButton loading={loading} label="Hoàn tất đăng ký" loadingLabel="Đang xử lý..." />
      </div>

      <button
        type="button" onClick={onBack}
        className="transition-fast"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', fontSize: '0.875rem', fontWeight: 500,
          color: 'var(--color-primary-600)', background: 'transparent', border: 'none', cursor: 'pointer',
          borderRadius: 8,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <ArrowLeft size={15} /> Quay lại
      </button>
    </form>
  );
}