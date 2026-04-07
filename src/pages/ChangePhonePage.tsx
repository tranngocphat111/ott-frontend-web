import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChangePhoneHeader from '../components/ChangePhonePage/ChangePhoneHeader';
import PhoneStep from '../components/ChangePhonePage/PhoneStep';
import OtpVerifyStep from '../components/ChangePhonePage/OtpVerifyStep';
import { useChangePhone } from '../hooks/useChangePhone';

const ChangePhonePage: React.FC = () => {
  const { user } = useAuth();
  const {
    step, isLoading, newPhone, setNewPhone,
    otp, countdown, handleOtpChange,
    requestOtp, verifyOtp, resendOtp, backToRequest,
  } = useChangePhone();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-image-gradient-subtle)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px 48px',
    }}>
      <ChangePhoneHeader step={step} currentPhone={user?.phone} />

      <div className="animate-scale-in" style={{
        width: '100%', maxWidth: 480,
        background: 'white', borderRadius: 24,
        border: '1px solid var(--color-primary-100)',
        boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
      }}>
        <div key={step} className="animate-fade-in" style={{ padding: 24 }}>
          {step === 'request' ? (
            <PhoneStep
              newPhone={newPhone}
              onChange={setNewPhone}
              onSubmit={requestOtp}
              isLoading={isLoading}
            />
          ) : (
            <OtpVerifyStep
              newPhone={newPhone}
              otp={otp}
              onChange={handleOtpChange}
              onSubmit={verifyOtp}
              onResend={resendOtp}
              onChangePhone={backToRequest}
              countdown={countdown}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePhonePage;