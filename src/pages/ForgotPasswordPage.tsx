import React, { useState } from 'react';
import { CheckCircle, KeyRound } from 'lucide-react';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { Step1Request } from '../components/ForgotPasswordPage/Step1Request';
import { Step2VerifyOtp } from '../components/ForgotPasswordPage/Step2VerifyOtp';
import { Step3NewPassword } from '../components/ForgotPasswordPage/Step3NewPassword';
import { FpStepIndicator } from '../components/ForgotPasswordPage/ForgotPasswordParts';

type Step = 'request' | 'verify-otp' | 'new-password' | 'success';

const STEP_META: Record<Step, { title: string; subtitle: string; step: number }> = {
  'request': { title: 'Quên mật khẩu', subtitle: 'Nhập số điện thoại và email đã đăng ký', step: 1 },
  'verify-otp': { title: 'Nhập mã OTP', subtitle: 'Kiểm tra email và nhập mã xác thực', step: 2 },
  'new-password': { title: 'Mật khẩu mới', subtitle: 'Tạo mật khẩu mới cho tài khoản của bạn', step: 3 },
  'success': { title: 'Hoàn tất', subtitle: 'Mật khẩu đã được đặt lại thành công', step: 3 },
};

export const ForgotPasswordPage: React.FC = () => {
  const { loading, requestPasswordReset, verifyOtp, resetPassword } = useForgotPassword();

  const [step, setStep] = useState<Step>('request');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Bước 1 → 2: chỉ advance nếu API trả về true
  const handleRequestOtp = async (p: string, em: string) => {
    const ok = await requestPasswordReset(p, em);
    if (!ok) return;
    setPhone(p);
    setEmail(em);
    startCountdown(60);
    setStep('verify-otp');
  };

  const handleVerifyOtp = async (enteredOtp: string) => {
    const ok = await verifyOtp(phone, email, enteredOtp);
    if (!ok) return;
    setOtp(enteredOtp);
    setStep('new-password');
  };

  // Gửi lại OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    const ok = await requestPasswordReset(phone, email);
    if (ok) startCountdown(60);
  };


  const handleResetPassword = async (newPassword: string, confirmPassword: string) => {
    const ok = await resetPassword(phone, email, otp, newPassword, confirmPassword);
    if (!ok) return;
    setStep('success');
  };

  const meta = STEP_META[step];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--color-primary-50) 0%, #ffffff 50%, var(--color-primary-100) 100%)',
      padding: '1rem',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Decorative bg blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(188,145,102,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-5%', left: '-5%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(188,145,102,0.08) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="animate-scale-in" style={{
            width: 60, height: 60,
            borderRadius: 18,
            background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(139,102,66,0.3)',
          }}>
            <KeyRound size={26} color="white" />
          </div>

          {step !== 'success' && (
            <div className="animate-fade-in">
              <FpStepIndicator current={meta.step} total={3} />
            </div>
          )}

          <h1 className="animate-slide-down font-display" style={{
            fontSize: '1.625rem', fontWeight: 700,
            color: 'var(--color-primary-900)', marginBottom: 4,
          }}>
            {meta.title}
          </h1>
          <p className="animate-slide-down" style={{
            animationDelay: '40ms',
            fontSize: '0.875rem', color: 'var(--color-primary-500)',
          }}>
            {meta.subtitle}
          </p>
        </div>

        {/* ── Card ── */}
        <div className="animate-slide-up glass" style={{
          borderRadius: 24,
          padding: '28px 28px 24px',
          boxShadow: 'var(--shadow-xl)',
        }}>
          {step === 'request' && (
            <Step1Request onNext={handleRequestOtp} loading={loading} />
          )}
          {step === 'verify-otp' && (
            <Step2VerifyOtp
              phone={phone} email={email}
              onNext={handleVerifyOtp}
              onBack={() => setStep('request')}
              onResend={handleResendOtp}
              loading={loading}
              countdown={countdown}
            />
          )}
          {step === 'new-password' && (
            <Step3NewPassword onSubmit={handleResetPassword} loading={loading} />
          )}
          {step === 'success' && <SuccessView />}
        </div>

        {/* ── Footer ── */}
        {step !== 'success' && (
          <p className="animate-fade-in" style={{
            textAlign: 'center', fontSize: '0.8125rem',
            color: 'var(--color-primary-400)', marginTop: 20,
          }}>
            Đã nhớ mật khẩu?{' '}
            <a href="/login" style={{
              color: 'var(--color-primary-600)', fontWeight: 600, textDecoration: 'none',
            }}>
              Đăng nhập
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── Success view ─── */
const SuccessView: React.FC = () => (
  <div style={{ textAlign: 'center' }} className="space-y-6">
    <div className="animate-scale-in" style={{
      width: 72, height: 72, borderRadius: '50%',
      background: 'var(--color-success-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto',
      boxShadow: '0 4px 16px rgba(45,151,100,0.2)',
    }}>
      <CheckCircle size={36} style={{ color: 'var(--color-success-border)' }} />
    </div>

    <div className="animate-slide-up" style={{ animationDelay: '80ms' }}>
      <h3 className="font-display" style={{
        fontSize: '1.25rem', fontWeight: 700,
        color: 'var(--color-primary-900)', marginBottom: 8,
      }}>
        Đặt lại thành công!
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-500)', lineHeight: 1.6 }}>
        Mật khẩu đã được thay đổi.<br />Vui lòng đăng nhập với mật khẩu mới.
      </p>
    </div>

    <div className="animate-slide-up" style={{ animationDelay: '140ms' }}>
      <button
        onClick={() => window.location.href = '/login'}
        className="btn-ripple transition-base hover-lift"
        style={{
          width: '100%', paddingTop: 12, paddingBottom: 12,
          borderRadius: 12, fontSize: '0.875rem', fontWeight: 600, color: 'white',
          background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(139,102,66,0.35)',
        }}
      >
        Đăng nhập ngay
      </button>
    </div>
  </div>
);

export default ForgotPasswordPage;