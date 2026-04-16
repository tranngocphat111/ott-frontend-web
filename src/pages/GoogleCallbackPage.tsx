import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '../hooks/useGoogleLogin';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import LoadingScreen from '../components/common/LoadingScreen';
import logo from '../assets/logo_tach_nen.jpg';

export const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback, error } = useGoogleLogin();
  const [isProcessing, setIsProcessing] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;

    const processCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        const msg = errorParam === 'access_denied'
          ? 'Bạn đã từ chối quyền truy cập. Vui lòng thử lại.'
          : 'Đăng nhập Google thất bại. Vui lòng thử lại.';
        setLocalError(msg);
        setIsProcessing(false);
        setTimeout(() => navigate('/login', { state: { error: msg }, replace: true }), 3000);
        return;
      }

      if (!code) {
        setLocalError('Không tìm thấy mã xác thực. Vui lòng thử lại.');
        setIsProcessing(false);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
        return;
      }

      hasProcessedRef.current = true;

      try {
        const success = await handleGoogleCallback(code);
        if (!success) setIsProcessing(false);
      } catch (err: any) {
        setLocalError(err.message || 'Đã xảy ra lỗi không mong muốn');
        setIsProcessing(false);
        setTimeout(() => navigate('/login', { state: { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' }, replace: true }), 3000);
      }
    };

    processCallback();
  }, []);

  /* ── Error state ── */
  if (error || localError) {
    const displayError = error || localError;

    return (
      <div
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, background: 'var(--background-image-gradient-subtle)', fontFamily: 'var(--font-body)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Ambient blobs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(185,28,28,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(174,127,83,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div
          className="glass animate-scale-in"
          style={{ width: '100%', maxWidth: 400, borderRadius: 24, padding: '36px 28px', boxShadow: 'var(--shadow-xl)', textAlign: 'center', position: 'relative' }}
        >
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 3, borderRadius: '0 0 3px 3px', background: 'linear-gradient(90deg, transparent, var(--color-error-border), transparent)' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'white', border: '1px solid var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <img src={logo} alt="Riff" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-800)' }}>Riff</span>
          </div>

          {/* Error icon */}
          <div
            className="animate-scale-in"
            style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-error-bg)', border: '2px solid var(--color-error-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}
          >
            <AlertCircle size={26} style={{ color: 'var(--color-error-text)' }} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1875rem', fontWeight: 700, color: 'var(--color-primary-900)', marginBottom: 8 }}>
            Đăng nhập thất bại
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-error-text)', lineHeight: 1.6, marginBottom: 6 }}>
            {displayError}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-400)', marginBottom: 28 }}>
            Đang chuyển hướng về trang đăng nhập...
          </p>

          {/* Countdown bar */}
          <div style={{ height: 3, borderRadius: 2, background: 'var(--color-primary-100)', marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'var(--color-error-border)', animation: 'toastProgress 3000ms linear forwards', transformOrigin: 'left' }} />
          </div>

          <button
            onClick={() => navigate('/login', { replace: true })}
            className="btn-ripple transition-base"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-body)', background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))', boxShadow: '0 4px 12px rgba(139,102,66,0.28)' }}
          >
            <ArrowLeft size={14} /> Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading state — dùng LoadingScreen có sẵn ── */
  return (
    <LoadingScreen message="Đang xử lý đăng nhập Google" />
  );
};

export default GoogleCallbackPage;