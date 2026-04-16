import { ArrowLeft } from 'lucide-react';

export function Spinner() {
    return <span className="animate-spin" style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />;
}

export function SubmitBtn({ loading, label, loadingLabel, disabled }: { loading: boolean; label: string; loadingLabel: string; disabled?: boolean }) {
    return (
        <button type="submit" disabled={loading || disabled}
            className="btn-ripple transition-base hover-lift"
            style={{ width: '100%', paddingTop: 12, paddingBottom: 12, borderRadius: 12, fontSize: '0.875rem', fontWeight: 600, color: 'white', border: 'none', cursor: loading || disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-body)', background: loading || disabled ? 'var(--color-primary-300)' : 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))', boxShadow: loading || disabled ? 'none' : '0 4px 14px rgba(139,102,66,0.35)' }}>
            {loading && <Spinner />}
            {loading ? loadingLabel : label}
        </button>
    );
}

export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, textAlign: 'center', color: 'var(--color-primary-700)', letterSpacing: '0.04em' }}>
                Nhập mã 6 chữ số
            </label>
            <input
                type="text" value={value} inputMode="numeric" autoComplete="one-time-code"
                maxLength={6} required placeholder="· · · · · ·"
                onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="focus-ring transition-base"
                style={{ width: '100%', padding: '16px 12px', borderRadius: 14, textAlign: 'center', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.45em', fontFamily: 'monospace', border: '1.5px solid var(--color-primary-200)', background: 'rgba(255,255,255,0.8)', color: 'var(--color-primary-900)', outline: 'none', boxShadow: 'var(--shadow-sm)' }}
            />
            <p style={{ fontSize: '0.75rem', marginTop: 5, textAlign: 'center', color: 'var(--color-primary-400)' }}>Kiểm tra hộp thư đến và thư rác</p>
        </div>
    );
}

export function BackBtn({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="transition-fast"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-primary-600)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <ArrowLeft size={15} /> Quay lại
        </button>
    );
}