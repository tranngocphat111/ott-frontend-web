import React, { useState } from 'react';
import { MessageCircle, Users, Clock } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatTimeAgo } from '../../utils/timeUtils';
import type { ConversationItemProps } from '../../interfaces';

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected = false,
  onClick,
  currentUserId
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getConversationName = (): string => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'private' && conversation.participants.length > 0) {
      return conversation.participants[0].display_name;
    }
    
    return 'Conversation';
  };

  const getConversationAvatar = (): string | undefined => {
    if (conversation.avatar_url) return conversation.avatar_url;
    
    if (conversation.type === 'private' && conversation.participants.length > 0) {
      return conversation.participants[0].avatar_url;
    }
    
    return undefined;
  };

  const getLatestMessagePreview = (): string => {
    if (!conversation.latestMessage) return 'Chưa có tin nhắn';
    
    const { content, type, sender } = conversation.latestMessage;
    const senderName = sender._id === currentUserId ? 'Bạn' : sender.display_name;
    
    switch (type) {
      case 'text':
        return `${senderName}: ${content}`;
      case 'image':
        return `${senderName} đã gửi một hình ảnh`;
      case 'file':
        return `${senderName} đã gửi một file`;
      default:
        return `${senderName}: ${content}`;
    }
  };

  const getTimeDisplay = (): string => {
    const time = conversation.latestMessage?.created_at || conversation.created_at;
    return formatTimeAgo(time);
  };

  const hasUnreadMessage = false; // TODO: Implement unread logic

  return (
    <div
      className={`
        relative p-3 rounded-xl cursor-pointer transition-all duration-300
        mx-2
        ${isSelected 
          ? 'bg-[#AE7F53]/10 shadow-md border border-[#AE7F53]/20' 
          : 'hover:bg-gray-50 hover:shadow-sm'
        }
        ${isHovered ? 'shadow-lg' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-[#AE7F53] rounded-r-full" />
      )}

      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="relative">
          <Avatar 
            src={getConversationAvatar()}
            name={getConversationName()}
            size={48}
            className="ring-1 ring-gray-200"
          />
          
          {/* Conversation type indicator */}
          <div className={`
            absolute -bottom-1 -right-1 w-5 h-5 rounded-full 
            flex items-center justify-center bg-white
            ring-2 ring-gray-100 shadow-sm
          `}>
            {conversation.type === 'group' ? (
              <Users className="w-3 h-3 text-[#AE7F53]" />
            ) : (
              <MessageCircle className="w-3 h-3 text-[#AE7F53]" />
            )}
          </div>

          {/* Online status indicator for private chats */}
          {conversation.type === 'private' && conversation.participants[0]?.status === 'online' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white shadow-sm" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`
              font-semibold truncate transition-colors duration-200
              ${isSelected ? 'text-[#AE7F53]' : 'text-gray-900'}
              ${isHovered ? 'text-[#AE7F53]' : ''}
            `}>
              {getConversationName()}
            </h3>
            
            <div className="flex items-center space-x-1 ml-2">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {getTimeDisplay()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className={`
              text-sm truncate transition-colors duration-200
              ${isSelected ? 'text-gray-700' : 'text-gray-600'}
              ${isHovered ? 'text-gray-700' : ''}
            `}>
              {getLatestMessagePreview()}
            </p>

            {/* Unread badge */}
            {hasUnreadMessage && (
              <div className="ml-2 w-2 h-2 bg-[#AE7F53] rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default ConversationItem;