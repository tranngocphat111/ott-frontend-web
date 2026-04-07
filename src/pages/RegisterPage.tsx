import { useRegister } from '../hooks/useRegister';
import RegisterForm from '../components/RegisterPage/RegisterForm';
import OtpForm from '../components/RegisterPage/OtpForm';
import logo from '../assets/logo_tach_nen.jpg';

export default function RegisterPage() {
  
  const {
    step, formData, loading,
    handleChange, handleRequestOtp, handleRegister, goBack,
  } = useRegister();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--background-image-gradient-subtle)', fontFamily: 'var(--font-body)' }}
    >
      {/* Ambient blobs */}
      <Blob top="-120px" right="-100px" size="380px" opacity={0.18} />
      <Blob bottom="-80px" left="-80px" size="280px" opacity={0.13} delay="0.2s" />

      {/* Card */}
      <div
        className="glass animate-scale-in w-full max-w-md relative"
        style={{ borderRadius: '24px', padding: '2.25rem 2rem', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Top accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: '3px',
            borderRadius: '0 0 3px 3px',
            background: 'linear-gradient(90deg, transparent, var(--color-primary-400), transparent)',
          }}
        />

        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <a href="/" className="group flex items-center gap-2.5 mb-5">
            <div
              className="transition-base group-hover:scale-105"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'white',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-primary-100)',
              }}
            >
              <img
                src={logo}
                alt="Riff"
                style={{ width: 28, height: 28, objectFit: 'contain' }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-primary-800)',
              }}
            >
              Riff
            </span>
          </a>

          <h1
            className="font-display"
            style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-900)' }}
          >
            {step === 'form' ? 'Tạo tài khoản' : 'Xác thực OTP'}
          </h1>

          <p className="mt-1 text-sm" style={{ color: 'var(--color-primary-500)' }}>
            {step === 'form'
              ? 'Điền thông tin để bắt đầu hành trình'
              : 'Nhập mã đã gửi đến email của bạn'}
          </p>

          {/* Step dots */}
          <div className="flex items-center gap-2 mt-4">
            <StepDot active={true} done={step === 'otp'} />
            <div style={{ width: 20, height: 1, background: 'var(--color-primary-200)' }} />
            <StepDot active={step === 'otp'} done={false} />
          </div>
        </div>

        {/* Form */}
        <div key={step} className="animate-slide-up">
          {step === 'form' ? (
            <RegisterForm
              formData={formData}
              loading={loading}
              onChange={handleChange}
              onSubmit={handleRequestOtp}
            />
          ) : (
            <OtpForm
              email={formData.email}
              otp={formData.otp}
              loading={loading}
              onChange={handleChange}
              onSubmit={handleRegister}
              onBack={goBack}
            />
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-primary-500)' }}>
          Đã có tài khoản?{' '}
          <a
            href="/login"
            className="font-semibold transition-fast hover:opacity-75"
            style={{ color: 'var(--color-primary-600)' }}
          >
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function Blob({
  top,
  bottom,
  left,
  right,
  size,
  opacity,
  delay,
}: {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: string;
  opacity: number;
  delay?: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        bottom,
        left,
        right,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(174,127,83,${opacity}) 0%, transparent 70%)`,
        pointerEvents: 'none',
        animationDelay: delay,
      }}
      className="animate-fade-in"
    />
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className="transition-base"
      style={{
        width: active || done ? 20 : 8,
        height: 8,
        borderRadius: 4,
        background: done
          ? 'var(--color-success-border)'
          : active
          ? 'var(--color-primary-500)'
          : 'var(--color-primary-200)',
      }}
    />
  );
}