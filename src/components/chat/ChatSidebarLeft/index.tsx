import React, { useCallback, useEffect, useState } from "react";
import ConversationList from "../../conversations/ConversationList";
import CategoryManagementModal from "../../modal/category/CategoryManagementModal";
import LoadingSkeleton from "../../common/LoadingSkeleton";
import CreateGroupModal from "../../modal/group/CreateGroupModal";
import AddFriendModal from "../../modal/friend/AddFriendModal";
import { ConversationService } from "../../../services/conversation.service";
import { CategoryService, socketService, fetchFriends, MessageService } from "../../../services";
import { useConversations } from "../../../contexts/ConversationsContext";
import { useAuth } from "../../../contexts/AuthContext";
import type {
  ConversationWithParticipant,
  FilterMode,
  User,
} from "../../../types";
import type { SidebarProps } from "../../../interfaces";
import { SearchResultsPanel, SidebarHeader } from "./components";
import useChatSearch from "../../../hooks/useChatSearch";

const ChatSidebarLeft: React.FC<SidebarProps> = ({
  onConversationSelect,
  selectedConversationId,
  className = "",
}) => {
  const { user: currentUser } = useAuth();
  const rawUser = currentUser as { id?: string; user_id?: string; _id?: string } | null;
  const normalizedUserId = rawUser?.id || rawUser?.user_id || rawUser?._id;
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

  const [filteredConversations, setFilteredConversations] = useState<
    ConversationWithParticipant[]
  >([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const {
    searchTerm,
    setSearchTerm,
    keyword,
    isSearchPanelOpen,
    setIsSearchFocused,
    searchResults,
    setSearchResults,
    isSearching,
    searchTab,
    setSearchTab,
    setMessageSenderFilter,
    isSenderDropdownOpen,
    setIsSenderDropdownOpen,
    senderSearchText,
    setSenderSearchText,
    senderDropdownRef,
    openConversationTarget,
    conversationMetaMap,
    highlightKeyword,
    historyConversations,
    handleRemoveHistoryItem,
    handleClearAllHistory,
    filteredSearchMessages,
    conversationResultsByName,
    senderOptions,
    filteredSenderOptions,
    selectedSenderName,
  } = useChatSearch({
    conversations,
    normalizedUserId,
    onConversationSelect,
  });

  useEffect(() => {
    if (!normalizedUserId) return;
    socketService.joinUserRoom(normalizedUserId);
  }, [normalizedUserId]);

  // Redundant socket listener removed - now handled in ConversationsContext

  // Load users for creation but NOT conversations (handled by context)
  useEffect(() => {
    if (!normalizedUserId) return;
    const loadUsers = async () => {
      try {
        const friends = await fetchFriends(normalizedUserId);
        // Map FriendOption to User shape if needed, but here we just need name/id/avatar
        const mappedUsers: User[] = friends.map(f => ({
          user_id: f.id,
          _id: f.id,
          name: f.name,
          display_name: f.name, // Ensure display_name is set
          avatar: f.avatarUrl || ""
        } as any));
        console.log("ChatSidebarLeft: Loaded friends for group creation:", mappedUsers);
        setAvailableUsers(mappedUsers);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };
    loadUsers();
  }, [normalizedUserId]);

  useEffect(() => {
    console.log('🔍 ChatSidebarLeft: Filtering conversations. Raw count:', conversations.length);
    let filtered = conversations;

    const hasUnreadConversation = (item: ConversationWithParticipant) => {
      return Number(item.participant.unread_count || 0) > 0;
    };

    filtered = filtered.filter((item) => {
      const lastMsgId = item.conversation.last_message?.msg_id;
      const deletedMsgId = item.participant.deleted_msg_id || "0";
      if (deletedMsgId === "0") return true;
      if (lastMsgId) return BigInt(lastMsgId) > BigInt(deletedMsgId);
      return false;
    });

    if (filterMode === "unread") {
      filtered = filtered.filter(hasUnreadConversation);
    }

    if (filterMode === "category" && selectedCategoryIds.length > 0) {
      filtered = filtered.filter(
        (item) =>
          item.participant.settings.category_id &&
          selectedCategoryIds.includes(item.participant.settings.category_id),
      );
    }

    filtered.sort((a, b) => {
      const isPinnedA = a.participant.settings.is_pinned;
      const isPinnedB = b.participant.settings.is_pinned;

      if (isPinnedA === isPinnedB) {
        const timeA = new Date(
          a.conversation.updatedAt || a.conversation.createdAt,
        ).getTime();
        const timeB = new Date(
          b.conversation.updatedAt || b.conversation.createdAt,
        ).getTime();
        return timeB - timeA;
      }
      return isPinnedA ? -1 : 1;
    });

    console.log('🔍 ChatSidebarLeft: Filtered count:', filtered.length);
    setFilteredConversations(filtered);
  }, [conversations, selectedCategoryIds, filterMode]);

  const handleCreateGroup = async (
    groupName: string,
    selectedUsers: User[],
    avatar?: string,
    memberNames?: string[],
  ) => {
    if (!normalizedUserId) {
      alert("Vui lòng đăng nhập lại!");
      return;
    }

    try {
      const friendIds = selectedUsers
        .filter(u => availableUsers.some(f => (f.user_id || f._id) === (u.user_id || u._id)))
        .map(u => u.user_id || u._id)
        .filter((id): id is string => !!id);

      const strangers = selectedUsers.filter(u => !availableUsers.some(f => (f.user_id || f._id) === (u.user_id || u._id)));
      const strangerIds = strangers.map(u => u.user_id || u._id).filter((id): id is string => !!id);

      // Create group with creator + friends only
      const result = await ConversationService.createGroup(
        normalizedUserId,
        groupName,
        friendIds,
        avatar,
        memberNames?.filter((_, idx) => availableUsers.some(f => (f.user_id || f._id) === (selectedUsers[idx].user_id || selectedUsers[idx]._id))),
      );

      if (result && result._id) {
        // Handle strangers: send invite link
        if (strangerIds.length > 0) {
          try {
            const link = await ConversationService.getInviteLink(result._id, normalizedUserId);
            for (const sId of strangerIds) {
              const existingConv = conversations.find(c => 
                c.conversation.type === "private" && 
                c.conversation.participants?.some(p => String(p.user_id || (p as any)._id) === String(sId))
              );

              let targetConvId: string;
              if (existingConv) {
                targetConvId = existingConv.conversation._id;
              } else {
                const directConv = await ConversationService.getOrCreatePrivateConversation(normalizedUserId, sId);
                targetConvId = (directConv as any).conversation?._id || (directConv as any)._id;
              }
              await MessageService.sendMessage(targetConvId, normalizedUserId, link, "link");
            }
          } catch (linkErr) {
            console.error("Failed to send invite links to strangers:", linkErr);
          }
        }

        // Dispatch event to open the new conversation
        window.dispatchEvent(new CustomEvent("chat:open-conversation", {
          detail: {
            conversationId: result._id,
            conversation: result
          }
        }));

        // Also trigger a refresh to be sure it shows up in the sidebar
        refreshConversations(normalizedUserId);
      }
    } catch (createError) {
      console.error("Failed to create group in database:", createError);
      alert("Không thể tạo nhóm. Vui lòng kiểm tra kết nối server!");
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSkeleton count={6} />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <button
            onClick={() => refreshConversations(normalizedUserId || "")}
            className="text-xs text-primary-600 font-semibold hover:underline"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return (
      <ConversationList
        conversations={filteredConversations}
        onConversationSelect={onConversationSelect}
        selectedConversationId={selectedConversationId}
        currentUserId={normalizedUserId || ""}
      />
    );
  };

  return (
    <>
      <div
        className={`flex h-full min-h-0 flex-col border-r border-gray-200 bg-white ${
          className || "w-80"
        }`}
      >
        <SidebarHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchFocus={() => setIsSearchFocused(true)}
          isSearchPanelOpen={isSearchPanelOpen}
          onCloseSearchPanel={() => {
            setSearchTerm("");
            setSearchResults(null);
            setIsSearchFocused(false);
            setSearchTab("all");
            setMessageSenderFilter("");
          }}
          onOpenCreateGroup={() => setIsCreateGroupModalOpen(true)}
          loading={loading}
          error={error}
          filteredConversationCount={filteredConversations.length}
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          onSelectCategories={setSelectedCategoryIds}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          onManageCategories={() => setIsCategoryModalOpen(true)}
          onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          {isSearchPanelOpen ? (
            <SearchResultsPanel
              isSearchPanelOpen={isSearchPanelOpen}
              keyword={keyword}
              isSearching={isSearching}
              searchResults={searchResults}
              searchTab={searchTab}
              setSearchTab={setSearchTab}
              senderOptions={senderOptions}
              isSenderDropdownOpen={isSenderDropdownOpen}
              senderDropdownRef={senderDropdownRef}
              selectedSenderName={selectedSenderName}
              senderSearchText={senderSearchText}
              filteredSenderOptions={filteredSenderOptions}
              onToggleSenderDropdown={() =>
                setIsSenderDropdownOpen((prev) => !prev)
              }
              onSenderSearchTextChange={setSenderSearchText}
              onSelectAllSender={() => {
                setMessageSenderFilter("");
                setIsSenderDropdownOpen(false);
              }}
              onSelectSender={(senderId) => {
                setMessageSenderFilter(senderId);
                setIsSenderDropdownOpen(false);
              }}
              filteredSearchMessages={filteredSearchMessages}
              conversationResultsByName={conversationResultsByName}
              conversationMetaMap={conversationMetaMap}
              highlightKeyword={highlightKeyword}
              onOpenConversation={openConversationTarget}
              historyConversations={historyConversations}
              normalizedUserId={normalizedUserId}
              onRemoveHistoryItem={handleRemoveHistoryItem}
              onClearAllHistory={handleClearAllHistory}
            />
          ) : (
            renderContent()
          )}
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        availableUsers={availableUsers}
        categories={categories}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        userId={currentUser?.id || ""}
      />
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />
    </>
  );
};

export default ChatSidebarLeft;
