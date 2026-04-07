import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConversationsSidebar, ChatArea } from '../components/HomePage';
import type { Conversation, Message } from '../components/HomePage';
import { mockConversations, mockMessages } from '../data/mockData';
import LoadingScreen from '../components/common/LoadingScreen';

const HomePage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) window.location.href = '/login';
  }, [isLoading, isAuthenticated]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setIsSidebarOpen(false);
    setMessages(mockMessages);
  };

  const handleSendMessage = (content: string) => {
    if (!user || !selectedConversation) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: user.id,
      content,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    }]);
  };

  if (isLoading) return <LoadingScreen message="Đang tải" />;

  if (!isAuthenticated || !user) return null;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      background: 'var(--color-primary-50)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Mobile overlay — chỉ render khi sidebar mở trên mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden animate-fade-in"
          style={{ position: 'fixed', inset: 0, background: 'rgba(35,26,16,0.45)', zIndex: 40, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar — desktop: static trong flex, mobile: fixed slide-in */}
      <div style={{
        // Desktop: luôn hiển thị, chiếm không gian trong flex
        flexShrink: 0,
        width: 300,
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        borderRight: '1px solid var(--color-primary-100)',
        zIndex: 50,
        // Mobile: fixed overlay
      }} className="hidden lg:flex">
        <ConversationsSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          onNewChat={() => console.log('new chat')}
          isOpen={false}
          onClose={() => { }}
          embedded
        />
      </div>

      {/* Mobile sidebar (fixed) */}
      <div
        className="lg:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 300, zIndex: 50,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', flexDirection: 'column',
          background: 'white',
          boxShadow: isSidebarOpen ? 'var(--shadow-xl)' : 'none',
        }}
      >
        <ConversationsSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          onNewChat={() => console.log('new chat')}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Chat area — luôn flex-1, không bị đè */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatArea
          conversation={selectedConversation}
          messages={messages}
          currentUserId={user.id}
          onSendMessage={handleSendMessage}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      </div>
    </div>
  );
};

export default HomePage;