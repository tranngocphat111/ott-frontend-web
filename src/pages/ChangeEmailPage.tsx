import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChangeEmailHeader from '../components/ChangeEmailPage/ChangeEmailHeader';
import EmailStep from '../components/ChangeEmailPage/EmailStep';
import OtpStep from '../components/ChangeEmailPage/OtpStep';
import { useChangeEmail } from '../hooks/useChangeEmail';

const ChangeEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    step, isLoading, newEmail, setNewEmail,
    otp, handleOtpChange, requestOtp, verifyOtp, resendOtp, backToStep1,
  } = useChangeEmail(() => setTimeout(() => navigate('/profile'), 2000));

  const handleBack = () => {
    if (step === 1) navigate('/profile');
    else backToStep1();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-image-gradient-subtle)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px 48px',
    }}>
      <ChangeEmailHeader step={step} onBack={handleBack} />

      <div className="animate-scale-in" style={{
        width: '100%', maxWidth: 480,
        background: 'white', borderRadius: 24,
        border: '1px solid var(--color-primary-100)',
        boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
      }}>
        <div key={step} className="animate-fade-in" style={{ padding: 24 }}>
          {step === 1 ? (
            <EmailStep
              currentEmail={user?.email || ''}
              newEmail={newEmail}
              onChange={setNewEmail}
              onSubmit={requestOtp}
              isLoading={isLoading}
            />
          ) : (
            <OtpStep
              targetEmail={newEmail}
              otp={otp}
              onChange={handleOtpChange}
              onSubmit={verifyOtp}
              onResend={resendOtp}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeEmailPage;