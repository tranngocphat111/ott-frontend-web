import React, { useState } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { useTwoFactor } from '../../hooks/useTwoFactor';
import { useAuth } from '../../contexts/AuthContext';
import {
  inputStyle, btnDanger, btnOutline,
  FieldLabel, RowBtns, Spinner, OtpInfo, OtpField, Banner,
} from './Twofactorparts';

type DisableStep = 'password' | 'otp';

interface Props {
  onCancel: () => void;
  onComplete: () => void;
}

export const DisableFlow: React.FC<Props> = ({ onCancel, onComplete }) => {
  const { user } = useAuth();
  const { requestDisableOtp, disable, isLoading } = useTwoFactor();

  const [step, setStep] = useState<DisableStep>('password');
  const [password, setPassword] = useState('');
  const [disableOtp, setDisableOtp] = useState('');

  const handleRequestDisableOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestDisableOtp(password);
      setStep('otp');
    } catch (err: unknown) {
      console.error('Lỗi yêu cầu tắt 2FA:', err);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await disable({ password, otp: disableOtp });
      setTimeout(onComplete, 1200);
    } catch (err: unknown) {
      console.error('Lỗi tắt xác thực 2 bước:', err);
    }
  };

  /* ── Password step ── */
  if (step === 'password') {
    return (
      <form onSubmit={handleRequestDisableOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Banner
          type="error"
          icon={<AlertCircle size={15} />}
          title="Cảnh báo bảo mật"
          text="Tắt xác thực 2 bước sẽ làm giảm mức độ bảo mật tài khoản của bạn."
        />

        <div>
          <FieldLabel>Nhập mật khẩu để xác nhận</FieldLabel>
          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', pointerEvents: 'none' }} />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
              autoFocus
              className="focus-ring transition-base"
              style={inputStyle}
            />
          </div>
        </div>

        <RowBtns>
          <button type="button" onClick={onCancel} className="transition-base" style={btnOutline}>Hủy</button>
          <button
            type="submit"
            disabled={isLoading || !password}
            className="btn-ripple transition-base"
            style={{ ...btnDanger, flex: 1, opacity: isLoading || !password ? 0.6 : 1 }}
          >
            {isLoading ? <Spinner /> : null}
            {isLoading ? 'Đang xác thực...' : 'Tiếp tục'}
          </button>
        </RowBtns>
      </form>
    );
  }

  /* ── OTP step ── */
  return (
    <form onSubmit={handleDisable2FA} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <OtpInfo email={user?.email} />
      <OtpField value={disableOtp} onChange={setDisableOtp} />
      <RowBtns>
        <button type="button" onClick={() => setStep('password')} className="transition-base" style={btnOutline}>Quay lại</button>
        <button
          type="submit"
          disabled={isLoading || disableOtp.length !== 6}
          className="btn-ripple transition-base"
          style={{ ...btnDanger, flex: 1, opacity: isLoading || disableOtp.length !== 6 ? 0.6 : 1 }}
        >
          {isLoading ? <Spinner /> : null}
          {isLoading ? 'Đang tắt...' : 'Tắt xác thực 2 bước'}
        </button>
      </RowBtns>
    </form>
  );
};