import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, User, Shield, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo_tach_nen.jpg';

interface Props {
  onMenuClick: () => void;
  showClose?: boolean;
}

export const SidebarHeader: React.FC<Props> = ({ onMenuClick, showClose }) => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const avatarUrl = user.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=8b6642&color=fff&bold=true`;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const menuItems = [
    { href: '/profile', icon: <User size={14} />, label: 'Trang cá nhân' },
    { href: '/security', icon: <Shield size={14} />, label: 'Bảo mật' },
    { href: '/settings', icon: <Settings size={14} />, label: 'Cài đặt' },
  ];

  return (
    <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid var(--color-primary-100)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Logo mark */}
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'white', border: '1px solid var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
          <img src={logo} alt="Riff" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        </div>

        {/* User avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={avatarUrl}
              alt={user.fullName}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary-200)' }}
            />
            {/* Online dot */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              {user.fullName}
            </p>
            <p style={{ fontSize: '0.6875rem', color: '#22c55e', fontWeight: 500 }}>Hoạt động</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {/* Dropdown menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowMenu(v => !v)}
              className="transition-fast"
              style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-400)', background: showMenu ? 'var(--color-primary-100)' : 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-100)')}
              onMouseLeave={e => { if (!showMenu) e.currentTarget.style.background = 'transparent'; }}
            >
              <MoreVertical size={15} />
            </button>

            {showMenu && (
              <div
                className="animate-scale-in"
                style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 188, background: 'white', border: '1px solid var(--color-primary-100)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 100 }}
              >
                {menuItems.map(item => (
                  <a key={item.href} href={item.href}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', color: 'var(--color-primary-700)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: 'var(--color-primary-400)' }}>{item.icon}</span>
                    {item.label}
                  </a>
                ))}
                <div style={{ height: 1, background: 'var(--color-primary-100)', margin: '4px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', color: 'var(--color-error-text)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-error-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>

          {/* Close button — mobile only */}
          {showClose && (
            <button
              onClick={onMenuClick}
              className="lg:hidden transition-fast"
              style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-400)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-100)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};