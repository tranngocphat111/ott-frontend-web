import React, { useRef } from 'react';

interface DeleteOtpStepProps {
  targetEmail: string;
  otp: string[];
  onChange: (index: number, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
  countdown: number;
  isLoading: boolean;
}

const DeleteOtpStep: React.FC<DeleteOtpStepProps> = ({
  targetEmail, otp, onChange, onSubmit, onResend, onBack,
  countdown, isLoading,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpStr = otp.join('');

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    onChange(index, value.slice(-1));
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((char, i) => onChange(i, char));
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Destination */}
      <div style={{
        padding: '12px 16px', borderRadius: 12, textAlign: 'center',
        background: 'var(--color-primary-50)',
        border: '1px solid var(--color-primary-100)',
      }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', margin: 0 }}>
          Mã xác thực đã được gửi đến
        </p>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-800)', margin: '2px 0 0' }}>
          {targetEmail}
        </p>
      </div>

      {/* OTP boxes */}
      <div>
        <label style={{
          display: 'block', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center',
          marginBottom: 14, color: 'var(--color-primary-700)', letterSpacing: '0.02em',
        }}>
          Nhập mã 6 chữ số
        </label>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }} onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              autoFocus={index === 0}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="focus-ring transition-base"
              style={{
                width: 48, height: 54, textAlign: 'center',
                fontSize: '1.375rem', fontWeight: 700, fontFamily: 'monospace',
                borderRadius: 12, outline: 'none',
                border: `1.5px solid ${
                   digit ? '#dc2626'
                  : 'var(--color-primary-200)'
                }`,
                background: digit ? '#fff5f5' : 'rgba(255,255,255,0.8)',
                color: 'var(--color-primary-900)',
                boxShadow: digit ? '0 1px 4px rgba(220,38,38,0.15)' : 'none',
                transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
              }}
            />
          ))}
        </div>
        
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || otpStr.length !== 6}
        className="btn-ripple transition-base"
        style={{
          width: '100%', padding: '12px 0', borderRadius: 14, border: 'none',
          cursor: isLoading || otpStr.length !== 6 ? 'not-allowed' : 'pointer',
          background: otpStr.length === 6 && !isLoading
            ? 'linear-gradient(135deg, #7f1d1d, #dc2626)'
            : 'var(--color-primary-200)',
          color: 'white', fontSize: '0.9375rem', fontWeight: 700,
          fontFamily: 'var(--font-body)',
          boxShadow: otpStr.length === 6 && !isLoading ? '0 4px 16px rgba(220,38,38,0.3)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {isLoading ? (
          <>
            <span className="animate-spin" style={{
              width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: 'white', borderRadius: '50%', display: 'inline-block',
            }} />
            Đang xóa tài khoản...
          </>
        ) : 'Xác nhận xóa tài khoản'}
      </button>

      {/* Resend + countdown */}
      <div style={{ borderTop: '1px solid var(--color-primary-100)', paddingTop: 14, textAlign: 'center' }}>
        {countdown > 0 ? (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-500)', margin: 0 }}>
            Gửi lại mã sau{' '}
            <span style={{ fontWeight: 700, color: 'var(--color-primary-700)' }}>{countdown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={isLoading}
            className="transition-fast"
            style={{
              fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-primary-500)',
              background: 'none', border: 'none', cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            Gửi lại mã OTP
          </button>
        )}
      </div>

      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="transition-base"
        style={{
          width: '100%', padding: '11px 0', borderRadius: 14,
          border: '1.5px solid var(--color-primary-200)',
          cursor: 'pointer', background: 'transparent',
          color: 'var(--color-primary-600)', fontSize: '0.875rem', fontWeight: 600,
          fontFamily: 'var(--font-body)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        Quay lại
      </button>
    </form>
  );
};

export default DeleteOtpStep;