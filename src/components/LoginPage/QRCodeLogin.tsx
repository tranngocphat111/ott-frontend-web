import React, { useEffect, useRef, useCallback } from 'react';
import { QrCode, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useQRCode } from '../../hooks/useQRCode';
import { useAuth } from '../../contexts/AuthContext';
import { QrCodeStatus } from '../../types/enums';
import logo from '../../assets/logo_tach_nen.jpg';

interface Props {
  onSuccess: () => void;
}

export const QRCodeLogin: React.FC<Props> = ({ onSuccess }) => {
  const { qrCode, qrStatus, generateQRCode, loading, error } = useQRCode();
  const { loginWithToken } = useAuth();

  const loginWithTokenRef = useRef(loginWithToken);
  const onSuccessRef = useRef(onSuccess);
  const hasLoggedIn = useRef(false);

  useEffect(() => {
    loginWithTokenRef.current = loginWithToken;
  }, [loginWithToken]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    generateQRCode();
  }, []);

  useEffect(() => {
    if (
      hasLoggedIn.current ||
      qrStatus?.status !== QrCodeStatus.CONFIRMED ||
      !qrStatus.sessionToken ||
      !qrStatus.refreshToken
    )
      return;

    hasLoggedIn.current = true;

    loginWithTokenRef
      .current(qrStatus.sessionToken, qrStatus.refreshToken)
      .then(() => {
        setTimeout(() => onSuccessRef.current(), 800);
      })
      .catch(() => {
        hasLoggedIn.current = false;
      });
  }, [qrStatus?.status, qrStatus?.sessionToken, qrStatus?.refreshToken]);

  const handleNew = useCallback(() => {
    hasLoggedIn.current = false;
    generateQRCode();
  }, [generateQRCode]);

  const steps = [
    'Mở ứng dụng Riff trên điện thoại',
    'Chọn biểu tượng quét QR',
    'Quét mã để đăng nhập',
  ];

  return (
    <div className="space-y-5">
      {/* QR Box */}
      <div
        style={{
          borderRadius: 20,
          padding: 2,
          background:
            'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-700))',
        }}
      >
        <div
          style={{
            borderRadius: 18,
            background: 'white',
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Loading */}
          {loading && !qrCode && (
            <QrStatePlaceholder
              icon={
                <div
                  className="animate-spin"
                  style={{
                    width: 40,
                    height: 40,
                    border: '3px solid var(--color-primary-200)',
                    borderTopColor: 'var(--color-primary-500)',
                    borderRadius: '50%',
                  }}
                />
              }
              label="Đang tạo mã..."
            />
          )}

          {/* Error */}
          {error && (
            <QrStatePlaceholder
              icon={<XCircle size={40} style={{ color: 'var(--color-error-border)' }} />}
              label="Không thể tạo QR"
              action={
                <ActionBtn
                  onClick={handleNew}
                  label="Thử lại"
                  icon={<RefreshCw size={13} />}
                />
              }
              bg="var(--color-error-bg)"
            />
          )}

          {/* Confirmed */}
          {qrStatus?.status === QrCodeStatus.CONFIRMED && (
            <QrStatePlaceholder
              icon={<CheckCircle2 size={44} style={{ color: 'var(--color-success-border)' }} />}
              label="Đăng nhập thành công!"
              bg="var(--color-success-bg)"
              labelColor="var(--color-success-text)"
            />
          )}

          {/* Waiting confirm */}
          {qrStatus?.status === QrCodeStatus.SCANNED && (
            <QrStatePlaceholder
              icon={
                <div
                  className="animate-spin"
                  style={{
                    width: 40,
                    height: 40,
                    border: '3px solid var(--color-primary-200)',
                    borderTopColor: 'var(--color-primary-500)',
                    borderRadius: '50%',
                  }}
                />
              }
              label="Đang chờ xác nhận..."
              bg="var(--color-primary-50)"
            />
          )}

          {/* Expired */}
          {(qrStatus?.status === QrCodeStatus.EXPIRED ||
            qrCode?.status === QrCodeStatus.EXPIRED) && (
              <QrStatePlaceholder
                icon={<XCircle size={40} style={{ color: 'var(--color-primary-400)' }} />}
                label="QR đã hết hạn"
                action={
                  <ActionBtn
                    onClick={handleNew}
                    label="Tạo mã mới"
                    icon={<RefreshCw size={13} />}
                  />
                }
                bg="var(--color-primary-50)"
              />
            )}

          {/* QR đẹp */}
          {qrCode?.qrData &&
            !error &&
            qrStatus?.status !== QrCodeStatus.EXPIRED &&
            qrStatus?.status !== QrCodeStatus.CONFIRMED &&
            qrStatus?.status !== QrCodeStatus.SCANNED && (
              <div className="transition-transform duration-300 hover:scale-105">
                <QRCodeCanvas
                  value={qrCode.qrData}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#3b2f2f"
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: logo,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                  style={{
                    borderRadius: 16,
                    padding: 12,
                    boxShadow: '0 0 25px rgba(174,127,83,0.25)',
                  }}
                />
              </div>
            )}

          {/* Empty */}
          {!qrCode && !loading && !error && (
            <QrStatePlaceholder
              icon={<QrCode size={52} style={{ color: 'var(--color-primary-200)' }} />}
              label=""
            />
          )}
        </div>
      </div>

      {/* Expiry */}
      {qrCode && qrStatus?.status !== QrCodeStatus.CONFIRMED && (
        <p className="text-center text-xs" style={{ color: 'var(--color-primary-400)' }}>
          Mã hết hạn sau {qrCode.expirySeconds}s
        </p>
      )}

      {/* Steps */}
      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--color-primary-100)',
                color: 'var(--color-primary-700)',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)' }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Helpers */

function QrStatePlaceholder({
  icon,
  label,
  action,
  bg = 'var(--color-primary-50)',
  labelColor = 'var(--color-primary-600)',
}: {
  icon: React.ReactNode;
  label: string;
  action?: React.ReactNode;
  bg?: string;
  labelColor?: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      {icon}
      {label && (
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: labelColor }}>
          {label}
        </p>
      )}
      {action}
    </div>
  );
}

function ActionBtn({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-ripple transition-base"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: 'white',
        background:
          'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}