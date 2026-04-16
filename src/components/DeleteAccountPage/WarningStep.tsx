import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface WarningStepProps {
  onContinue: () => void;
  onCancel: () => void;
}

const dangerItems = [
  'Thông tin cá nhân và hồ sơ',
  'Lịch sử hoạt động',
  'Dữ liệu và nội dung đã lưu',
  'Tất cả các kết nối và liên kết',
];

const noteItems = [
  'Tài khoản sẽ bị xóa vĩnh viễn và không thể khôi phục',
  'Bạn có thể tạo tài khoản mới với cùng số điện thoại / email',
  'Mọi dữ liệu sẽ bị mất hoàn toàn',
];

const WarningStep: React.FC<WarningStepProps> = ({ onContinue, onCancel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

    {/* Danger list */}
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: 'var(--color-error-bg)',
      border: '1px solid var(--color-error-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AlertTriangle size={15} color="var(--color-error-text)" />
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-error-text)', margin: 0 }}>
          Dữ liệu sẽ bị mất vĩnh viễn:
        </p>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {dangerItems.map(item => (
          <li key={item} style={{ fontSize: '0.8125rem', color: 'var(--color-error-text)', lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>

    {/* Notes */}
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: 'var(--color-warning-bg)',
      border: '1px solid var(--color-warning-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Info size={15} color="var(--color-warning-text)" />
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-warning-text)', margin: 0 }}>
          Lưu ý quan trọng:
        </p>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {noteItems.map(item => (
          <li key={item} style={{ fontSize: '0.8125rem', color: 'var(--color-warning-text)', lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>

    <div style={{ height: 1, background: 'var(--color-primary-100)' }} />

    {/* Continue */}
    <button
      onClick={onContinue}
      className="btn-ripple transition-base"
      style={{
        width: '100%', padding: '12px 0', borderRadius: 14,
        border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
        color: 'white', fontSize: '0.9375rem', fontWeight: 700,
        fontFamily: 'var(--font-body)',
        boxShadow: '0 4px 16px rgba(220,38,38,0.3)',
      }}
    >
      Tôi hiểu và muốn tiếp tục
    </button>

    {/* Cancel */}
    <button
      onClick={onCancel}
      className="transition-base"
      style={{
        width: '100%', padding: '11px 0', borderRadius: 14,
        border: '1.5px solid var(--color-primary-200)',
        cursor: 'pointer', background: 'transparent',
        color: 'var(--color-primary-600)', fontSize: '0.875rem', fontWeight: 600,
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      Hủy
    </button>

    {/* Support */}
    <p style={{ fontSize: '0.75rem', color: 'var(--color-primary-400)', textAlign: 'center', margin: 0 }}>
      Cần hỗ trợ? Liên hệ{' '}
      <a href="mailto:support@example.com" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
        support@example.com
      </a>
    </p>
  </div>
);

export default WarningStep;