import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

interface Props { onOpenSidebar?: () => void; }

export const EmptyState: React.FC<Props> = ({ onOpenSidebar }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-50)', padding: '2rem', textAlign: 'center' }}>
    <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 24 }}>
      <div className="animate-pulse-slow" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--color-primary-100)' }} />
      <div className="animate-pulse-slow" style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: '2px solid var(--color-primary-100)', animationDelay: '0.4s' }} />
      <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-primary-100)' }}>
        <MessageCircle size={20} style={{ color: 'var(--color-primary-400)' }} />
      </div>
    </div>

    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-800)', marginBottom: 8 }}>
      Chọn một cuộc trò chuyện
    </h2>
    <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-400)', maxWidth: 240, lineHeight: 1.6, marginBottom: 20 }}>
      Chọn từ danh sách hoặc bắt đầu cuộc trò chuyện mới
    </p>

    <button onClick={onOpenSidebar} className="btn-ripple transition-base lg:hidden"
      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-body)', background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))', boxShadow: '0 4px 14px rgba(139,102,66,0.28)' }}>
      <Sparkles size={14} /> Mở danh sách
    </button>
  </div>
);