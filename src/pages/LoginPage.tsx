import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginTabs, PhoneLoginForm, EmailOTPLoginForm, QRCodeLogin, GoogleLoginButton } from '../components/LoginPage';
import { ConfirmModal } from '../components/modal/ConfirmModal';
import { clearForcedLogoutNotice, getForcedLogoutNotice } from '../utils/authLogoutSignal';
import logo from '../assets/logo_tach_nen.jpg';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'phone' | 'email' | 'qr'>('phone');
  const [forcedLogoutMessage, setForcedLogoutMessage] = useState<string | null>(() =>
    getForcedLogoutNotice(),
  );

  useEffect(() => {
    const message = getForcedLogoutNotice();
    setForcedLogoutMessage(message);
  }, []);

  const dismissForcedLogoutNotice = () => {
    clearForcedLogoutNotice();
    setForcedLogoutMessage(null);
  };

  const handleLoginSuccess = () => {
    // Kiểm tra nếu có pending group invite từ trước khi đăng nhập
    const pendingToken = sessionStorage.getItem("pendingGroupToken");
    if (pendingToken) {
      sessionStorage.removeItem("pendingGroupToken");
      navigate(`/join?token=${pendingToken}`, { replace: true });
    } else {
      navigate('/chat', { replace: true });
    }
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--background-image-gradient-subtle)', fontFamily: 'var(--font-body)' }}
    >
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(174,127,83,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(208,169,126,0.11) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <ConfirmModal
        isOpen={Boolean(forcedLogoutMessage)}
        title="Phiên đăng nhập đã kết thúc"
        message={
          <div className="space-y-2">
            <p>{forcedLogoutMessage}</p>
            <p className="text-primary-500">
              Nếu đây không phải bạn, hãy đổi mật khẩu ngay sau khi đăng nhập lại.
            </p>
          </div>
        }
        confirmText="Tôi đã hiểu"
        hideCancelButton
        maxWidthClassName="max-w-md"
        onConfirm={dismissForcedLogoutNotice}
        onCancel={dismissForcedLogoutNotice}
      />

      <div className="w-full max-w-md animate-scale-in">
        <div className="flex flex-col items-center mb-7">
          <a href="/" className="group flex items-center gap-2.5 mb-4">
            <div
              className="transition-base group-hover:scale-105"
              style={{ width: 44, height: 44, borderRadius: 12, background: 'white', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-primary-100)' }}
            >
              <img src={logo} alt="Riff" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary-800)' }}>
              Riff
            </span>
          </a>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-primary-500)' }}>Chào mừng trở lại</p>
        </div>

        <div
          className="glass"
          style={{ borderRadius: 24, padding: '2rem', boxShadow: 'var(--shadow-xl)', position: 'relative' }}
        >

          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '3px', borderRadius: '0 0 3px 3px', background: 'linear-gradient(90deg, transparent, var(--color-primary-400), transparent)' }} />

          <LoginTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <div key={activeTab} className="animate-slide-up mt-6">
            {activeTab === 'phone' && <PhoneLoginForm onSuccess={handleLoginSuccess} />}
            {activeTab === 'email' && <EmailOTPLoginForm onSuccess={handleLoginSuccess} />}
            {activeTab === 'qr'    && <QRCodeLogin onSuccess={handleLoginSuccess} />}
          </div>

          {activeTab !== 'qr' && (
            <>
              <div style={{ position: 'relative', margin: '1.25rem 0' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '100%', borderTop: '1px solid var(--color-primary-100)' }} />
                </div>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <span style={{ padding: '0 12px', background: 'rgba(255,252,250,0.85)', fontSize: '0.8125rem', color: 'var(--color-primary-400)' }}>
                    Hoặc
                  </span>
                </div>
              </div>
              <GoogleLoginButton />
            </>
          )}
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: 'var(--color-primary-500)' }}>
          Chưa có tài khoản?{' '}
          <a href="/register" className="font-semibold transition-fast hover:opacity-70" style={{ color: 'var(--color-primary-600)' }}>
            Đăng ký ngay
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
