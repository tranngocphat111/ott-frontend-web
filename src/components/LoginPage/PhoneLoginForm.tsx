import React, { useState } from 'react';
import { Eye, EyeOff, Phone, Lock, ShieldCheck } from 'lucide-react';
import { SubmitBtn, OtpInput, BackBtn } from './LoginFormParts';
import { usePhoneLogin } from '../../hooks/useLogin';

interface Props { onSuccess: () => void; }

export const PhoneLoginForm: React.FC<Props> = ({ onSuccess }) => {
  const {
    step,
    phone, setPhone,
    password, setPassword,
    otpCode, setOtpCode,
    loading,
    handleSubmit,
    handleVerify2FA,
    handleResendOTP,
    backToCredentials,
    use2FABackupCode,
    setUse2FABackupCode,
  } = usePhoneLogin(onSuccess);

  const [showPw, setShowPw] = useState(false);

  if (step === '2fa') return (
    <form onSubmit={handleVerify2FA} className="space-y-5">

      {/* Header */}
      <div className="flex flex-col items-center gap-1 animate-slide-down">
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={20} style={{ color: 'var(--color-primary-600)' }} />
        </div>
        <p className="font-semibold text-sm" style={{ color: 'var(--color-primary-900)' }}>
          {use2FABackupCode ? 'Mã dự phòng' : 'Xác thực 2 yếu tố'}
        </p>
        <p className="text-xs text-center" style={{ color: 'var(--color-primary-500)' }}>
          {use2FABackupCode
            ? 'Nhập một trong các mã dự phòng của bạn'
            : 'Nhập mã OTP đã được gửi đến email của bạn'}
        </p>
      </div>

      {/* Code input */}
      {use2FABackupCode ? (
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)' }}>
            Mã dự phòng (8 chữ số)
          </label>
          <input
            type="text"
            value={otpCode}
            inputMode="numeric"
            maxLength={8}
            placeholder="· · · · · · · ·"
            autoFocus
            onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            className="focus-ring transition-base"
            style={{
              width: '100%', padding: '16px 12px', borderRadius: 14, textAlign: 'center',
              fontSize: '1.75rem', fontWeight: 700, letterSpacing: '0.4em',
              fontFamily: 'monospace', border: '1.5px solid var(--color-primary-200)',
              background: 'rgba(255,255,255,0.8)', color: 'var(--color-primary-900)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      ) : (
        <OtpInput value={otpCode} onChange={setOtpCode} />
      )}

      {/* Submit */}
      <SubmitBtn
        loading={loading}
        label={use2FABackupCode ? 'Xác nhận mã dự phòng' : 'Xác thực'}
        loadingLabel="Đang xác thực..."
        disabled={use2FABackupCode ? otpCode.length !== 8 : otpCode.length !== 6}
      />

      {/* Row: back ← → resend (chỉ hiện khi dùng OTP) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackBtn onClick={backToCredentials} />
        {!use2FABackupCode && (
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="transition-fast"
            style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-primary-600)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Gửi lại OTP
          </button>
        )}
      </div>

      {/* Toggle backup/OTP — row riêng, canh giữa, có divider */}
      <div style={{ borderTop: '1px solid var(--color-primary-100)', paddingTop: 12, textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => { setUse2FABackupCode(!use2FABackupCode); setOtpCode(''); }}
          className="transition-fast"
          style={{
            fontSize: '0.8125rem', fontWeight: 500,
            color: 'var(--color-primary-500)',
            background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}
        >
          {use2FABackupCode ? 'Dùng mã OTP thay thế' : 'Dùng mã dự phòng thay thế'}
        </button>
      </div>
    </form>
  );

  /* ── Credentials step ── */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Số điện thoại" icon={<Phone size={15} />}>
        <input
          type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="0123 456 789" required
          className="focus-ring transition-base" style={inputStyle}
        />
      </FormField>

      <FormField label="Mật khẩu" icon={<Lock size={15} />}>
        <div style={{ position: 'relative' }}>
          <input
            type={showPw ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required
            className="focus-ring transition-base"
            style={{ ...inputStyle, paddingRight: 40 }}
          />
          <button
            type="button" onClick={() => setShowPw(p => !p)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </FormField>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <a href="/forgot-password" className="text-xs font-medium transition-fast hover:opacity-70" style={{ color: 'var(--color-primary-600)' }}>
          Quên mật khẩu?
        </a>
      </div>

      <SubmitBtn loading={loading} label="Đăng nhập" loadingLabel="Đang đăng nhập..." />
    </form>
  );
};

/* ── Shared helpers ── */
const inputStyle: React.CSSProperties = {
  width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
  borderRadius: 12, fontSize: '0.875rem',
  border: '1.5px solid var(--color-primary-200)',
  background: 'rgba(255,255,255,0.7)', color: 'var(--color-primary-900)', outline: 'none',
};

function FormField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)', letterSpacing: '0.02em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', pointerEvents: 'none' }}>
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}