import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { FpSubmitButton, FpBackButton } from './ForgotPasswordParts';

interface Props {
    phone: string;
    email: string;
    onNext: (otp: string) => void;
    onBack: () => void;
    onResend: () => void;
    loading: boolean;
    countdown: number;
}

export const Step2VerifyOtp: React.FC<Props> = ({
    phone, email, onNext, onBack, onResend, loading, countdown,
}) => {
    const [otp, setOtp] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) { setLocalError('Vui lòng nhập đủ 6 chữ số'); return; }
        setLocalError('');
        onNext(otp);
    };

    const displayError = localError;

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

            {/* Info banner */}
            <div className="animate-slide-down" style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', borderRadius: 12,
                background: 'var(--color-info-bg)',
                border: '1px solid var(--color-info-border)',
            }}>
                <ShieldCheck size={15} style={{ color: 'var(--color-primary-500)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary-700)', lineHeight: 1.6 }}>
                    <p>SĐT: <strong style={{ color: 'var(--color-primary-800)' }}>{phone.replace(/(\d{3})\d+(\d{3})/, '$1****$2')}</strong></p>
                    <p>Email: <strong style={{ color: 'var(--color-primary-800)' }}>{email.replace(/(.{3}).*(@.*)/, '$1***$2')}</strong></p>
                </div>
            </div>

            {/* OTP big input */}
            <div className="animate-slide-up" style={{ animationDelay: '40ms' }}>
                <label style={{
                    display: 'block', fontSize: '0.75rem', fontWeight: 600,
                    marginBottom: 8, textAlign: 'center',
                    color: 'var(--color-primary-700)', letterSpacing: '0.04em',
                }}>
                    Nhập mã 6 chữ số
                </label>
                <input
                    type="text"
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setLocalError(''); }}
                    placeholder="· · · · · ·"
                    maxLength={6}
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="focus-ring transition-base"
                    style={{
                        width: '100%', padding: '16px 12px',
                        borderRadius: 14, textAlign: 'center',
                        fontSize: '2rem', fontWeight: 700, letterSpacing: '0.5em',
                        fontFamily: 'monospace',
                        border: `1.5px solid ${displayError ? 'var(--color-error-border)' : 'var(--color-primary-200)'}`,
                        background: 'rgba(255,255,255,0.8)',
                        color: 'var(--color-primary-900)',
                        outline: 'none',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                />
                <p style={{ fontSize: '0.75rem', marginTop: 6, textAlign: 'center', color: 'var(--color-primary-400)' }}>
                    Hiệu lực trong 5 phút · Kiểm tra cả thư rác
                </p>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '80ms' }}>
                <FpSubmitButton
                    loading={loading}
                    label="Xác nhận OTP"
                    loadingLabel="Đang xác thực..."
                    disabled={otp.length !== 6}
                />
            </div>

            {/* Resend */}
            <div className="animate-slide-up" style={{ animationDelay: '100ms', textAlign: 'center' }}>
                <button
                    type="button"
                    onClick={onResend}
                    disabled={loading || countdown > 0}
                    className="transition-fast"
                    style={{
                        fontSize: '0.8125rem', fontWeight: 500,
                        color: countdown > 0 ? 'var(--color-primary-300)' : 'var(--color-primary-600)',
                        background: 'none', border: 'none',
                        cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    }}
                >
                    {countdown > 0 ? `Gửi lại mã OTP (${countdown}s)` : 'Gửi lại mã OTP'}
                </button>
            </div>

            <FpBackButton label="Quay lại" onClick={onBack} />
        </form>
    );
};