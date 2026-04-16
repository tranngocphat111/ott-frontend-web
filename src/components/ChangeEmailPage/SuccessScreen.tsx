import React from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessScreen: React.FC = () => (
  <div style={{
    minHeight: '100vh',
    background: 'var(--background-image-gradient-subtle)',
    fontFamily: 'var(--font-body)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px',
  }}>
    <div
      className="animate-scale-in"
      style={{
        width: '100%', maxWidth: 400, textAlign: 'center',
        background: 'white', borderRadius: 24, padding: '40px 32px',
        border: '1px solid var(--color-primary-100)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      <div style={{
        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
        background: 'var(--color-success-bg)',
        border: '2px solid var(--color-success-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle size={34} color="var(--color-success-text)" />
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '1.5rem',
        fontWeight: 700, color: 'var(--color-primary-900)',
        margin: '0 0 8px',
      }}>
        Thành công!
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-primary-600)', margin: 0, lineHeight: 1.6 }}>
        Email của bạn đã được cập nhật.<br />Đang chuyển hướng...
      </p>

      {/* Progress bar */}
      <div style={{
        height: 3, borderRadius: 99, background: 'var(--color-primary-100)',
        marginTop: 28, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'var(--color-success-border)',
          animation: 'toastProgress 2s linear forwards',
        }} />
      </div>
    </div>
  </div>
);

export default SuccessScreen;