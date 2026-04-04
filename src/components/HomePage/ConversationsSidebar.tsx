import React, { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { SidebarHeader } from './SidebarHeader';
import { ConversationItem, type Conversation } from './ConversationItem';

interface Props {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (c: Conversation) => void;
  onNewChat?: () => void;
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean; // desktop mode: không cần nút đóng
}

export const ConversationsSidebar: React.FC<Props> = ({
  conversations, selectedConversation, onSelectConversation, onNewChat, onClose, embedded,
}) => {
  const [query, setQuery] = useState('');
  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Accent top line */}
      <div style={{ height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--color-primary-300), var(--color-primary-500), var(--color-primary-300))' }} />

      {/* Header with avatar + menu */}
      <SidebarHeader onMenuClick={onClose} showClose={!embedded} />

      {/* Search */}
      <div style={{ padding: '10px 12px', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm..."
            className="focus-ring transition-base"
            style={{ width: '100%', paddingLeft: 32, paddingRight: query ? 30 : 10, paddingTop: 8, paddingBottom: 8, borderRadius: 10, fontSize: '0.8125rem', border: '1.5px solid var(--color-primary-100)', background: 'var(--color-primary-50)', color: 'var(--color-primary-900)', outline: 'none', boxSizing: 'border-box' }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* New chat button */}
      <div style={{ padding: '0 12px 10px', flexShrink: 0 }}>
        <button
          onClick={onNewChat}
          className="btn-ripple transition-base"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'white', fontFamily: 'var(--font-body)', background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))', boxShadow: '0 3px 10px rgba(139,102,66,0.28)' }}
        >
          <Plus size={14} /> Cuộc trò chuyện mới
        </button>
      </div>

      {/* Section label */}
      <div style={{ padding: '2px 14px 6px', flexShrink: 0 }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary-400)' }}>
          Tin nhắn {filtered.length > 0 && `· ${filtered.length}`}
        </span>
      </div>

      {/* Conversation list */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--color-primary-400)', fontSize: '0.8125rem' }}>
            Không tìm thấy kết quả
          </div>
        ) : filtered.map((conv, i) => (
          <div key={conv.id} className="animate-fade-in" style={{ animationDelay: `${i * 25}ms` }}>
            <ConversationItem
              conversation={conv}
              isActive={selectedConversation?.id === conv.id}
              onClick={() => onSelectConversation(conv)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};