import React, { useState } from 'react';
import PasswordField from './PasswordField';
import ChangePasswordWarning from './ChangePasswordWarning';

interface FormData {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface ChangePasswordFormProps {
    onSubmit: (data: { oldPassword: string; newPassword: string }) => Promise<void>;
    isLoading: boolean;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState<FormData>({
        oldPassword: '', newPassword: '', confirmPassword: '',
    });
    const [show, setShow] = useState({ old: false, new: false, confirm: false });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (field: keyof FormData) => (value: string) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const toggleShow = (field: 'old' | 'new' | 'confirm') =>
        setShow(prev => ({ ...prev, [field]: !prev[field] }));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.oldPassword) e.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';
        if (!formData.newPassword) {
            e.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (formData.newPassword.length < 8) { 
            e.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
        } else if (formData.newPassword === formData.oldPassword) {
            e.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }
        if (!formData.confirmPassword) {
            e.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
        } else if (formData.newPassword !== formData.confirmPassword) {
            e.confirmPassword = 'Mật khẩu không khớp';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await onSubmit({ oldPassword: formData.oldPassword, newPassword: formData.newPassword });
        } catch {
            // errors handled by parent via toast
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ChangePasswordWarning />

            <PasswordField
                label="Mật khẩu hiện tại"
                value={formData.oldPassword}
                onChange={set('oldPassword')}
                show={show.old}
                onToggleShow={() => toggleShow('old')}
                placeholder="Nhập mật khẩu hiện tại"
                error={errors.oldPassword}
            />

            <PasswordField
                label="Mật khẩu mới"
                value={formData.newPassword}
                onChange={set('newPassword')}
                show={show.new}
                onToggleShow={() => toggleShow('new')}
                placeholder="Tối thiểu 8 ký tự" // Cập nhật placeholder
                error={errors.newPassword}
            />

            <PasswordField
                label="Xác nhận mật khẩu mới"
                value={formData.confirmPassword}
                onChange={set('confirmPassword')} 
                show={show.confirm}
                onToggleShow={() => toggleShow('confirm')}
                placeholder="Nhập lại mật khẩu mới"
                error={errors.confirmPassword}
            />

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--color-primary-100)', margin: '4px 0' }} />

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="btn-ripple transition-base"
                style={{
                    width: '100%', padding: '12px 0', borderRadius: 14,
                    border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: isLoading
                        ? 'var(--color-primary-200)'
                        : 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
                    color: 'white', fontSize: '0.9375rem', fontWeight: 700,
                    fontFamily: 'var(--font-body)', letterSpacing: '0.01em',
                    boxShadow: isLoading ? 'none' : 'var(--shadow-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
            >
                {isLoading ? (
                    <>
                        <span className="animate-spin" style={{
                            width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: 'white', borderRadius: '50%', display: 'inline-block',
                        }} />
                        Đang xử lý...
                    </>
                ) : 'Đổi mật khẩu'}
            </button>
        </form>
    );
};

export default ChangePasswordForm;