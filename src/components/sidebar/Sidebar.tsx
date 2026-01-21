import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import ConversationList from '../conversations/ConversationList';
import CategoryFilter from '../conversations/CategoryFilter';
import LoadingSkeleton from '../common/LoadingSkeleton';
import ErrorState from '../common/ErrorState';
import CreateGroupModal from '../modals/group/CreateGroupModal';
import { UserService } from '../../services/user.service';
import { ConversationService } from '../../services/conversation.service';
import { CategoryService } from '../../services';
import { useConversations } from '../../contexts/ConversationsContext';
import type { Conversation, User } from '../../types';
import type { SidebarProps } from '../../interfaces';

const Sidebar: React.FC<SidebarProps> = ({ 
  onConversationSelect, 
  selectedConversationId 
}) => {
  const {
    conversations,
    categories,
    loading,
    error,
    setConversations,
    setCategories,
    setLoading,
    setError,
    addConversation,
  } = useConversations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all users from database
      const users = await UserService.getAllUsers();
      
      // Set first user from database as current user
      if (users.length > 0) {
        const firstUser = users[0];
        setCurrentUserId(firstUser._id);
        
        // Filter out current user from available users list
        const otherUsers = users.filter(user => user._id !== firstUser._id);
        setAvailableUsers(otherUsers);
        
        // Load conversations for first user
        const loadedConversations = await ConversationService.getUserConversations(firstUser._id);
        setConversations(loadedConversations);
        
        // Load categories for first user
        const loadedCategories = await CategoryService.getUserCategories(firstUser._id);
        setCategories(loadedCategories);
      }
    } catch (error) {
      console.error('Failed to load data from database:', error);
      setError('Không thể tải dữ liệu từ server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    let filtered = conversations;

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(conv => conv.category_id === selectedCategoryId);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(conversation => {
        const name = getConversationName(conversation);
        const latestMessage = conversation.last_message?.content || '';
        
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               latestMessage.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    setFilteredConversations(filtered);
  }, [searchTerm, conversations, selectedCategoryId]);

  const getConversationName = (conversation: Conversation): string => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'private' && conversation.participants?.length > 0) {
      return conversation.participants[0].display_name;
    }
    
    return 'Conversation';
  };

  const handleCreateGroup = async (groupName: string, selectedUsers: User[], avatar?: string) => {
    try {
      // Extract user IDs from selected users
      const memberIds = selectedUsers.map(user => user._id);
      
      // Call API to create group in database with full data
      const newGroup = await ConversationService.createGroup(
        currentUserId,
        groupName,
        memberIds,
        avatar
      );

      // Add to conversations state without reloading
      addConversation(newGroup);

      // Select the new conversation
      onConversationSelect?.(newGroup);
      
      console.log('Group created successfully in database:', newGroup);
    } catch (error) {
      console.error('Failed to create group in database:', error);
      alert('Không thể tạo nhóm. Vui lòng kiểm tra kết nối server!');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSkeleton count={6} />;
    }

    if (error) {
      return (
        <ErrorState 
          message={error}
          onRetry={loadConversations}
        />
      );
    }

    return (
      <ConversationList
        conversations={filteredConversations}
        onConversationSelect={onConversationSelect}
        selectedConversationId={selectedConversationId}
        currentUserId={currentUserId}
      />
    );
  };

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Trò chuyện</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
                title="Tạo nhóm mới"
              >
                <Plus className="w-5 h-5 text-gray-600 group-hover:text-primary-500 group-hover:scale-110 transition-all" />
              </button>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
                title="Tùy chọn"
              >
                <MoreVertical className="w-5 h-5 text-gray-600 group-hover:text-primary-500 group-hover:scale-110 transition-all" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Tìm kiếm cuộc hội thoại..."
          />
        </div>

        {/* Category Filter */}
        {!loading && !error && categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            {!loading && !error && (
              <>
                {filteredConversations.length} 
                {searchTerm ? ' kết quả' : ' cuộc hội thoại'}
              </>
            )}
            {loading && 'Đang tải...'}
            {error && 'Lỗi kết nối'}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        availableUsers={availableUsers}
      />
    </>
  );
};

export default Sidebar;