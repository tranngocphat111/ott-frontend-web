import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Clock } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatTimeAgo } from '../../utils/timeUtils';
import ConversationContextMenu from '../modals/conversation/ConversationContextMenu';
import CategoryManagementModal from '../modals/category/CategoryManagementModal';
import type { ConversationItemProps } from '../../interfaces';

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected = false,
  onClick,
  currentUserId,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (currentUserId) {
      loadCategories();
    }
  }, [currentUserId]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${currentUserId}`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getConversationName = (): string => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'private' && conversation.participants?.length > 0) {
      return conversation.participants[0].display_name;
    }
    
    return 'Conversation';
  };

  const getConversationAvatar = (): string | undefined => {
    // Ưu tiên avatar của conversation (dùng cho group)
    if (conversation.avatar_url) return conversation.avatar_url;
    
    // Với private chat, lấy avatar của người kia
    if (conversation.type === 'private' && conversation.participants?.length > 0) {
      return conversation.participants[0].avatar_url;
    }
    
    return undefined;
  };

  const getLatestMessagePreview = (): string => {
    // Kiểm tra last_message từ backend
    if (conversation.last_message?.content) {
      return conversation.last_message.content;
    }
    
    return 'Chưa có tin nhắn';
  };

  const getTimeDisplay = (): string => {
    // Ưu tiên thời gian từ last_message
    const time = conversation.last_message?.createdAt || 
                 conversation.created_at;
    return formatTimeAgo(time);
  };

  const hasUnreadMessage = false; // TODO: Implement unread logic

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handlePin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/participants/pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation._id,
          userId: currentUserId,
          isPinned: !conversation.is_pinned,
        }),
      });
      
      if (response.ok) {
        console.log('Pin status updated');
        // TODO: Refresh conversation list
      }
    } catch (error) {
      console.error('Error updating pin status:', error);
    }
  };

  const handleSelectCategory = async (categoryId: string | null) => {
    try {
      const response = await fetch('http://localhost:5000/api/participants/category', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation._id,
          userId: currentUserId,
          categoryId,
        }),
      });
      
      if (response.ok) {
        console.log('Category updated');
        // TODO: Refresh conversation list
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleManageCategories = () => {
    console.log('=== handleManageCategories CALLED ===');
    console.log('currentUserId:', currentUserId);
    console.log('hasUserId:', !!currentUserId);
    console.log('Current isCategoryModalOpen:', isCategoryModalOpen);
    
    if (!currentUserId) {
      console.error('Cannot open CategoryManagementModal: currentUserId is missing!');
      alert('Lỗi: Không thể mở quản lý phân loại. Vui lòng thử lại.');
      return;
    }
    
    console.log('Setting isCategoryModalOpen to TRUE');
    setIsCategoryModalOpen(true);
    
    // Debug after state update
    setTimeout(() => {
      console.log('After setState - isCategoryModalOpen should be true now');
    }, 100);
  };

  const handleMute = async (duration: string) => {
    let muteUntil = null;
    let status = 'mute';

    if (duration === '1h') {
      muteUntil = new Date(Date.now() + 60 * 60 * 1000);
    } else if (duration === '4h') {
      muteUntil = new Date(Date.now() + 4 * 60 * 60 * 1000);
    } else if (duration === '8am') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      muteUntil = tomorrow;
    }

    try {
      const response = await fetch('http://localhost:5000/api/participants/notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation._id,
          userId: currentUserId,
          status,
          muteUntil,
        }),
      });
      
      if (response.ok) {
        console.log('Notification status updated');
        // TODO: Refresh conversation list
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc hội thoại này?')) {
      console.log('Delete conversation:', conversation._id);
      // TODO: Implement delete logic
    }
  };

  return (
    <>
      <div
        className={`
          relative p-3 rounded-xl cursor-pointer transition-all duration-300
          mx-2
          ${isSelected 
            ? 'bg-primary-500/10 shadow-md ' 
            : 'hover:bg-gray-50 hover:shadow-sm'
          }
          ${isHovered ? 'shadow-lg' : ''}
        `}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
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
              <Users className="w-3 h-3 text-primary-500" />
            ) : (
              <MessageCircle className="w-3 h-3 text-primary-500" />
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
              ${isSelected ? 'text-primary-500' : 'text-gray-900'}
              ${isHovered ? 'text-primary-500' : ''}
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
              <div className="ml-2 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Context Menu */}
    <ConversationContextMenu
      isOpen={contextMenu !== null}
      position={contextMenu || { x: 0, y: 0 }}
      onClose={() => setContextMenu(null)}
      onPin={handlePin}
      onSelectCategory={handleSelectCategory}
      onManageCategories={handleManageCategories}
      onMute={handleMute}
      onDelete={handleDelete}
      isPinned={conversation.is_pinned}
      isMuted={conversation.is_muted}
      categories={categories}
      currentCategoryId={conversation.category_id}
    />

    {/* Category Management Modal */}
    {console.log('Rendering CategoryManagementModal:', { isCategoryModalOpen, currentUserId })}
    <CategoryManagementModal
      isOpen={isCategoryModalOpen}
      onClose={() => {
        console.log('CategoryManagementModal onClose called');
        setIsCategoryModalOpen(false);
      }}
      userId={currentUserId || ''}
    />
  </>
);
};

export default ConversationItem;