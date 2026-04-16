import React from 'react';

export interface Conversation {
  id: string; name: string; avatar: string;
  lastMessage: string; time: string;
  unread: number; online: boolean; isGroup?: boolean;
}

interface Props { conversation: Conversation; isActive: boolean; onClick: () => void; }

export const ConversationItem: React.FC<Props> = ({ conversation, isActive, onClick }) => (
  <button onClick={onClick} className="transition-fast"
    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', cursor: 'pointer', textAlign: 'left', background: isActive ? 'var(--color-primary-50)' : 'transparent', borderLeft: `3px solid ${isActive ? 'var(--color-primary-500)' : 'transparent'}` }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-primary-50)'; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
  >
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <img src={conversation.avatar} alt={conversation.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: isActive ? '2px solid var(--color-primary-300)' : '2px solid transparent' }} />
      {conversation.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: conversation.unread > 0 ? 700 : 600, color: 'var(--color-primary-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{conversation.name}</span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary-400)', flexShrink: 0 }}>{conversation.time}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <p style={{ fontSize: '0.8125rem', color: conversation.unread > 0 ? 'var(--color-primary-700)' : 'var(--color-primary-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: conversation.unread > 0 ? 500 : 400 }}>{conversation.lastMessage}</p>
        {conversation.unread > 0 && (
          <span className="badge-pop" style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: 'var(--color-primary-500)', color: 'white', fontSize: '0.6875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {conversation.unread > 99 ? '99+' : conversation.unread}
          </span>
        )}
      </div>
    </div>
  </button>
);