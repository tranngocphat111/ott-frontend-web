import React from 'react';
import { Smartphone, Monitor, Tablet, X, Shield, MapPin, Clock, LogOut } from 'lucide-react';
import type { SessionInfo } from '../../types';

interface Props {
  sessions: SessionInfo[];
  onRevokeSession: (id: string) => void;
  onRevokeAllOthers: () => void;
  onRevokeAll: () => void;
}

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  MOBILE: Smartphone, TABLET: Tablet, DESKTOP: Monitor,
};

const formatDate = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
  if (diff < 1) return 'Vừa xong';
  if (diff < 24) return `${diff} giờ trước`;
  const days = Math.floor(diff / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(d).toLocaleDateString('vi-VN');
};

export const SessionsList: React.FC<Props> = ({ sessions, onRevokeSession, onRevokeAll }) => {
  const others = sessions.filter(s => !s.isCurrent);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
          Thiết bị đã đăng nhập
        </h2>
        {others.length > 0 && (
          <>
            <button onClick={onRevokeAll} className="transition-fast"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-error-text)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: 8, fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-error-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <LogOut size={13} /> Đăng xuất tất cả thiết bị
            </button>
          </>
        )}
      </div>

      {sessions.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-primary-400)', fontSize: '0.875rem' }}>
          Không có thiết bị nào
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map(s => {
            const Icon = DEVICE_ICONS[s.deviceType ?? ''] ?? Monitor;
            return (
              <div key={s.id} className="transition-fast animate-fade-in"
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', borderRadius: 14, border: `1.5px solid ${s.isCurrent ? 'var(--color-primary-200)' : 'var(--color-primary-100)'}`, background: s.isCurrent ? 'var(--color-primary-50)' : 'white' }}>

                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.isCurrent ? 'var(--color-primary-100)' : 'var(--color-surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} style={{ color: s.isCurrent ? 'var(--color-primary-600)' : 'var(--color-primary-400)' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                      {s.deviceName || 'Thiết bị không xác định'}
                    </span>
                    {s.isCurrent && (
                      <span style={{ padding: '1px 7px', borderRadius: 5, background: 'var(--color-primary-500)', color: 'white', fontSize: '0.6875rem', fontWeight: 700 }}>
                        Hiện tại
                      </span>
                    )}
                    {s.twoFactorVerified && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '1px 7px', borderRadius: 5, background: 'var(--color-success-bg)', color: 'var(--color-success-text)', fontSize: '0.6875rem', fontWeight: 700, border: '1px solid var(--color-success-border)' }}>
                        <Shield size={9} /> 2FA
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {s.ipAddress && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--color-primary-400)' }}>
                        <MapPin size={11} />
                        {s.ipAddress}{s.location && ` · ${s.location}`}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--color-primary-400)' }}>
                      <Clock size={11} />
                      Hoạt động {formatDate(s.lastActiveAt || s.createdAt)}
                    </div>
                    {s.loginMethod && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-300)' }}>
                        Đăng nhập bằng {s.loginMethod.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>

                {!s.isCurrent && (
                  <button onClick={() => onRevokeSession(s.id)} className="transition-fast"
                    style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-300)', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-error-bg)'; (e.currentTarget.querySelector('svg') as SVGElement).style.color = 'var(--color-error-text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; (e.currentTarget.querySelector('svg') as SVGElement).style.color = 'var(--color-primary-300)'; }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};