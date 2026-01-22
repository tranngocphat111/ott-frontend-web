import React, { useState } from 'react';
import NavigationSidebar from '../navigation/NavigationSidebar';
import Sidebar from '../sidebar/Sidebar';
import type { ConversationWithParticipant } from '../../types';
import { ChatArea } from '..';

const ChatLayout: React.FC = () => {
  const [selectedConversation, setSelectedConversation] =   useState<ConversationWithParticipant | null>(null);
  const [activeNavItem, setActiveNavItem] = useState('chat');

  const handleConversationSelect = (item: ConversationWithParticipant) => {
    setSelectedConversation(item);
  };

  const handleNavItemClick = (itemId: string) => {
    setActiveNavItem(itemId);
    // Handle navigation logic here
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Navigation Sidebar */}
      <NavigationSidebar 
        activeItem={activeNavItem}
        onItemClick={handleNavItemClick}
      />
      
      {/* Chat Sidebar */}
      <Sidebar 
        onConversationSelect={handleConversationSelect}
        selectedConversationId={selectedConversation?.conversation._id}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatArea conversation={selectedConversation.conversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-chat">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-white/30 rounded-full"></div>
              </div>
              <h2 className="text-2xl font-bold text-primary-500 mb-2">
                Chào mừng đến với Chat App
              </h2>
              <p className="text-primary-400 mb-6">
                Chọn một cuộc hội thoại để bắt đầu trò chuyện
              </p>
              <div className="space-y-2">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary animate-pulse"></div>
                </div>
                <div className="text-sm text-primary-400/70">
                  Đang tải...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;