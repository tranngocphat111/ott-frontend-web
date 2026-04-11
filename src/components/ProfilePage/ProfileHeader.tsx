import React, { useState, useEffect } from 'react';
import { Camera, Mail, Phone, Calendar, Shield } from 'lucide-react';
import type { UserProfileResponse } from '../../types';
import { PhotoPickerModal } from './PhotoPickerModal';
import { usePhotoManager } from '../../hooks/usePhotoManager';
import { PhotoType } from '../../types/enums/photo.enum';

interface Props {
  user: UserProfileResponse;
  onProfileUpdate?: (updated: UserProfileResponse) => void;
}

export const ProfileHeader: React.FC<Props> = ({ user, onProfileUpdate }) => {
  const [modalType, setModalType] = useState<PhotoType | null>(null);

  const {
    photos, loading, uploadProgress, error,
    fetchPhotos, uploadPhoto, setActive, removePhoto, removeActive,
  } = usePhotoManager();

  useEffect(() => {
    if (modalType !== null) fetchPhotos();
  }, [modalType]);

  const openModal = (type: PhotoType) => setModalType(type);
  const closeModal = () => setModalType(null);

  const handleSuccess = (profile: UserProfileResponse) => {
    onProfileUpdate?.(profile);
  };

  const handleActiveChanged = (newUrl: string, type: PhotoType) => {
    const updatedUser = { ...user }; 
    if (type === PhotoType.AVATAR) {
      updatedUser.avatarUrl = newUrl;
    } else {
      updatedUser.coverUrl = newUrl;
    }
    onProfileUpdate?.(updatedUser); 
  };

  const AVATAR_SIZE = 88;
  const AVATAR_HALF = AVATAR_SIZE / 2;

  return (
    <>
      <div style={{
        background: 'white',
        borderRadius: 20,
        border: '1px solid var(--color-primary-100)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        fontFamily: 'var(--font-body)',
      }}>
        {/* Cover */}
        <div style={{ position: 'relative', height: 200 }}>
          {user.coverUrl ? (
            <img
              src={user.coverUrl}
              alt="Cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-500) 55%, var(--color-primary-300) 100%)',
              position: 'relative',
            }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
                <defs>
                  <pattern id="cover-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cover-dots)" />
              </svg>
            </div>
          )}

          <button
            onClick={() => openModal(PhotoType.COVER)}
            className="transition-base"
            style={{
              position: 'absolute', bottom: 10, right: 12,
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 600,
              background: 'rgba(255,252,250,0.88)', color: 'var(--color-primary-700)',
              backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-sm)',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'white')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,252,250,0.88)')}
          >
            <Camera size={12} /> Đổi ảnh bìa
          </button>
        </div>

        {/* Avatar + info */}
        <div style={{ padding: '0 20px', position: 'relative' }}>
          <div style={{
            position: 'relative', display: 'inline-block',
            marginTop: -AVATAR_HALF, marginBottom: 10,
          }}>
            <div style={{
              width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%',
              border: '3px solid white', boxShadow: 'var(--shadow-md)',
              overflow: 'hidden', background: 'var(--color-primary-100)',
            }}>
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Nút camera trên avatar */}
            <button
              onClick={() => openModal(PhotoType.AVATAR)}
              className="transition-base"
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 26, height: 26, borderRadius: '50%',
                background: 'white', border: '2px solid var(--color-primary-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              title="Đổi ảnh đại diện"
            >
              <Camera size={11} style={{ color: 'var(--color-primary-600)' }} />
            </button>
          </div>

          <div style={{ paddingBottom: 20 }}>
            {/* Name + 2FA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700,
                color: 'var(--color-primary-900)', margin: 0, lineHeight: 1.3,
              }}>
                {user.fullName}
              </h1>
              {user.is2FAEnabled && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '2px 8px', borderRadius: 6,
                  background: 'var(--color-success-bg)', color: 'var(--color-success-text)',
                  fontSize: '0.6875rem', fontWeight: 700,
                  border: '1px solid var(--color-success-border)',
                }}>
                  <Shield size={10} /> 2FA
                </span>
              )}
            </div>

            {user.bio && (
              <p style={{
                fontSize: '0.875rem', color: 'var(--color-primary-500)',
                marginBottom: 10, lineHeight: 1.5,
              }}>
                {user.bio}
              </p>
            )}

            

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px' }}>
              {([
                { icon: <Phone size={12} />, text: user.phone },
                user.email ? { icon: <Mail size={12} />, text: user.email } : null,
                { icon: <Calendar size={12} />, text: `Tham gia ${new Date(user.createdAt).toLocaleDateString('vi-VN')}` },
              ] as Array<{ icon: React.ReactNode; text: string } | null>)
                .filter(Boolean)
                .map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: '0.8125rem', color: 'var(--color-primary-400)',
                  }}>
                    {item!.icon} {item!.text}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <PhotoPickerModal
        open={modalType !== null}
        type={modalType ?? PhotoType.AVATAR}
        photos={photos}
        loading={loading}
        uploadProgress={uploadProgress}
        error={error}
        onClose={closeModal}
        onUpload={uploadPhoto}
        onSetActive={setActive}
        onDelete={removePhoto}
        onRemoveActive={removeActive}
        onSuccess={handleSuccess}
        onActiveChanged={handleActiveChanged} 
      />
    </>
  );
};