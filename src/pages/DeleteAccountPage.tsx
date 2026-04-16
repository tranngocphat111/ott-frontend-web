import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DeleteAccountHeader from '../components/DeleteAccountPage/DeleteAccountHeader';
import WarningStep from '../components/DeleteAccountPage/WarningStep';
import ConfirmStep from '../components/DeleteAccountPage/ConfirmStep';
import DeleteOtpStep from '../components/DeleteAccountPage/DeleteOtpStep';
import { useDeleteAccount } from '../hooks/useDeleteAccount';

const DeleteAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    step, isLoading, countdown,
    password, setPassword, confirmText, setConfirmText,
    otp, handleOtpChange,
    requestOtp, deleteAccount, resendOtp,
    goToConfirm, backToWarning, backToConfirm,
  } = useDeleteAccount();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-image-gradient-subtle)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px 48px',
    }}>
      <DeleteAccountHeader step={step} />

      <div className="animate-scale-in" style={{
        width: '100%', maxWidth: 480,
        background: 'white', borderRadius: 24,
        border: '1px solid var(--color-primary-100)',
        boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
      }}>
        <div key={step} className="animate-fade-in" style={{ padding: 24 }}>
          {step === 'warning' && (
            <WarningStep
              onContinue={goToConfirm}
              onCancel={() => navigate('/profile')}
            />
          )}
          {step === 'confirm' && (
            <ConfirmStep
              hasPassword={!!user?.hasPassword}
              password={password}
              onPasswordChange={setPassword}
              confirmText={confirmText}
              onConfirmTextChange={setConfirmText}
              onSubmit={requestOtp}
              onBack={backToWarning}
              isLoading={isLoading}
            />
          )}
          {step === 'otp' && (
            <DeleteOtpStep
              targetEmail={user?.email || ''}
              otp={otp}
              onChange={handleOtpChange}
              onSubmit={deleteAccount}
              onResend={resendOtp}
              onBack={backToConfirm}
              countdown={countdown}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;