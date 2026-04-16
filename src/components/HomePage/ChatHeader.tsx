import React from 'react';
import { Phone, Video, MoreVertical, ChevronLeft, Circle } from 'lucide-react';
import type { Conversation } from './ConversationItem';

interface Props {
  conversation: Conversation;
  onCall?: () => void;
  onVideoCall?: () => void;
  onMoreOptions?: () => void;
  onOpenSidebar?: () => void;
}

export const ChatHeader: React.FC<Props> = ({ conversation, onCall, onVideoCall, onMoreOptions, onOpenSidebar }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', borderBottom: '1px solid var(--color-primary-100)', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
    {/* Mobile back */}
    <button onClick={onOpenSidebar} className="lg:hidden transition-fast"
      style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-500)', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <ChevronLeft size={20} />
    </button>

    {/* Avatar */}
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <img src={conversation.avatar} alt={conversation.name}
        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary-100)' }} />
      {conversation.online && (
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />
      )}
    </div>

    {/* Info */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary-900)', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
        {conversation.name}
      </p>
      <p style={{ fontSize: '0.75rem', color: conversation.online ? '#22c55e' : 'var(--color-primary-400)', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
        {conversation.online
          ? <><Circle size={6} fill="#22c55e" strokeWidth={0} /> Đang hoạt động</>
          : 'Offline'}
      </p>
    </div>

    {/* Action buttons */}
    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
      {[
        { icon: <Phone size={16} />, fn: onCall },
        { icon: <Video size={16} />, fn: onVideoCall },
        { icon: <MoreVertical size={16} />, fn: onMoreOptions },
      ].map((btn, i) => (
        <button key={i} onClick={btn.fn} className="transition-fast"
          style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-500)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-50)'; e.currentTarget.style.color = 'var(--color-primary-700)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-primary-500)'; }}>
          {btn.icon}
        </button>
      ))}
    </div>
  </div>
);