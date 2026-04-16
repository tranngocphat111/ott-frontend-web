import React from 'react';
import { ShieldCheck, ShieldOff, Info } from 'lucide-react';
import { btnPrimary, btnDanger } from './Twofactorparts';

export interface TwoFactorStatus {
  enabled: boolean;
  enabledAt?: string;
  lastUsedAt?: string;
  remainingBackupCodes?: number;
}

interface ViewStatusProps {
  status: TwoFactorStatus | null | undefined;
  onEnable: () => void;
  onDisable: () => void;
}

export const ViewStatus: React.FC<ViewStatusProps> = ({ status, onEnable, onDisable }) => {
  if (status?.enabled) {
    const rows = [
      status.enabledAt
        ? { label: 'Được bật vào', value: new Date(status.enabledAt).toLocaleDateString('vi-VN') }
        : null,
      status.lastUsedAt
        ? { label: 'Sử dụng gần nhất', value: new Date(status.lastUsedAt).toLocaleDateString('vi-VN') }
        : null,
      status.remainingBackupCodes != null
        ? { label: 'Mã dự phòng còn lại', value: `${status.remainingBackupCodes} mã`, highlight: true }
        : null,
    ].filter((r): r is NonNullable<typeof r> => r !== null);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: 14,
          background: 'var(--color-success-bg)',
          border: '1px solid var(--color-success-border)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <ShieldCheck size={18} style={{ color: 'var(--color-success-text)' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-success-text)', marginBottom: 2 }}>
              Đang được bảo vệ
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-success-text)', opacity: 0.8 }}>
              Xác thực 2 bước đang hoạt động
            </p>
          </div>
        </div>

        {/* Info table */}
        {rows.length > 0 && (
          <div style={{ borderRadius: 14, border: '1px solid var(--color-primary-100)', overflow: 'hidden' }}>
            {rows.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 16px',
                  borderBottom: i < rows.length - 1 ? '1px solid var(--color-primary-50)' : 'none',
                  background: 'white',
                }}
              >
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-500)' }}>{row.label}</span>
                <span style={{
                  fontSize: '0.8125rem', fontWeight: 700,
                  color: row.highlight ? 'var(--color-primary-600)' : 'var(--color-primary-900)',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onDisable} className="btn-ripple transition-base" style={btnDanger}>
          <ShieldOff size={15} /> Tắt xác thực 2 bước
        </button>
      </div>
    );
  }

  /* ── Disabled state ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        padding: '14px 16px', borderRadius: 14,
        background: 'var(--color-primary-50)',
        border: '1px solid var(--color-primary-100)',
      }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <Info size={15} style={{ color: 'var(--color-primary-500)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-800)' }}>
            Bảo vệ tài khoản của bạn
          </p>
        </div>
        {[
          'Bảo mật cao hơn khi đăng nhập',
          'Áp dụng cho đăng nhập bằng mật khẩu',
          'Mã dự phòng để khôi phục khi mất email',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 4px 25px' }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--color-primary-400)', flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)' }}>{t}</span>
          </div>
        ))}
      </div>

      <button onClick={onEnable} className="btn-ripple transition-base" style={btnPrimary}>
        <ShieldCheck size={15} /> Bật xác thực 2 bước
      </button>
    </div>
  );
};