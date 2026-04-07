import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Step = 'warning' | 'confirm' | 'otp';

interface DeleteAccountHeaderProps {
  step: Step;
}

const STEP_ORDER: Step[] = ['warning', 'confirm', 'otp'];

const DeleteAccountHeader: React.FC<DeleteAccountHeaderProps> = ({ step }) => {
  const navigate = useNavigate();
  const currentIndex = STEP_ORDER.indexOf(step);

  return (
    <>
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

      {/* Banner — dùng màu error để nhấn mạnh mức độ nguy hiểm */}
      <div style={{
        position: 'relative', padding: '32px 24px 28px',
        textAlign: 'center', overflow: 'hidden',
        background: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
      }}>
        {/* Dot pattern */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
          <defs>
            <pattern id="da-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#da-dots)" />
        </svg>

        <div style={{ position: 'relative' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <Trash2 size={28} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.375rem',
            fontWeight: 700, color: 'white', margin: '0 0 6px',
          }}>
            Xóa tài khoản
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
            Hành động này không thể hoàn tác
          </p>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18, position: 'relative' }}>
          {STEP_ORDER.map((s, i) => (
            <div key={s} style={{
              height: 4, borderRadius: 99,
              width: i === currentIndex ? 24 : 12,
              background: i <= currentIndex ? 'white' : 'rgba(255,255,255,0.3)',
              transition: 'width 0.3s, background 0.3s',
            }} />
          ))}
        </div>
      </div>
    </>
  );
};

export default DeleteAccountHeader;