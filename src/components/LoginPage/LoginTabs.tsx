import React from 'react';
import { User, Mail, QrCode } from 'lucide-react';

interface LoginTabsProps {
  activeTab: 'phone' | 'email' | 'qr';
  setActiveTab: (tab: 'phone' | 'email' | 'qr') => void;
}

const TABS = [
  { id: 'phone' as const, label: 'Tài khoản',  icon: User },
  { id: 'email' as const, label: 'Email OTP',     icon: Mail  },
  { id: 'qr'    as const, label: 'QR Code',        icon: QrCode },
];

export const LoginTabs: React.FC<LoginTabsProps> = ({ activeTab, setActiveTab }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: 5, background: 'var(--color-primary-50)', borderRadius: 14, border: '1px solid var(--color-primary-100)' }}>
    {TABS.map(({ id, label, icon: Icon }) => {
      const active = activeTab === id;
      return (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className="transition-base"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: '0.8125rem', fontWeight: active ? 600 : 500,
            fontFamily: 'var(--font-body)',
            background: active ? 'white' : 'transparent',
            color: active ? 'var(--color-primary-700)' : 'var(--color-primary-400)',
            boxShadow: active ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Icon size={15} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      );
    })}
  </div>
);