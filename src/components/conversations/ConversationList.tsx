import React from 'react';
import ConversationItem from './ConversationItem';
import type { ConversationListProps } from '../../interfaces';

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onConversationSelect,
  selectedConversationId,
  currentUserId,
}) => {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 mb-2">Chưa có cuộc hội thoại nào</div>
        <div className="text-gray-400 text-sm">Bắt đầu trò chuyện mới ngay!</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="p-2 space-y-1">
        {conversations.map((item) => (
          <ConversationItem
            key={item.conversation._id}
            item={item}
            isSelected={selectedConversationId === item.conversation._id}
            onClick={() => onConversationSelect?.(item)}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
};

export default ConversationList;