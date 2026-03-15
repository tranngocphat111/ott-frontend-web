import React, { useState, useEffect } from "react";
import SearchBar from "../common/SearchBar";
import ConversationList from "../conversations/ConversationList";
import CategoryFilter from "../conversations/CategoryFilter";
import CategoryManagementModal from "../modal/category/CategoryManagementModal";
import LoadingSkeleton from "../common/LoadingSkeleton";
import ErrorState from "../common/ErrorState";
import CreateGroupModal from "../modal/group/CreateGroupModal";
import { UserService } from "../../services/user.service";
import { ConversationService } from "../../services/conversation.service";
import { CategoryService } from "../../services";
import { useConversations } from "../../contexts/ConversationsContext";
import { useUser } from "../../contexts/UserContext";
import type {
  Conversation,
  ConversationWithParticipant,
  User,
} from "../../types";
import type { SidebarProps } from "../../interfaces";
import { MdOutlineGroupAdd, MdPersonAddAlt } from "react-icons/md";

const Sidebar: React.FC<SidebarProps> = ({
  onConversationSelect,
  selectedConversationId,
}) => {
  const { currentUser } = useUser();
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
    refreshConversations,
  } = useConversations();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<
    ConversationWithParticipant[]
  >([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const loadConversations = async () => {
    if (!currentUser?._id) return;

    try {
      setLoading(true);
      setError(null);

      // Load all users from database
      const users = await UserService.getAllUsers();

      // Filter out current user from available users list
      const otherUsers = users.filter(
        (user) => (user._id || user.user_id) !== currentUser._id,
      );
      setAvailableUsers(otherUsers);

      // Load conversations for current user
      const loadedConversations =
        await ConversationService.getUserConversations(currentUser._id);
      setConversations(loadedConversations);

      // Load categories for current user
      const loadedCategories = await CategoryService.getUserCategories(
        currentUser._id,
      );
      setCategories(loadedCategories);
    } catch (error) {
      console.error("Failed to load data from database:", error);
      setError("Không thể tải dữ liệu từ server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  useEffect(() => {
    let filtered = conversations;

    // Filter by categories (multiple selection)
    if (selectedCategoryIds.length > 0) {
      filtered = filtered.filter(
        (item) =>
          item.participant.settings.category_id &&
          selectedCategoryIds.includes(item.participant.settings.category_id),
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter((item) => {
        const name = getConversationName(item.conversation);
        const latestMessage = item.conversation.last_message?.content || "";

        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          latestMessage.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Sort: Pinned conversations first (by pinned_at desc), then by updated_at
    filtered.sort((a, b) => {
      const isPinnedA = a.participant.settings.is_pinned;
      const isPinnedB = b.participant.settings.is_pinned;

      // If both pinned or both not pinned
      if (isPinnedA === isPinnedB) {
        // Sort by updatedAt (most recent first)
        const timeA = new Date(
          a.conversation.updatedAt || a.conversation.createdAt,
        ).getTime();
        const timeB = new Date(
          b.conversation.updatedAt || b.conversation.createdAt,
        ).getTime();
        return timeB - timeA;
      }
      // Pinned conversations come first
      return isPinnedA ? -1 : 1;
    });

    setFilteredConversations(filtered);
  }, [searchTerm, conversations, selectedCategoryIds]);

  const getConversationName = (conversation: Conversation): string => {
    if (conversation.name) return conversation.name;

    if (
      conversation.type === "private" &&
      conversation.participants &&
      conversation.participants.length > 0
    ) {
      return conversation.participants[0].display_name;
    }

    return "Conversation";
  };

  const handleCreateGroup = async (
    groupName: string,
    selectedUsers: User[],
    avatar?: string,
  ) => {
    if (!currentUser?._id) {
      console.error("Current user not found");
      alert("Vui lòng đăng nhập lại!");
      return;
    }

    try {
      // Extract user IDs from selected users
      const memberIds = selectedUsers
        .map((user) => user._id || user.user_id)
        .filter((id): id is string => !!id);

      // Call API to create group in database with full data
      const newGroup = await ConversationService.createGroup(
        currentUser._id,
        groupName,
        memberIds,
        avatar,
      );

      // Add to conversations state without reloading
      addConversation(newGroup);

      // Refresh to get full participant data
      if (currentUser._id) {
        await refreshConversations(currentUser._id);
      }

      console.log("Group created successfully in database:", newGroup);
    } catch (error) {
      console.error("Failed to create group in database:", error);
      alert("Không thể tạo nhóm. Vui lòng kiểm tra kết nối server!");
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSkeleton count={6} />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={loadConversations} />;
    }

    return (
      <ConversationList
        conversations={filteredConversations}
        onConversationSelect={onConversationSelect}
        selectedConversationId={selectedConversationId}
        currentUserId={currentUser?._id || ""}
      />
    );
  };

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 pb-1">
          {/* Search Bar + Icons */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Tìm kiếm..."
              />
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Nhóm bạn mới"
            >
              <MdPersonAddAlt className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Tạo nhóm mới"
            >
              <MdOutlineGroupAdd className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Filter Row */}
          {!loading && !error && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {filteredConversations.length} cuộc hội thoại
              </span>
              <CategoryFilter
                categories={categories}
                selectedCategoryIds={selectedCategoryIds}
                onSelectCategories={setSelectedCategoryIds}
                onManageCategories={() => setIsCategoryModalOpen(true)}
              />
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        availableUsers={availableUsers}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        userId={currentUser?._id || ""}
      />
    </>
  );
};

export default Sidebar;
