import React, { useState } from 'react';
import { X, Save, User } from 'lucide-react';
import type { UserProfileResponse, Gender } from '../../types';

interface Props {
  user: UserProfileResponse;
  onSave: (data: {
    fullName?: string;
    bio?: string;
    work?: string;
    location?: string;
    relationshipStatus?: string;
    dateOfBirth?: string;
    gender?: Gender;
  }) => Promise<void>;
  onCancel: () => void;
}

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: '0.875rem',
  border: '1.5px solid var(--color-primary-200)',
  background: 'rgba(255,255,255,0.7)', color: 'var(--color-primary-900)',
  outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
};

export const EditProfileForm: React.FC<Props> = ({ user, onSave, onCancel }) => {
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    bio: user.bio || '',
    work: user.work || '',
    location: user.location || '',
    relationshipStatus: user.relationshipStatus || '',
    dateOfBirth: user.dateOfBirth || '',
    gender: (user.gender || 'OTHER') as Gender,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await onSave(form); } finally { setLoading(false); }
  };

  return (
    <div
      className="animate-fade-in"
      style={{ position: 'fixed', inset: 0, background: 'rgba(35,26,16,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="animate-scale-in glass"
        style={{ width: '100%', maxWidth: 440, borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-primary-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={15} style={{ color: 'var(--color-primary-600)' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
              Chỉnh sửa thông tin
            </span>
          </div>
          <button onClick={onCancel} className="transition-fast"
            style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-400)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-100)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {[
              { label: 'Họ và tên', key: 'fullName', type: 'text', required: true },
            ].map(({ label, key, type, required }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)', letterSpacing: '0.02em' }}>
                  {label} {required && <span style={{ color: 'var(--color-primary-400)' }}>*</span>}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required={required}
                  className="focus-ring transition-base"
                  style={fieldStyle}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)' }}>Giới thiệu</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="Viết vài dòng về bạn..."
                className="focus-ring transition-base"
                style={{ ...fieldStyle, resize: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)' }}>Công việc</label>
                <input
                  type="text"
                  value={form.work}
                  onChange={e => setForm(f => ({ ...f, work: e.target.value }))}
                  placeholder="VD: Kỹ sư phần mềm"
                  className="focus-ring transition-base"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)' }}>Địa điểm</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="VD: TP. HCM"
                  className="focus-ring transition-base"
                  style={fieldStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)' }}>Tình trạng quan hệ</label>
              <input
                type="text"
                value={form.relationshipStatus}
                onChange={e => setForm(f => ({ ...f, relationshipStatus: e.target.value }))}
                placeholder="VD: Độc thân"
                className="focus-ring transition-base"
                style={fieldStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)' }}>Ngày sinh</label>
                <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  className="focus-ring transition-base" style={fieldStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-primary-700)' }}>Giới tính</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}
                  className="focus-ring transition-base" style={fieldStyle}>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onCancel} className="transition-base"
              style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid var(--color-primary-200)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-600)', background: 'transparent', fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn-ripple transition-base"
              style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: loading ? 'var(--color-primary-300)' : 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))', boxShadow: loading ? 'none' : '0 3px 10px rgba(139,102,66,0.28)' }}>
              {loading
                ? <><span className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} /> Đang lưu...</>
                : <><Save size={14} /> Lưu thay đổi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};