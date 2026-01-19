import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import type { Conversation } from '../types';

const ChatPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="flex h-full w-full">
      {/* Chat Sidebar */}
      <Sidebar 
        onConversationSelect={handleConversationSelect}
        selectedConversationId={selectedConversation?._id}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <ChatArea conversation={selectedConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-primary-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Chào mừng đến với Chat App
              </h2>
              <p className="text-gray-600 mb-6">
                Chọn một cuộc hội thoại để bắt đầu trò chuyện
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sẵn sàng</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
