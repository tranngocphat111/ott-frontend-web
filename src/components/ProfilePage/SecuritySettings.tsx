import React, { useState } from 'react';
import { Shield, Lock, Smartphone, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import type { UserProfileResponse } from '../../types';

interface Props {
  user: UserProfileResponse;
  onChangePassword: () => void; onSetPassword: () => void;
  onManageSessions: () => void; onToggle2FA: () => void; onDeleteAccount: () => void;
}

export const SecuritySettings: React.FC<Props> = ({ user, onChangePassword, onSetPassword, onManageSessions, onToggle2FA, onDeleteAccount }) => {
  const [showDelete, setShowDelete] = useState(false);

  

  const items = [
    {
      icon: Shield,
      label: user.is2FAEnabled ? 'Tắt xác thực 2 bước' : 'Bật xác thực 2 bước',
      desc: user.is2FAEnabled ? 'Xác thực 2 bước đang hoạt động' : 'Tăng cường bảo mật tài khoản',
      onClick: onToggle2FA,
      badge: user.is2FAEnabled ? 'Đang bật' : undefined,
      badgeOk: user.is2FAEnabled,
    },
    {
      icon: Lock,
      label: user.hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu',
      desc: user.hasPassword ? 'Cập nhật mật khẩu hiện tại' : 'Tạo mật khẩu để đăng nhập',
      onClick: user.hasPassword ? onChangePassword : onSetPassword,
    },
    { icon: Smartphone, label: 'Quản lý thiết bị', desc: 'Xem thiết bị đã đăng nhập', onClick: onManageSessions },
  ];
  

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-primary-900)', marginBottom: 16 }}>
        Bảo mật & Tài khoản
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(({ icon: Icon, label, desc, onClick, badge, badgeOk }) => (
          <button key={label} onClick={onClick} className="transition-fast"
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left', width: '100%', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-900)' }}>{label}</span>
                {badge && (
                  <span style={{ padding: '1px 7px', borderRadius: 5, fontSize: '0.6875rem', fontWeight: 700, background: badgeOk ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', color: badgeOk ? 'var(--color-success-text)' : 'var(--color-warning-text)', border: `1px solid ${badgeOk ? 'var(--color-success-border)' : 'var(--color-warning-border)'}` }}>
                    {badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-400)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
            </div>
            <ChevronRight size={15} style={{ color: 'var(--color-primary-300)', flexShrink: 0 }} />
          </button>
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-primary-100)', margin: '8px 0' }} />

        {/* Delete account */}
        {showDelete ? (
          <div className="animate-slide-down" style={{ padding: '14px', borderRadius: 14, background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <AlertCircle size={16} style={{ color: 'var(--color-error-text)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--color-error-text)', fontWeight: 500, lineHeight: 1.5 }}>
                Hành động này không thể hoàn tác. Tài khoản sẽ bị xóa vĩnh viễn sau 30 ngày.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDelete(false)} className="transition-base"
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1.5px solid var(--color-primary-200)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary-600)', background: 'white', fontFamily: 'var(--font-body)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                Hủy
              </button>
              <button onClick={() => { setShowDelete(false); onDeleteAccount(); }} className="transition-base"
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'white', background: 'var(--color-error-border)', fontFamily: 'var(--font-body)' }}>
                Xác nhận xóa
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDelete(true)} className="transition-fast"
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left', width: '100%', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-error-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trash2 size={16} style={{ color: 'var(--color-error-text)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-error-text)' }}>Xóa tài khoản</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-error-text)', opacity: 0.7, marginTop: 1 }}>Xóa vĩnh viễn tài khoản của bạn</p>
            </div>
            <ChevronRight size={15} style={{ color: 'var(--color-error-border)', flexShrink: 0 }} />
          </button>
        )}
      </div>
    </div>
  );
};
