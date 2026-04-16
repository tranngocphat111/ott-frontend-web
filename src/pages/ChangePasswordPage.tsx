import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAccount } from '../hooks/useAccount';
import ChangePasswordHeader from '../components/ChangePasswordPage/ChangePasswordHeader';
import ChangePasswordForm from '../components/ChangePasswordPage/ChangePasswordForm';

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { changePassword, isLoading } = useAccount();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-image-gradient-subtle)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px 48px',
    }}>
      
      {/* Nút Back nằm độc lập bên ngoài Card */}
      <div style={{ width: '100%', maxWidth: 480, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/profile')}
          className="transition-base"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 11px', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--color-primary-600)',
            fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-100)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      {/* Card Wrapper bo góc trọn vẹn cả Header và Form */}
      <div
        className="animate-scale-in"
        style={{
          width: '100%', maxWidth: 480,
          background: 'white', borderRadius: 24,
          border: '1px solid var(--color-primary-100)',
          boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
        }}
      >
        {/* Banner Gradient */}
        <ChangePasswordHeader />

        {/* Form Body */}
        <div style={{ padding: 24 }} className="animate-fade-in">
          <ChangePasswordForm
            onSubmit={async (data) => {
              await changePassword(data);
            }}
            isLoading={isLoading}
          />
        </div>
      </div>
      
    </div>
  );
};

export default ChangePasswordPage;