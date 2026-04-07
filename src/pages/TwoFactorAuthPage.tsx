import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useTwoFactor } from '../hooks/useTwoFactor';
import { ViewStatus } from '../components/TwoFactorAuthPage/ViewStatus';
import { EnableFlow } from '../components/TwoFactorAuthPage/EnableFlow';
import { DisableFlow } from '../components/TwoFactorAuthPage/DisableFlow';

type Mode = 'view' | 'enable' | 'disable';

const TwoFactorAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { status, fetchStatus } = useTwoFactor();
  const [mode, setMode] = useState<Mode>('view');

  const handleComplete = async () => {
    await fetchStatus();
    setMode('view');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-image-gradient-subtle)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px 48px',
    }}>

      {/* Back button */}
      <div style={{ width: '100%', maxWidth: 480, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/profile')}
          className="transition-base"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 11px', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--color-primary-600)',
            fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-100)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      {/* Card */}
      <div
        className="animate-scale-in"
        style={{
          width: '100%', maxWidth: 480,
          background: 'white', borderRadius: 24,
          border: '1px solid var(--color-primary-100)',
          boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
        }}
      >
        {/* Header banner */}
        <div style={{
          position: 'relative', padding: '32px 24px 28px', textAlign: 'center', overflow: 'hidden',
          background: status?.enabled
            ? 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))'
            : 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))',
        }}>
          {/* Dot pattern */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
            <defs>
              <pattern id="2fa-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#2fa-dots)" />
          </svg>

          <div style={{ position: 'relative' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', border: '1px solid rgba(255,255,255,0.3)',
            }}>
              <Shield size={30} color="white" />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.375rem',
              fontWeight: 700, color: 'white', margin: '0 0 6px',
            }}>
              Xác thực 2 bước
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              {status?.enabled ? 'Tài khoản đang được bảo vệ' : 'Tăng cường bảo mật tài khoản'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <div key={mode} className="animate-fade-in">
            {mode === 'view' && (
              <ViewStatus
                status={status}
                onEnable={() => setMode('enable')}
                onDisable={() => setMode('disable')}
              />
            )}
            {mode === 'enable' && (
              <EnableFlow
                onCancel={() => setMode('view')}
                onComplete={handleComplete}
              />
            )}
            {mode === 'disable' && (
              <DisableFlow
                onCancel={() => setMode('view')}
                onComplete={handleComplete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuthPage;