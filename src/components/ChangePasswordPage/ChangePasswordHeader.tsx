import React from 'react';
import { Lock } from 'lucide-react';

const ChangePasswordHeader: React.FC = () => {
  return (
    <div style={{
      position: 'relative', padding: '32px 24px 28px',
      textAlign: 'center', overflow: 'hidden',
      background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
    }}>
      {/* Dot pattern */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
        <defs>
          <pattern id="cp-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cp-dots)" />
      </svg>

      <div style={{ position: 'relative' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px', border: '1px solid rgba(255,255,255,0.3)',
        }}>
          <Lock size={28} color="white" />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.375rem',
          fontWeight: 700, color: 'white', margin: '0 0 6px',
        }}>
          Đổi mật khẩu
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
          Cập nhật mật khẩu để bảo mật tài khoản
        </p>
      </div>
    </div>
  );
};

export default ChangePasswordHeader;