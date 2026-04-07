import React, { useRef, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble, type Message } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import type { Conversation } from './ConversationItem';

interface Props {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (msg: string) => void;
  onOpenSidebar?: () => void;
}

export const ChatArea: React.FC<Props> = ({ conversation, messages, currentUserId, onSendMessage, onOpenSidebar }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) return <EmptyState onOpenSidebar={onOpenSidebar} />;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      <ChatHeader
        conversation={conversation}
        onCall={() => {}}
        onVideoCall={() => {}}
        onMoreOptions={() => {}}
        onOpenSidebar={onOpenSidebar}
      />

      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-primary-50)' }}>
        {/* Date divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-primary-100)' }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary-400)', fontWeight: 500, letterSpacing: '0.04em' }}>Hôm nay</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-primary-100)' }} />
        </div>

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSendMessage={onSendMessage} onAttachFile={() => {}} onAttachImage={() => {}} />
    </div>
  );
};