import React, { useState } from 'react';
import { Phone, Mail } from 'lucide-react';
import { FpSubmitButton, FpBackButton, FpFieldWrapper } from './ForgotPasswordParts';

interface Props {
    onNext: (phone: string, email: string) => void;
    loading: boolean;
}

export const Step1Request: React.FC<Props> = ({ onNext, loading }) => {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [emailError, setEmailError] = useState('');

    const validatePhone = () => {
        if (!phone.trim()) { setPhoneError('Vui lòng nhập số điện thoại'); return false; }
        if (!/^(0|\+84)[0-9]{9,10}$/.test(phone)) { setPhoneError('Số điện thoại không hợp lệ'); return false; }
        setPhoneError(''); return true;
    };

    const validateEmail = () => {
        if (!email.trim()) { setEmailError('Vui lòng nhập email'); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Email không hợp lệ'); return false; }
        setEmailError(''); return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validatePhone() && validateEmail()) onNext(phone, email);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <FpFieldWrapper
                label="Số điện thoại"
                icon={<Phone size={15} />}
                error={phoneError}
                delay="0ms"
            >
                <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                    onBlur={validatePhone}
                    placeholder="0123 456 789"
                    required
                    className="focus-ring transition-base"
                    style={inputStyle(!!phoneError)}
                />
            </FpFieldWrapper>

            <FpFieldWrapper
                label="Email"
                icon={<Mail size={15} />}
                error={emailError}
                delay="40ms"
            >
                <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    onBlur={validateEmail}
                    placeholder="you@example.com"
                    required
                    className="focus-ring transition-base"
                    style={inputStyle(!!emailError)}
                />
            </FpFieldWrapper>

            {/* Hint card */}
            <div className="animate-slide-up" style={{
                animationDelay: '80ms',
                padding: '10px 14px', borderRadius: 12,
                background: 'var(--color-info-bg)',
                border: '1px solid var(--color-info-border)',
            }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)', lineHeight: 1.6 }}>
                    Nhập đúng số điện thoại và email đã đăng ký.
                    Mã OTP sẽ được gửi đến <strong style={{ color: 'var(--color-primary-800)' }}>email</strong> của bạn.
                </p>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                <FpSubmitButton loading={loading} label="Gửi mã OTP" loadingLabel="Đang gửi..." />
            </div>

            <FpBackButton label="Quay lại đăng nhập" onClick={() => window.location.href = '/login'} />
        </form>
    );
};

const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
    borderRadius: 12, fontSize: '0.875rem',
    border: `1.5px solid ${hasError ? 'var(--color-error-border)' : 'var(--color-primary-200)'}`,
    background: 'rgba(255,255,255,0.7)',
    color: 'var(--color-primary-900)',
    outline: 'none',
});