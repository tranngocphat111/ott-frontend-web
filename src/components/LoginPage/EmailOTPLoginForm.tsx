import React, { useState } from 'react';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Mail } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SubmitBtn, OtpInput, BackBtn } from './LoginFormParts';

interface Props { onSuccess: () => void; }

export const EmailOTPLoginForm: React.FC<Props> = ({ onSuccess }) => {
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();
  const [step, setStep]       = useState<'email' | 'otp'>('email');
  const [email, setEmail]     = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.requestEmailOtpLogin(email);
      showToast(res.result?.message || 'OTP đã được gửi đến email của bạn', 'success', 'Đã gửi');
      setStep('otp');
    } catch (err: any) {
      const msg =
        err.code === 'ACCOUNT_PERMANENTLY_DELETED' ? 'Tài khoản đã bị xóa vĩnh viễn. Vui lòng đăng ký mới.' :
        err.code === 'EMAIL_ALREADY_EXISTS'         ? 'Email đã được sử dụng cho tài khoản khác.' :
        err.message || 'Không thể gửi OTP';
      showToast(msg, 'error', 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.verifyEmailOtpLogin({ email, otpCode });
      if (res.result?.token && res.result?.refreshToken) {
        await loginWithToken(res.result.token, res.result.refreshToken);
        onSuccess();
      }
    } catch (err: any) {
      showToast(err.message || 'Mã OTP không hợp lệ', 'error', 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') return (
    <form onSubmit={handleVerifyOtp} className="space-y-5">
      {/* Info */}
      <div className="animate-slide-down" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)' }}>
        <Mail size={15} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-700)' }}>
          Mã đã gửi đến <strong style={{ color: 'var(--color-primary-800)' }}>{email}</strong>
        </p>
      </div>

      <OtpInput value={otpCode} onChange={setOtpCode} />
      <SubmitBtn loading={loading} label="Xác nhận" loadingLabel="Đang xác thực..." />
      <BackBtn onClick={() => { setStep('email'); setOtpCode(''); }} />
    </form>
  );

  return (
    <form onSubmit={handleRequestOtp} className="space-y-4">
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)' }}>Email</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', pointerEvents: 'none' }}><Mail size={15} /></span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
            className="focus-ring transition-base"
            style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, fontSize: '0.875rem', border: '1.5px solid var(--color-primary-200)', background: 'rgba(255,255,255,0.7)', color: 'var(--color-primary-900)', outline: 'none' }} />
        </div>
      </div>
      <SubmitBtn loading={loading} label="Gửi mã OTP" loadingLabel="Đang gửi..." />
    </form>
  );
};