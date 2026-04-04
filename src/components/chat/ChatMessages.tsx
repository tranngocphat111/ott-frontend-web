/**
 * Chat Messages Component
 * Display messages with infinite scroll (load older when scrolling up)
 *
 * Features:
 * - Auto-load last 20 messages from Redis
 * - Infinite scroll to load older messages from MongoDB
 * - Real-time updates
 * - Show message status (loading, etc)
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './ChatMessages.css';

interface ChatMessagesProps {
  conversationId: string;
  currentUserId: string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  conversationId,
  currentUserId,
}) => {
  const { messages, loading, hasMore, loadMessages, loadOlderMessages } =
    useChat();

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isLoadingMoreRef = useRef<boolean>(false);
  const conversationMessages = messages[conversationId] || [];

  // Load messages when conversation changes
  useEffect(() => {
    loadMessages(conversationId);
  }, [conversationId, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current && conversationMessages.length > 0) {
      // Only auto-scroll if user is near the bottom
      const container = messagesContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;

      if (isNearBottom) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 0);
      }
    }
  }, [conversationMessages]);

  /**
   * Handle scroll event
   * Load older messages when user scrolls to top
   */
  const handleScroll = useCallback(async () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    // Check if user scrolled to top
    if (container.scrollTop < 100 && hasMore[conversationId] && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      console.log('📥 User scrolled to top - loading older messages');

      await loadOlderMessages(conversationId);

      isLoadingMoreRef.current = false;
    }
  }, [conversationId, hasMore, loadOlderMessages]);

  /**
   * Save scroll position before loading older messages
   */
  const saveScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      scrollPositionRef.current = container.scrollHeight;
    }
  }, []);

  /**
   * Restore scroll position after loading older messages
   */
  const restoreScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      // Calculate how many pixels to scroll
      const newScrollHeight = container.scrollHeight;
      const scrollDifference = newScrollHeight - scrollPositionRef.current;
      container.scrollTop = scrollDifference;
    }
  }, []);

  // Save position before loading
  useEffect(() => {
    saveScrollPosition();
  }, [conversationMessages, saveScrollPosition]);

  if (loading && conversationMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-white p-4 space-y-3"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Loading indicator for older messages */}
      {isLoadingMoreRef.current && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-gray-500">Đang tải tin nhắn cũ...</div>
        </div>
      )}

      {/* No more messages indicator */}
      {!hasMore[conversationId] && conversationMessages.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-gray-400">
            Đây là tin nhắn đầu tiên của cuộc trò chuyện này
          </div>
        </div>
      )}

      {/* Messages list */}
      {conversationMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p>Chưa có tin nhắn</p>
            <p className="text-sm">Bắt đầu cuộc trò chuyện đi!</p>
          </div>
        </div>
      ) : (
        conversationMessages.map((message, index) => {
          const isOwnMessage = message.userId === currentUserId;
          const showAvatar =
            index === 0 ||
            conversationMessages[index - 1]?.userId !== message.userId;

          return (
            <div
              key={message._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {/* Avatar (show only first message from user or after different user) */}
              <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-300">
                {showAvatar && (
                  <img
                    src={`https://ui-avatars.com/api/?name=${message.userId}`}
                    alt={message.userId}
                    className="w-full h-full rounded-full"
                  />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-xs rounded-lg px-4 py-2 ${
                  isOwnMessage
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                {/* Message text */}
                <p className="text-sm">{message.text}</p>

                {/* Edit indicator */}
                {message.isEdited && (
                  <p className="text-xs opacity-70 mt-1">
                    (chỉnh sửa {new Date(message.editedAt).toLocaleTimeString()})
                  </p>
                )}

                {/* Timestamp */}
                <p
                  className={`text-xs mt-1 ${
                    isOwnMessage ? 'opacity-70' : 'opacity-60'
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Reactions */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(message.reactions).map(([emoji, reactors]) => (
                    <span
                      key={emoji}
                      className="text-xs bg-gray-100 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition"
                      title={reactors.join(', ')}
                    >
                      {emoji} {reactors.length > 1 ? reactors.length : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatMessages;
