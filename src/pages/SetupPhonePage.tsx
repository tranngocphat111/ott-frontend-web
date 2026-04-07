import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Phone, ArrowLeft, MessageCircle } from 'lucide-react';
import { useSetupPhone } from '../hooks/useSetupPhone';



const SetupPhonePage: React.FC = () => {
  const navigate = useNavigate();
  const { phone, setPhone, isLoading, handleSubmit, googleUserInfo, isValidState } = useSetupPhone();

  if (!isValidState) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-image-gradient-subtle)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 16px 48px',
    }}>
      {/* Back button */}
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="transition-base"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 11px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--color-primary-600)',
            fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-100)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </button>
      </div>

      {/* Card */}
      <div className="animate-scale-in" style={{
        width: '100%', maxWidth: 440, background: 'white', borderRadius: 24,
        border: '1px solid var(--color-primary-100)',
        boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
      }}>
        {/* Banner */}
        <div style={{
          position: 'relative', padding: '32px 24px 28px',
          textAlign: 'center', overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
        }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
            <defs>
              <pattern id="sp-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sp-dots)" />
          </svg>
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, marginBottom: 18,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.3)',
              }}>
                <MessageCircle size={18} color="white" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                Riff
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: '0 0 6px' }}>
              Hoàn tất đăng ký
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              Thêm số điện thoại để bảo mật tài khoản
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Google user info */}
          {googleUserInfo && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 14,
              background: 'var(--color-primary-50)',
              border: '1px solid var(--color-primary-100)',
            }}>
              {googleUserInfo.picture ? (
                <img src={googleUserInfo.picture} alt={googleUserInfo.name}
                  style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-primary-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-700)',
                }}>
                  {googleUserInfo.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-900)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {googleUserInfo.name}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-primary-500)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {googleUserInfo.email}
                </p>
              </div>
              <div style={{
                flexShrink: 0, padding: '3px 8px', borderRadius: 20,
                background: 'white', border: '1px solid var(--color-primary-200)',
                fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary-500)',
              }}>
                Google
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)', letterSpacing: '0.02em' }}>
                Số điện thoại
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', pointerEvents: 'none', opacity: 0.7 }}>
                  <Phone size={15} />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="0123 456 789"
                  disabled={isLoading}
                  maxLength={11}
                  className="focus-ring transition-base"
                  style={{
                    width: '100%', paddingLeft: 38, paddingRight: 14,
                    paddingTop: 10, paddingBottom: 10, borderRadius: 12, fontSize: '0.875rem',
                    border: '1.5px solid var(--color-primary-200)',
                    background: 'rgba(255,255,255,0.8)',
                    color: 'var(--color-primary-900)', outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'var(--font-body)',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                />
              </div>
              <p style={{ marginTop: 5, fontSize: '0.72rem', color: 'var(--color-primary-400)' }}>
                Nhập số điện thoại 10–11 chữ số
              </p>
            </div>

            <div style={{ height: 1, background: 'var(--color-primary-100)' }} />

            <button
              type="submit"
              disabled={isLoading || phone.length < 10}
              className="btn-ripple transition-base"
              style={{
                width: '100%', padding: '12px 0', borderRadius: 14, border: 'none',
                cursor: isLoading || phone.length < 10 ? 'not-allowed' : 'pointer',
                background: isLoading || phone.length < 10
                  ? 'var(--color-primary-200)'
                  : 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
                color: 'white', fontSize: '0.9375rem', fontWeight: 700,
                fontFamily: 'var(--font-body)',
                boxShadow: phone.length >= 10 && !isLoading ? 'var(--shadow-md)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isLoading ? (
                <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} /> Đang xử lý...</>
              ) : 'Hoàn tất đăng ký'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupPhonePage;