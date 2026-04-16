import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ChangePasswordWarning: React.FC = () => (
  <div style={{
    display: 'flex', gap: 12, padding: '14px 16px',
    borderRadius: 14, marginBottom: 24,
    background: 'var(--color-warning-bg)',
    border: '1px solid var(--color-warning-border)',
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
      background: 'rgba(217,119,6,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <AlertTriangle size={17} color="var(--color-warning-text)" />
    </div>
    <div>
      <p style={{
        fontSize: '0.8125rem', fontWeight: 700,
        color: 'var(--color-warning-text)', margin: '0 0 3px',
      }}>
        Lưu ý quan trọng
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-warning-text)', margin: 0, lineHeight: 1.55, opacity: 0.85 }}>
        Sau khi đổi mật khẩu, bạn sẽ bị đăng xuất khỏi tất cả thiết bị và cần đăng nhập lại.
      </p>
    </div>
  </div>
);

export default ChangePasswordWarning;