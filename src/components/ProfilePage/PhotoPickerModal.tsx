import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Upload, Trash2, Check, RotateCcw, ImageOff, Loader2 } from 'lucide-react';
import { PhotoType } from '../../types/enums/photo.enum';
import type { UserPhotoResponse, PhotoListResponse } from '../../types/response/photo.response';
import type { UserProfileResponse } from '../../types';

interface PhotoPickerModalProps {
    open: boolean;
    type: PhotoType;
    photos: PhotoListResponse | null;
    loading: boolean;
    uploadProgress: number | null;
    error: string | null;
    onClose: () => void;
    onUpload: (file: File, type: PhotoType) => Promise<UserProfileResponse | null>;
    onSetActive: (photoId: string) => Promise<string | null>; // Đã sửa
    onDelete: (photoId: string) => Promise<void>;
    onRemoveActive: (type: PhotoType) => Promise<UserProfileResponse | null>;
    onSuccess?: (profile: UserProfileResponse) => void;
    onActiveChanged?: (newUrl: string, type: PhotoType) => void; // Mới thêm
}

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_MB = 5;

const validateFile = (file: File): string | null => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Chỉ hỗ trợ JPG, PNG, WEBP';
    if (file.size > MAX_MB * 1024 * 1024) return `Ảnh tối đa ${MAX_MB}MB`;
    return null;
};

// ─── Sub-component: Photo thumbnail in grid ───────────────────────────────────

interface ThumbProps {
    photo: UserPhotoResponse;
    isActive: boolean;
    onSetActive: () => void;
    onDelete: () => void;
    disabled: boolean;
}

const PhotoThumb: React.FC<ThumbProps> = ({ photo, isActive, onSetActive, onDelete, disabled }) => {
    const [hover, setHover] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleting(true);
        await onDelete();
        setDeleting(false);
    };

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => !disabled && !isActive && onSetActive()}
            style={{
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                cursor: isActive || disabled ? 'default' : 'pointer',
                border: isActive
                    ? '2.5px solid var(--color-primary-500)'
                    : '2px solid var(--color-primary-100)',
                transition: 'border-color 0.2s, transform 0.15s',
                transform: hover && !isActive && !disabled ? 'scale(1.03)' : 'scale(1)',
            }}
        >
            <img
                src={photo.url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Active badge */}
            {isActive && (
                <div style={{
                    position: 'absolute', top: 5, left: 5,
                    background: 'var(--color-primary-500)',
                    borderRadius: 6, padding: '2px 7px',
                    display: 'flex', alignItems: 'center', gap: 3,
                    fontSize: '0.65rem', fontWeight: 700, color: 'white',
                    fontFamily: 'var(--font-body)',
                }}>
                    <Check size={9} /> Đang dùng
                </div>
            )}

            {/* Hover overlay */}
            {hover && !disabled && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(35,26,16,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                    {!isActive && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSetActive(); }}
                            title="Dùng ảnh này"
                            style={{
                                background: 'white', border: 'none', borderRadius: 8,
                                width: 32, height: 32, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Check size={14} style={{ color: 'var(--color-primary-600)' }} />
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        title="Xóa ảnh"
                        style={{
                            background: deleting ? '#eee' : 'white', border: 'none', borderRadius: 8,
                            width: 32, height: 32, cursor: deleting ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        {deleting
                            ? <Loader2 size={13} style={{ color: '#aaa', animation: 'spin 0.8s linear infinite' }} />
                            : <Trash2 size={13} style={{ color: '#d94f4f' }} />}
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const PhotoPickerModal: React.FC<PhotoPickerModalProps> = ({
    open, type, photos, loading, uploadProgress, error,
    onClose, onUpload, onSetActive, onDelete, onRemoveActive, onSuccess, onActiveChanged // Nhận prop mới
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const isAvatar = type === PhotoType.AVATAR;
    const label = isAvatar ? 'ảnh đại diện' : 'ảnh bìa';
    const list = photos ? (isAvatar ? photos.avatars : photos.covers) : [];
    const activeUrl = photos ? (isAvatar ? photos.activeAvatarUrl : photos.activeCoverUrl) : null;
    const hasActive = !!activeUrl;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleFile = useCallback(
        async (file: File) => {
            const err = validateFile(file);
            if (err) { setLocalError(err); return; }
            setLocalError(null);
            setActionLoading(true);
            const profile = await onUpload(file, type);
            setActionLoading(false);
            if (profile && onSuccess) onSuccess(profile);
        },
        [onUpload, type, onSuccess]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    // Logic mới cập nhật để bắn event ra ngoài
    const handleSetActive = async (photoId: string) => {
        setActionLoading(true);
        const newUrl = await onSetActive(photoId);
        setActionLoading(false);

        if (newUrl && onActiveChanged) {
            onActiveChanged(newUrl, type);
        }
    };

    const handleDelete = async (photoId: string) => {
        await onDelete(photoId);
    };

    const handleRemoveActive = async () => {
        setActionLoading(true);
        const profile = await onRemoveActive(type);
        setActionLoading(false);
        if (profile && onSuccess) onSuccess(profile);
    };

    if (!open) return null;

    const busy = loading || actionLoading || uploadProgress !== null;
    const displayError = localError ?? error;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(35,26,16,0.55)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.2s ease forwards',
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, pointerEvents: 'none',
            }}>
                <div
                    style={{
                        pointerEvents: 'all',
                        background: 'white',
                        borderRadius: 18,
                        boxShadow: 'var(--shadow-xl)',
                        width: '100%', maxWidth: 520,
                        maxHeight: '90vh',
                        display: 'flex', flexDirection: 'column',
                        animation: 'slideUp 0.3s var(--ease-spring) forwards',
                        fontFamily: 'var(--font-body)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--color-primary-100)',
                        flexShrink: 0,
                    }}>
                        <h2 style={{
                            margin: 0, fontSize: '1rem', fontWeight: 700,
                            color: 'var(--color-primary-900)',
                            fontFamily: 'var(--font-display)',
                        }}>
                            Quản lý {label}
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: 4, borderRadius: 6,
                                color: 'var(--color-primary-400)',
                                display: 'flex', alignItems: 'center',
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }} className="custom-scrollbar">

                        {/* Error banner */}
                        {displayError && (
                            <div style={{
                                background: 'var(--color-error-bg)',
                                border: '1px solid var(--color-error-border)',
                                borderRadius: 8, padding: '8px 12px',
                                fontSize: '0.8125rem', color: 'var(--color-error-text)',
                                marginBottom: 14,
                            }}>
                                {displayError}
                            </div>
                        )}

                        {/* Upload zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => !busy && fileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${dragOver ? 'var(--color-primary-400)' : 'var(--color-primary-200)'}`,
                                borderRadius: 12,
                                padding: '20px 16px',
                                textAlign: 'center',
                                cursor: busy ? 'not-allowed' : 'pointer',
                                background: dragOver ? 'var(--color-primary-50)' : 'transparent',
                                transition: 'all 0.2s',
                                marginBottom: 18,
                            }}
                        >
                            {uploadProgress !== null ? (
                                <div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', marginBottom: 8 }}>
                                        Đang tải lên... {uploadProgress}%
                                    </div>
                                    <div style={{
                                        height: 6, background: 'var(--color-primary-100)', borderRadius: 99, overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%', width: `${uploadProgress}%`,
                                            background: 'var(--color-primary-500)',
                                            borderRadius: 99, transition: 'width 0.3s',
                                        }} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Upload size={22} style={{ color: 'var(--color-primary-300)', marginBottom: 6 }} />
                                    <p style={{ margin: '0 0 2px', fontSize: '0.875rem', color: 'var(--color-primary-700)', fontWeight: 600 }}>
                                        Tải ảnh mới lên
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-primary-400)' }}>
                                        Kéo thả hoặc click · JPG, PNG, WEBP · Tối đa {MAX_MB}MB
                                    </p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPT}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />

                        {/* Gallery */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: 10,
                        }}>
                            <p style={{
                                margin: 0, fontSize: '0.8125rem', fontWeight: 600,
                                color: 'var(--color-primary-700)',
                            }}>
                                Thư viện ({list.length}/10)
                            </p>
                            {hasActive && (
                                <button
                                    onClick={handleRemoveActive}
                                    disabled={busy}
                                    style={{
                                        background: 'none', border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        fontSize: '0.75rem', color: 'var(--color-error-text)',
                                        fontFamily: 'var(--font-body)', padding: '3px 6px', borderRadius: 6,
                                    }}
                                    title={`Gỡ ${label} hiện tại (reset về mặc định)`}
                                >
                                    <RotateCcw size={11} /> Đặt lại mặc định
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <Loader2 size={22} style={{
                                    color: 'var(--color-primary-300)',
                                    animation: 'spin 0.8s linear infinite',
                                }} />
                            </div>
                        ) : list.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '24px 0',
                                color: 'var(--color-primary-300)', fontSize: '0.8125rem',
                            }}>
                                <ImageOff size={28} style={{ marginBottom: 6 }} />
                                <p style={{ margin: 0 }}>Chưa có ảnh nào trong thư viện</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                gap: 10,
                            }}>
                                {list.map((photo) => (
                                    <PhotoThumb
                                        key={photo.id}
                                        photo={photo}
                                        isActive={photo.isActive}
                                        onSetActive={() => handleSetActive(photo.id)}
                                        onDelete={() => handleDelete(photo.id)}
                                        disabled={busy}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '12px 20px',
                        borderTop: '1px solid var(--color-primary-100)',
                        flexShrink: 0, textAlign: 'right',
                    }}>
                        <button
                            onClick={onClose}
                            className="transition-base"
                            style={{
                                padding: '7px 18px', borderRadius: 9,
                                border: '1.5px solid var(--color-primary-200)',
                                background: 'white', cursor: 'pointer',
                                fontSize: '0.875rem', fontWeight: 600,
                                color: 'var(--color-primary-700)',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            Xong
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};