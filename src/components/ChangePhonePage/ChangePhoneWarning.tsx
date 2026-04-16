import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ChangePhoneWarning: React.FC = () => (
  <div style={{
    display: 'flex', gap: 12, padding: '14px 16px',
    borderRadius: 14, marginBottom: 20,
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
        color: 'var(--color-warning-text)', margin: '0 0 4px',
      }}>
        Lưu ý
      </p>
      <ul style={{
        fontSize: '0.8125rem', color: 'var(--color-warning-text)',
        margin: 0, paddingLeft: 16, lineHeight: 1.6, opacity: 0.85,
      }}>
        <li>Tất cả phiên đăng nhập khác sẽ bị hủy</li>
        <li>Bạn sẽ cần đăng nhập lại trên các thiết bị khác</li>
      </ul>
    </div>
  </div>
);

export default ChangePhoneWarning;