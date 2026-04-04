import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Phone, Lock, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Spinner, SubmitBtn, OtpInput, BackBtn } from './LoginFormParts';

interface Props { onSuccess: () => void; }

export const PhoneLoginForm: React.FC<Props> = ({ onSuccess }) => {
  const { login, verify2FA, request2FAOtp } = useAuth();
  const { showToast } = useToast();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(phone, password);
      if (result.requires2FA && result.tempToken) {
        setRequires2FA(true);
        setTempToken(result.tempToken);
      } else if (result.authenticated) {
        onSuccess();
      }
    } catch (err: any) {
      const msg =
        err.code === 'INVALID_CREDENTIALS' ? 'Số điện thoại hoặc mật khẩu không đúng' :
          err.code === 'PASSWORD_NOT_SET' ? 'Tài khoản chưa có mật khẩu. Vui lòng đăng nhập bằng Google.' :
            err.message || 'Đăng nhập thất bại';
      showToast(msg, 'error', 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) { showToast('Vui lòng nhập mã OTP 6 số', 'warning'); return; }
    setOtpLoading(true);
    try {
      const result = await verify2FA(tempToken, otpCode);
      if (result.authenticated) onSuccess();
    } catch (err: any) {
      const msg =
        err.code === 'INVALID_OTP_CODE' ? 'Mã OTP không đúng. Vui lòng kiểm tra lại.' :
          err.code === 'OTP_EXPIRED' ? 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' :
            err.code === 'OTP_MAX_ATTEMPTS_EXCEEDED' ? 'Nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.' :
              err.message || 'Xác thực thất bại';
      showToast(msg, 'error', 'Xác thực 2FA thất bại');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      await request2FAOtp(phone);
      showToast('Mã OTP mới đã được gửi đến email của bạn', 'success', 'Đã gửi');
      setOtpCode('');
    } catch (err: any) {
      showToast(err.message || 'Không thể gửi lại OTP', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── 2FA step ── */
  if (requires2FA) return (
    <form onSubmit={handleVerify2FA} className="space-y-5">
      <div className="flex flex-col items-center gap-1 animate-slide-down">
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={20} style={{ color: 'var(--color-primary-600)' }} />
        </div>
        <p className="font-semibold text-sm" style={{ color: 'var(--color-primary-900)' }}>Xác thực 2 yếu tố</p>
        <p className="text-xs text-center" style={{ color: 'var(--color-primary-500)' }}>Nhập mã OTP đã được gửi đến email của bạn</p>
      </div>

      <OtpInput value={otpCode} onChange={v => setOtpCode(v)} />

      <SubmitBtn loading={otpLoading} label="Xác thực" loadingLabel="Đang xác thực..." disabled={otpCode.length !== 6} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackBtn onClick={() => { setRequires2FA(false); setOtpCode(''); }} />
        <button type="button" onClick={handleResendOTP} disabled={otpLoading}
          className="transition-fast text-sm font-medium hover:opacity-70"
          style={{ color: 'var(--color-primary-600)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Gửi lại OTP
        </button>
      </div>
    </form>
  );

  /* ── Login step ── */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Số điện thoại" icon={<Phone size={15} />}>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0123 456 789" required
          className="focus-ring transition-base" style={inputStyle} />
      </FormField>

      <FormField label="Mật khẩu" icon={<Lock size={15} />}>
        <div style={{ position: 'relative' }}>
          <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required className="focus-ring transition-base" style={{ ...inputStyle, paddingRight: 40 }} />
          <button type="button" onClick={() => setShowPw(p => !p)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', background: 'none', border: 'none', cursor: 'pointer' }}>
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
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)', letterSpacing: '0.02em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', pointerEvents: 'none' }}>{icon}</span>
        {children}
      </div>
    </div>
  );
}