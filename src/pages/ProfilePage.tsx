
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useSessions } from '../hooks/useSessions';
import { ProfileHeader } from '../components/Profile/ProfileHeader';
import { EditProfileForm } from '../components/Profile/EditProfileForm';
import { SecuritySettings } from '../components/Profile/SecuritySettings';
import { SessionsList } from '../components/Profile/SessionsList';
import type { UpdateProfileRequest } from '../types';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { updateProfile } = useProfile();
  const { sessions, revokeSession, revokeAllOtherSessions } = useSessions();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'sessions'>('info');

  if (!user) {
    return null;
  }

  const handleUpdateProfile = async (data: UpdateProfileRequest) => {
    try {
      await updateProfile(data);
      setShowEditProfile(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          user={user}
          onEditAvatar={() => console.log('Edit avatar')}
          onEditCover={() => console.log('Edit cover')}
        />

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'security'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bảo mật
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'sessions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Thiết bị ({sessions?.total || 0})
            </button>
          </div>

          <div className="p-6">
            {/* Personal Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                </div>

                <div className="space-y-3">
                  <InfoRow label="Họ và tên" value={user.fullName} />
                  <InfoRow label="Số điện thoại" value={user.phone} verified={user.isPhoneVerified} />
                  <InfoRow label="Email" value={user.email} verified={user.isEmailVerified} />
                  <InfoRow label="Giới thiệu" value={user.bio || 'Chưa cập nhật'} />
                  <InfoRow
                    label="Ngày sinh"
                    value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  />
                  <InfoRow
                    label="Giới tính"
                    value={
                      user.gender === 'MALE' ? 'Nam' : user.gender === 'FEMALE' ? 'Nữ' : 'Khác'
                    }
                  />
                  <InfoRow
                    label="Ngày tham gia"
                    value={new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  />
                  {user.lastLoginAt && (
                    <InfoRow
                      label="Đăng nhập gần nhất"
                      value={new Date(user.lastLoginAt).toLocaleString('vi-VN')}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <SecuritySettings
                user={user}
                onChangePassword={() => navigate('/account/password/change')}
                onSetPassword={() => navigate('/account/password/set')}
                onChangeEmail={() => navigate('/account/email/change')}
                onChangePhone={() => navigate('/account/phone/change')}
                onManageSessions={() => setActiveTab('sessions')}
                onToggle2FA={() => navigate('/security/2fa')}
                onDeleteAccount={() => navigate('/account/delete')}
              />
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && sessions && (
              <SessionsList
                sessions={sessions.sessions}
                onRevokeSession={revokeSession}
                onRevokeAllOthers={revokeAllOtherSessions}
              />
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileForm
          user={user}
          onSave={handleUpdateProfile}
          onCancel={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
};

// Helper Component
const InfoRow: React.FC<{ label: string; value?: string; verified?: boolean }> = ({
  label,
  value,
  verified,
}) => (
  <div className="flex items-center justify-between py-3 border-b last:border-0">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-900">{value || 'Chưa cập nhật'}</span>
      {verified && (
        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
          Đã xác thực
        </span>
      )}
    </div>
  </div>
);

export default ProfilePage;