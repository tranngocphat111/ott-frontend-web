import React from 'react';
import logo from '../../assets/logo_tach_nen.jpg';

interface Props {
  message?: string;
}

const LoadingScreen: React.FC<Props> = ({ message = 'Đang tải...' }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, var(--color-primary-50) 0%, #fff9f5 50%, var(--color-primary-100) 100%)',
        fontFamily: 'var(--font-body)',
        zIndex: 9999,
      }}
    >
      {/* Ambient blobs */}
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(174,127,83,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(208,169,126,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo + spinner stack */}
      <div style={{ position: 'relative', width: 88, height: 88, marginBottom: 28 }}>
        {/* Outer spinning ring */}
        <svg
          width="88" height="88"
          viewBox="0 0 88 88"
          style={{ position: 'absolute', inset: 0, animation: 'spin 1.4s linear infinite' }}
        >
          <circle cx="44" cy="44" r="40"
            fill="none"
            stroke="var(--color-primary-100)"
            strokeWidth="3"
          />
          <circle cx="44" cy="44" r="40"
            fill="none"
            stroke="var(--color-primary-400)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="60 192"
            strokeDashoffset="0"
          />
        </svg>

        {/* Inner pulsing ring */}
        <div
          className="animate-pulse-slow"
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            border: '1px solid var(--color-primary-200)',
          }}
        />

        {/* Logo circle */}
        <div
          style={{
            position: 'absolute',
            inset: 16,
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-primary-100)',
          }}
        >
          <img
            src={logo}
            alt="Riff"
            style={{ width: 28, height: 28, objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Brand name */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-primary-800)',
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}
      >
        Riff
      </span>

      {/* Message with animated dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-400)', fontWeight: 500 }}>
          {message}
        </p>
        <Dots />
      </div>
    </div>
  );
};

/* Animated trailing dots */
const Dots: React.FC = () => (
  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <div
        key={i}
        className="animate-pulse-slow"
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'var(--color-primary-400)',
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

export default LoadingScreen;