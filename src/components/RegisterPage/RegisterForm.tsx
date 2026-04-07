import React from 'react';
import { User, Mail, Phone, Lock } from 'lucide-react';

type FormData = { phone: string; email: string; password: string; confirmPassword: string; fullName: string };
type Props = { formData: FormData; loading: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onSubmit: (e: React.FormEvent) => void; };

type Field = { label: string; name: keyof FormData; type: string; placeholder: string; hint?: string; minLength?: number; icon: React.ReactNode; };

const FIELDS: Field[] = [
  { label: 'Số điện thoại', name: 'phone', type: 'tel', placeholder: '0123 456 789', icon: <Phone size={15} /> },
  { label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com', icon: <Mail size={15} /> },
  { label: 'Họ và tên', name: 'fullName', type: 'text', placeholder: 'Nguyễn Văn A', icon: <User size={15} /> },
  { label: 'Mật khẩu', name: 'password', type: 'password', placeholder: '••••••••', hint: 'Tối thiểu 8 ký tự', minLength: 8, icon: <Lock size={15} /> },
  { label: 'Xác nhận mật khẩu', name: 'confirmPassword', type: 'password', placeholder: '••••••••', icon: <Lock size={15} /> },
];

export default function RegisterForm({ formData, loading, onChange, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {FIELDS.map(({ label, name, type, placeholder, hint, minLength, icon }, i) => (
        <div key={name} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
          <label htmlFor={name} style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-primary-700)', letterSpacing: '0.02em' }}>
            {label} <span style={{ color: 'var(--color-primary-400)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', pointerEvents: 'none' }}>
              {icon}
            </span>
            <input
              id={name} type={type} name={name}
              value={formData[name]} onChange={onChange}
              placeholder={placeholder} required minLength={minLength}
              className="focus-ring transition-base"
              style={{
                width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
                borderRadius: 12, fontSize: '0.875rem',
                border: '1.5px solid var(--color-primary-200)',
                background: 'rgba(255,255,255,0.7)',
                color: 'var(--color-primary-900)',
                outline: 'none',
              }}
            />
          </div>
          {hint && <p style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--color-primary-400)' }}>{hint}</p>}
        </div>
      ))}

      <SubmitButton loading={loading} label="Gửi mã OTP" loadingLabel="Đang gửi..." />
    </form>
  );
}

export function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit" disabled={loading}
      className="btn-ripple transition-base hover-lift"
      style={{
        width: '100%', paddingTop: 12, paddingBottom: 12, marginTop: 8,
        borderRadius: 12, fontSize: '0.875rem', fontWeight: 600, color: 'white',
        background: loading
          ? 'var(--color-primary-300)'
          : 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: loading ? 'none' : '0 4px 14px rgba(139,102,66,0.35)',
      }}
    >
      {loading && (
        <span className="animate-spin" style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}