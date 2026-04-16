import React from 'react';
import { Info } from 'lucide-react';

// eslint-disable-next-line react-refresh/only-export-components
export const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12,
    fontSize: '0.875rem', border: '1.5px solid var(--color-primary-200)',
    background: 'rgba(255,255,255,0.7)', color: 'var(--color-primary-900)',
    outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
};

// eslint-disable-next-line react-refresh/only-export-components
export const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'white',
    fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 7,
    background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))',
    boxShadow: '0 4px 14px rgba(139,102,66,0.3)',
};

// eslint-disable-next-line react-refresh/only-export-components
export const btnDanger: React.CSSProperties = {
    ...btnPrimary,
    background: 'linear-gradient(135deg, #b91c1c, #dc2626)',
    boxShadow: '0 4px 14px rgba(185,28,28,0.3)',
};

// eslint-disable-next-line react-refresh/only-export-components
export const btnOutline: React.CSSProperties = {
    flex: 1, padding: '11px 0', borderRadius: 12,
    border: '1.5px solid var(--color-primary-200)', cursor: 'pointer',
    fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-600)',
    background: 'transparent', fontFamily: 'var(--font-body)',
};

/* ─── Primitives ─────────────────────────────────────── */
export function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label style={{
            display: 'block', fontSize: '0.75rem', fontWeight: 600,
            marginBottom: 6, color: 'var(--color-primary-700)', letterSpacing: '0.02em',
        }}>
            {children}
        </label>
    );
}

export function RowBtns({ children }: { children: React.ReactNode }) {
    return <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>{children}</div>;
}

export function Spinner() {
    return (
        <span
            className="animate-spin"
            style={{
                width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.35)',
                borderTopColor: 'white', borderRadius: '50%', display: 'inline-block',
            }}
        />
    );
}

export function OtpInfo({ email }: { email?: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 14px', borderRadius: 12,
            background: 'var(--color-primary-50)',
            border: '1px solid var(--color-primary-100)',
        }}>
            <Info size={14} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-700)' }}>
                Mã OTP đã gửi đến{' '}
                <strong style={{ color: 'var(--color-primary-900)' }}>{email}</strong>
            </p>
        </div>
    );
}

export function OtpField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <FieldLabel>Nhập mã 6 chữ số</FieldLabel>
            <input
                type="text"
                value={value}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="· · · · · ·"
                autoFocus
                onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="focus-ring transition-base"
                style={{
                    width: '100%', padding: '16px 12px', borderRadius: 14, textAlign: 'center',
                    fontSize: '2rem', fontWeight: 700, letterSpacing: '0.45em',
                    fontFamily: 'monospace', border: '1.5px solid var(--color-primary-200)',
                    background: 'rgba(255,255,255,0.8)', color: 'var(--color-primary-900)',
                    outline: 'none', boxShadow: 'var(--shadow-sm)', boxSizing: 'border-box',
                }}
            />
            <p style={{ fontSize: '0.75rem', marginTop: 5, textAlign: 'center', color: 'var(--color-primary-400)' }}>
                Kiểm tra hộp thư đến và thư rác
            </p>
        </div>
    );
}

/* ─── Banner ─────────────────────────────────────────── */
type BannerType = 'success' | 'warning' | 'error';

const BANNER_COLORS: Record<BannerType, { bg: string; border: string; title: string; text: string }> = {
    success: { bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', title: 'var(--color-success-text)', text: 'var(--color-success-text)' },
    warning: { bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', title: 'var(--color-warning-text)', text: 'var(--color-warning-text)' },
    error: { bg: 'var(--color-error-bg)', border: 'var(--color-error-border)', title: 'var(--color-error-text)', text: 'var(--color-error-text)' },
};

export function Banner({
    type, icon, title, text,
}: {
    type: BannerType;
    icon: React.ReactNode;
    title?: string;
    text: string;
}) {
    const c = BANNER_COLORS[type];
    return (
        <div
            className="animate-slide-down"
            style={{
                display: 'flex', gap: 10, padding: '12px 14px',
                borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`,
            }}
        >
            <span style={{ color: c.title, flexShrink: 0, marginTop: 1 }}>{icon}</span>
            <div>
                {title && (
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: c.title, marginBottom: 3 }}>{title}</p>
                )}
                <p style={{ fontSize: '0.8125rem', color: c.text, lineHeight: 1.55 }}>{text}</p>
            </div>
        </div>
    );
}