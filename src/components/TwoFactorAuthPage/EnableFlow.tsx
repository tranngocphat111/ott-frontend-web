import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Lock, CheckCircle2, Check, Copy } from 'lucide-react';
import { useTwoFactor } from '../../hooks/useTwoFactor';
import { useAuth } from '../../contexts/AuthContext';
import { useAccount } from '../../hooks/useAccount';
import {
  inputStyle, btnPrimary, btnOutline,
  FieldLabel, RowBtns, Spinner, OtpInfo, OtpField, Banner,
} from './Twofactorparts';

type EnableStep = 'check-password' | 'set-password' | 'otp' | 'backup';

interface Props {
  onCancel: () => void;
  onComplete: () => void;
}

export const EnableFlow: React.FC<Props> = ({ onCancel, onComplete }) => {
  const { user } = useAuth();
  const { requestEnableOtp, enable, isLoading } = useTwoFactor();
  const { setPassword: setPasswordApi, isLoading: isSettingPassword } = useAccount();

  const [step, setStep] = useState<EnableStep>('check-password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let active = true;

    const init = async () => {
      if (!user?.hasPassword) {
        setStep('set-password');
        return;
      }
      try {
        await requestEnableOtp();
        setStep('otp');
      } catch (err: unknown) {
        const msg: string =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as { message?: string })?.message || '';

        if (msg.includes('already enabled') || msg.includes('đã được bật')) {
          onCancel();
        } else if (msg.includes('password required')) {
          setStep('set-password');
        } else {
          console.error('Lỗi gửi mã OTP:', msg);
          onCancel();
        }
      }
    };

    init();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    if (newPassword.length < 8) return;

    try {
      await setPasswordApi({ password: newPassword, confirmPassword });

      // Chờ một chút trước khi gửi OTP để API đồng bộ
      setTimeout(async () => {
        try {
          await requestEnableOtp();
          setStep('otp');
        } catch (err: unknown) {
          console.error('Lỗi gửi mã OTP sau khi tạo mật khẩu:', err);
        }
      }, 800);
    } catch (err: unknown) {
      console.error('Lỗi tạo mật khẩu:', err);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    try {
      const result = await enable({ otp });
      if (result?.backupCodes) {
        setBackupCodes(result.backupCodes);
        setStep('backup');
      }
    } catch (err) {
      console.error('Xác thực OTP thất bại:', err);
      setOtp('');
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  /* ── Loading placeholder ── */
  if (step === 'check-password') {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <Spinner />
      </div>
    );
  }

  /* ── Set password ── */
  if (step === 'set-password') {
    const busy = isLoading || isSettingPassword;
    return (
      <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Banner
          type="warning"
          icon={<AlertCircle size={15} />}
          title="Yêu cầu tạo mật khẩu"
          text="Bạn đăng ký bằng Google và chưa có mật khẩu. Vui lòng tạo mật khẩu để bật xác thực 2 bước."
        />

        {([
          { label: 'Mật khẩu mới', value: newPassword, setter: setNewPassword, placeholder: 'Tối thiểu 8 ký tự', hint: 'Tối thiểu 8 ký tự' },
          { label: 'Xác nhận mật khẩu', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Nhập lại mật khẩu', hint: undefined },
        ] as const).map((field, i) => (
          <div key={i}>
            <FieldLabel>{field.label}</FieldLabel>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', pointerEvents: 'none' }} />
              <input
                type="password"
                placeholder={field.placeholder}
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                autoFocus={i === 0}
                className="focus-ring transition-base"
                style={inputStyle}
              />
            </div>
            {field.hint && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-primary-400)', marginTop: 4 }}>{field.hint}</p>
            )}
          </div>
        ))}

        <RowBtns>
          <button type="button" onClick={onCancel} className="transition-base" style={btnOutline}>Hủy</button>
          <button
            type="submit"
            disabled={busy || !newPassword || !confirmPassword}
            className="btn-ripple transition-base"
            style={{ ...btnPrimary, flex: 1, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? <Spinner /> : null}
            {busy ? 'Đang xử lý...' : 'Tiếp tục'}
          </button>
        </RowBtns>
      </form>
    );
  }

  /* ── OTP ── */
  if (step === 'otp') {
    return (
      <form onSubmit={handleEnable2FA} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <OtpInfo email={user?.email} />
        <OtpField value={otp} onChange={setOtp} />
        <RowBtns>
          <button type="button" onClick={onCancel} className="transition-base" style={btnOutline}>Quay lại</button>
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="btn-ripple transition-base"
            style={{ ...btnPrimary, flex: 1, opacity: isLoading || otp.length !== 6 ? 0.6 : 1 }}
          >
            {isLoading ? <Spinner /> : null}
            {isLoading ? 'Đang xác thực...' : 'Xác nhận'}
          </button>
        </RowBtns>
      </form>
    );
  }

  /* ── Backup codes ── */
  if (step === 'backup') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Banner
          type="success"
          icon={<CheckCircle2 size={15} />}
          title="Xác thực 2 bước đã được bật!"
          text="Hãy lưu các mã dự phòng bên dưới. Bạn sẽ cần chúng nếu không thể truy cập email."
        />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary-800)' }}>
              Mã dự phòng ({backupCodes.length} mã)
            </span>
            <button
              onClick={handleCopyBackupCodes}
              className="transition-fast"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 600,
                color: 'var(--color-primary-600)', background: 'var(--color-primary-50)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {copiedCodes ? <><Check size={12} /> Đã sao chép</> : <><Copy size={12} /> Sao chép</>}
            </button>
          </div>

          <div
            className="custom-scrollbar"
            style={{
              background: 'var(--color-primary-50)', border: '1.5px solid var(--color-primary-100)',
              borderRadius: 14, padding: 14, maxHeight: 200, overflowY: 'auto',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {backupCodes.map((code, i) => (
                <div key={i} style={{
                  fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-primary-800)',
                  background: 'white', padding: '7px 10px', borderRadius: 8,
                  border: '1px solid var(--color-primary-100)', textAlign: 'center', fontWeight: 600,
                }}>
                  {code}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Banner
          type="warning"
          icon={<AlertCircle size={15} />}
          text="Mỗi mã chỉ dùng một lần. Lưu ở nơi an toàn để dùng khi không thể truy cập email."
        />

        <button onClick={onComplete} className="btn-ripple transition-base" style={btnPrimary}>
          <Check size={15} /> Hoàn tất
        </button>
      </div>
    );
  }

  return null;
};