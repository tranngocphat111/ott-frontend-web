import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { FpSubmitButton, FpFieldWrapper } from './ForgotPasswordParts';

interface Props {
    onSubmit: (newPassword: string, confirmPassword: string) => void;
    loading: boolean;
}

export const Step3NewPassword: React.FC<Props> = ({ onSubmit, loading }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) { setLocalError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
        if (newPassword !== confirmPassword) { setLocalError('Mật khẩu xác nhận không khớp'); return; }
        setLocalError('');
        onSubmit(newPassword, confirmPassword);
    };

    const displayError = localError;
    const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
    const canSubmit = newPassword.length >= 6 && passwordsMatch;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {displayError && (
                <div className="animate-slide-down" style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: 'var(--color-error-bg)',
                    border: '1px solid var(--color-error-border)',
                }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-error-text)' }}>{displayError}</p>
                </div>
            )}

            {/* Success badge */}
            <div className="animate-slide-down" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 12,
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
            }}>
                <CheckCircle2 size={15} style={{ color: 'var(--color-success-border)', flexShrink: 0 }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-success-text)', fontWeight: 500 }}>
                    OTP đã xác thực thành công
                </p>
            </div>

            {/* New password */}
            <FpFieldWrapper label="Mật khẩu mới" icon={<Lock size={15} />} delay="40ms">
                <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setLocalError(''); }}
                    placeholder="Tối thiểu 6 ký tự"
                    autoFocus
                    required
                    className="focus-ring transition-base"
                    style={inputStyle()}
                />
                <ToggleEye show={showNew} onToggle={() => setShowNew(p => !p)} />
            </FpFieldWrapper>

            {/* Confirm password */}
            <FpFieldWrapper
                label="Xác nhận mật khẩu"
                icon={<Lock size={15} />}
                hint={
                    confirmPassword.length > 0
                        ? passwordsMatch
                            ? <span style={{ color: 'var(--color-success-text)' }}>✓ Mật khẩu khớp</span>
                            : <span style={{ color: 'var(--color-error-text)' }}>Mật khẩu không khớp</span>
                        : undefined
                }
                delay="80ms"
            >
                <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setLocalError(''); }}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="focus-ring transition-base"
                    style={{
                        ...inputStyle(),
                        border: confirmPassword.length > 0
                            ? `1.5px solid ${passwordsMatch ? 'var(--color-success-border)' : 'var(--color-error-border)'}`
                            : '1.5px solid var(--color-primary-200)',
                    }}
                />
                <ToggleEye show={showConfirm} onToggle={() => setShowConfirm(p => !p)} />
            </FpFieldWrapper>

            <div className="animate-slide-up" style={{ animationDelay: '120ms' }}>
                <FpSubmitButton
                    loading={loading}
                    label="Đặt lại mật khẩu"
                    loadingLabel="Đang xử lý..."
                    disabled={!canSubmit}
                />
            </div>
        </form>
    );
};

function ToggleEye({ show, onToggle }: { show: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="transition-fast"
            style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-primary-400)', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
            }}
        >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
    );
}

const inputStyle = (): React.CSSProperties => ({
    width: '100%', paddingLeft: 38, paddingRight: 40, paddingTop: 10, paddingBottom: 10,
    borderRadius: 12, fontSize: '0.875rem',
    border: '1.5px solid var(--color-primary-200)',
    background: 'rgba(255,255,255,0.7)',
    color: 'var(--color-primary-900)',
    outline: 'none',
});