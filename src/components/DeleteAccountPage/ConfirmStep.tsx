import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const CONFIRM_PHRASE = 'DELETE';

interface ConfirmStepProps {
  hasPassword: boolean;
  password: string;
  onPasswordChange: (v: string) => void;
  confirmText: string;
  onConfirmTextChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  hasPassword,
  password,
  onPasswordChange,
  confirmText,
  onConfirmTextChange,
  onSubmit,
  onBack,
  isLoading,
}) => {
  const [showPw, setShowPw] = useState(false);

  // Chuẩn hóa input: chuyển về chữ hoa, loại bỏ khoảng trắng thừa
  const normalizedConfirmText = confirmText.trim().toUpperCase();
  const isConfirmed = normalizedConfirmText === CONFIRM_PHRASE;

  const canSubmit = isConfirmed && (!hasPassword || password.trim().length > 0);

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hướng dẫn */}
      <div style={{
        padding: '13px 16px',
        borderRadius: 12,
        background: 'var(--color-error-bg)',
        border: '1px solid var(--color-error-border)',
      }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-error-text)', margin: 0, lineHeight: 1.6 }}>
          Để xác nhận xóa tài khoản vĩnh viễn, vui lòng nhập chính xác cụm từ sau:{' '}
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            background: 'rgba(220,38,38,0.12)',
            padding: '2px 8px',
            borderRadius: 6,
            letterSpacing: '0.05em',
          }}>
            {CONFIRM_PHRASE}
          </span>
        </p>
      </div>

      {/* Input xác nhận */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 600,
          marginBottom: 6,
          color: 'var(--color-primary-700)',
          letterSpacing: '0.02em',
        }}>
          Nhập cụm từ xác nhận
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => onConfirmTextChange(e.target.value)}
          placeholder={`Nhập: ${CONFIRM_PHRASE}`}
          className="focus-ring transition-base"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 12,
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
            border: `1.5px solid ${
              confirmText.length > 0
                ? isConfirmed
                  ? '#16a34a'
                  : 'var(--color-error-border)'
                : 'var(--color-primary-200)'
            }`,
            background: confirmText.length > 0
              ? isConfirmed
                ? '#f0fdf4'
                : 'var(--color-error-bg)'
              : 'rgba(255,255,255,0.8)',
            color: 'var(--color-primary-900)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {confirmText.length > 0 && !isConfirmed && (
          <p style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--color-error-text)', fontWeight: 500 }}>
            Cụm từ chưa đúng. Vui lòng nhập chính xác: <strong>{CONFIRM_PHRASE}</strong>
          </p>
        )}
      </div>

      {/* Password nếu có */}
      {hasPassword && (
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            marginBottom: 6,
            color: 'var(--color-primary-700)',
          }}>
            Mật khẩu hiện tại
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 13,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-primary-400)',
            }}>
              <Lock size={15} />
            </span>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Nhập mật khẩu"
              style={{
                width: '100%',
                paddingLeft: 38,
                paddingRight: 42,
                paddingTop: 10,
                paddingBottom: 10,
                borderRadius: 12,
                fontSize: '0.875rem',
                border: '1.5px solid var(--color-primary-200)',
                background: 'rgba(255,255,255,0.8)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-primary-400)',
              }}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      )}

      <div style={{ height: 1, background: 'var(--color-primary-100)' }} />

      {/* Nút xác nhận */}
      <button
        type="submit"
        disabled={isLoading || !canSubmit}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 14,
          border: 'none',
          background: canSubmit && !isLoading
            ? 'linear-gradient(135deg, #7f1d1d, #dc2626)'
            : 'var(--color-primary-200)',
          color: 'white',
          fontSize: '0.9375rem',
          fontWeight: 700,
          cursor: isLoading || !canSubmit ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Đang xử lý...' : 'Xác nhận xóa tài khoản'}
      </button>

      <button
        type="button"
        onClick={onBack}
        style={{
          width: '100%',
          padding: '11px 0',
          borderRadius: 14,
          border: '1.5px solid var(--color-primary-200)',
          background: 'transparent',
          color: 'var(--color-primary-600)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Quay lại
      </button>
    </form>
  );
};

export default ConfirmStep;