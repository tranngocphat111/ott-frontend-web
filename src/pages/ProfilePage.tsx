import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSessions } from '../hooks/useSessions';
import { useProfile } from '../hooks/useProfile';
import { ProfileHeader } from '../components/ProfilePage/ProfileHeader';
import { EditProfileForm } from '../components/ProfilePage/EditProfileForm';
import { SecuritySettings } from '../components/ProfilePage/SecuritySettings';
import { SessionsList } from '../components/ProfilePage/SessionsList';
import type { UpdateProfileRequest } from '../types';
import LoadingScreen from '../components/common/LoadingScreen';

const TABS = [
  { id: 'info', label: 'Thông tin' },
  { id: 'security', label: 'Bảo mật' },
  { id: 'sessions', label: 'Thiết bị' },
] as const;

type TabId = typeof TABS[number]['id'];

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile: updateProfileLocal } = useAuth();
  const { updateProfile: updateProfileApi } = useProfile();
  const { sessions } = useSessions();
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [minLoadDone, setMinLoadDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadDone(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  const handleUpdateProfile = async (data: UpdateProfileRequest) => {
    try {
      const ok = await updateProfileApi(data);
      if (ok) setShowEdit(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (!minLoadDone) return <LoadingScreen message="Đang tải" />;


  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--background-image-gradient-subtle)', fontFamily: 'var(--font-body)' }}>

      {/* Sticky nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,252,250,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-primary-100)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/chat')}
            className="transition-base"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-primary-600)', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-100)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeft size={16} /> Quay lại
          </button>

          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary-800)' }}>
            Trang cá nhân
          </span>

          <div style={{ width: 80 }} /> {/* spacer */}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Profile header card */}
        <ProfileHeader
          user={user}
          onProfileUpdate={(updatedProfile) => {
            updateProfileLocal(updatedProfile);
          }}
        />

        {/* Tabs + content card */}
        <div style={{ marginTop: 20, background: 'white', borderRadius: 20, border: '1px solid var(--color-primary-100)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-primary-100)', background: 'var(--color-primary-50)' }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="transition-base"
                  style={{
                    flex: 1,
                    padding: '14px 8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--color-primary-800)' : 'var(--color-primary-400)',
                    borderBottom: active ? '2.5px solid var(--color-primary-500)' : '2.5px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  {tab.label}
                  {tab.id === 'sessions' && sessions && (
                    <span style={{ marginLeft: 5, fontSize: '0.75rem', background: active ? 'var(--color-primary-500)' : 'var(--color-primary-200)', color: active ? 'white' : 'var(--color-primary-600)', borderRadius: 8, padding: '1px 6px', fontWeight: 600 }}>
                      {sessions.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div key={activeTab} className="animate-fade-in" style={{ padding: '24px 20px' }}>

            {/* ── Info tab ── */}
            {activeTab === 'info' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                    Thông tin cá nhân
                  </h2>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="btn-ripple transition-base"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-body)', background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))', boxShadow: '0 3px 10px rgba(139,102,66,0.28)' }}
                  >
                    Chỉnh sửa
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <InfoRow label="Họ và tên" value={user.fullName} />
                  <InfoRow label="Email" value={user.email} />
                  <InfoRow label="Giới thiệu" value={user.bio || undefined} />
                  <InfoRow label="Công việc" value={user.work || undefined} />
                  <InfoRow label="Địa điểm" value={user.location || undefined} />
                  <InfoRow label="Tình trạng quan hệ" value={user.relationshipStatus || undefined} />
                  <InfoRow label="Ngày sinh" value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : undefined} />
                  <InfoRow label="Giới tính" value={user.gender === 'MALE' ? 'Nam' : user.gender === 'FEMALE' ? 'Nữ' : 'Khác'} />
                  <InfoRow label="Ngày tham gia" value={new Date(user.createdAt).toLocaleDateString('vi-VN')} />
                  {user.lastLoginAt && (
                    <InfoRow label="Đăng nhập gần nhất" value={new Date(user.lastLoginAt).toLocaleString('vi-VN')} />
                  )}
                </div>
              </div>
            )}

            {/* ── Security tab ── */}
            {activeTab === 'security' && (
              <SecuritySettings
                user={user}
                onChangePassword={() => navigate('/account/password/change')}
                onSetPassword={() => navigate('/account/password/set')}
                onManageSessions={() => setActiveTab('sessions')}
                onToggle2FA={() => navigate('/security/2fa')}
                onDeleteAccount={() => navigate('/account/delete')}
              />


            )}

            {/* ── Sessions tab ── */}
            {activeTab === 'sessions' && sessions && (
              <SessionsList
                sessions={sessions.sessions}
              />
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditProfileForm user={user} onSave={handleUpdateProfile} onCancel={() => setShowEdit(false)} />
      )}
    </div>
  );
};

/* ── InfoRow ── */
const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-primary-50)' }}
    className="transition-fast"
    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
  >
    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary-500)', minWidth: 140, paddingLeft: 4 }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 4 }}>
      <span style={{ fontSize: '0.875rem', color: value ? 'var(--color-primary-900)' : 'var(--color-primary-300)', fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Chưa cập nhật'}
      </span>
    </div>
  </div>
);

export default ProfilePage;
