import React from 'react';
import { Mail } from 'lucide-react';
import { SubmitBtn, OtpInput, BackBtn } from './LoginFormParts';
import { useEmailOtpLogin } from '../../hooks/useLogin';

interface Props { onSuccess: () => void; }

export const EmailOTPLoginForm: React.FC<Props> = ({ onSuccess }) => {
  const {
    step,
    email, setEmail,
    otpCode, setOtpCode,
    loading,
    handleRequestOtp,
    handleVerifyOtp,
    backToEmail,
  } = useEmailOtpLogin(onSuccess);

  if (step === 'otp') return (
    <form onSubmit={handleVerifyOtp} className="space-y-5">
      <div className="animate-slide-down" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)' }}>
        <Mail size={15} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-700)' }}>
          Mã đã gửi đến <strong style={{ color: 'var(--color-primary-800)' }}>{email}</strong>
        </p>
      </div>

      <OtpInput value={otpCode} onChange={setOtpCode} />
      <SubmitBtn loading={loading} label="Xác nhận" loadingLabel="Đang xác thực..." disabled={otpCode.length !== 6} />
      <BackBtn onClick={backToEmail} />
    </form>
  );

  return (
    <form onSubmit={handleRequestOtp} className="space-y-4">
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)' }}>Email</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', pointerEvents: 'none' }}>
            <Mail size={15} />
          </span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="focus-ring transition-base"
            style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, fontSize: '0.875rem', border: '1.5px solid var(--color-primary-200)', background: 'rgba(255,255,255,0.7)', color: 'var(--color-primary-900)', outline: 'none' }}
          />
        </div>
      </div>
      <SubmitBtn loading={loading} label="Gửi mã OTP" loadingLabel="Đang gửi..." />
    </form>
  );
};