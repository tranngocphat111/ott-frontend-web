import React, { useCallback, useEffect, useState } from "react";
import ConversationList from "../../conversations/ConversationList";
import CategoryManagementModal from "../../modal/category/CategoryManagementModal";
import LoadingSkeleton from "../../common/LoadingSkeleton";
import ErrorState from "../../common/ErrorState";
import CreateGroupModal from "../../modal/group/CreateGroupModal";
import { UserService } from "../../../services/user.service";
import { ConversationService } from "../../../services/conversation.service";
import { CategoryService, socketService } from "../../../services";
import { useConversations } from "../../../contexts/ConversationsContext";
import { useUser } from "../../../contexts/UserContext";
import type { ConversationWithParticipant, FilterMode, User } from "../../../types";
import type { SidebarProps } from "../../../interfaces";
import { SearchResultsPanel, SidebarHeader } from "./components";
import useChatSearch from "../../../hooks/useChatSearch";

const ChatSidebarLeft: React.FC<SidebarProps> = ({
  onConversationSelect,
  selectedConversationId,
}) => {
  const { currentUser } = useUser();
  const normalizedUserId = currentUser?.user_id || currentUser?._id;
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

  const handleNewConversation = useCallback(
    (newConv: any) => {
      const convId = newConv._id?.toString();
      if (!convId || !normalizedUserId) return;
      const exists = conversations.some(
        (item) => item.conversation._id === convId,
      );
      if (!exists) {
        refreshConversations(normalizedUserId);
      }
    },
    [conversations, normalizedUserId, refreshConversations],
  );

  useEffect(() => {
    socketService.onNewConversation(handleNewConversation);
    return () => socketService.offNewConversation(handleNewConversation);
  }, [handleNewConversation]);

  const loadConversations = useCallback(async () => {
    if (!normalizedUserId) return;

    try {
      setLoading(true);
      setError(null);

      const users = await UserService.getAllUsers();
      const otherUsers = users.filter(
        (user) => (user._id || user.user_id) !== currentUser._id,
      );
      setAvailableUsers(otherUsers);

      const loadedConversations =
        await ConversationService.getUserConversations(normalizedUserId);

      const userId = normalizedUserId;
      const reconciledConversations = loadedConversations.map((newItem) => {
        const convId = newItem.conversation._id;
        const dbId = newItem.participant.last_read_message_id || "0";
        const lsId = localStorage.getItem(`read_${convId}_${userId}`) || "0";
        if (lsId !== "0" && BigInt(lsId) > BigInt(dbId)) {
          return {
            ...newItem,
            participant: { ...newItem.participant, last_read_message_id: lsId },
          };
        }
        return newItem;
      });
      setConversations(reconciledConversations);

      const loadedCategories =
        await CategoryService.getUserCategories(normalizedUserId);
      setCategories(loadedCategories);
    } catch (loadError) {
      console.error("Failed to load data from database:", loadError);
      setError("Không thể tải dữ liệu từ server");
    } finally {
      setLoading(false);
    }
  }, [
    normalizedUserId,
    setLoading,
    setError,
    currentUser?._id,
    setConversations,
    setCategories,
  ]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
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

    setFilteredConversations(filtered);
  }, [conversations, selectedCategoryIds, filterMode]);

  const handleCreateGroup = async (
    groupName: string,
    selectedUsers: User[],
    avatar?: string,
  ) => {
    if (!normalizedUserId) {
      alert("Vui lòng đăng nhập lại!");
      return;
    }

    try {
      const memberIds = selectedUsers
        .map((user) => user._id || user.user_id)
        .filter((id): id is string => !!id);

      const newGroup = await ConversationService.createGroup(
        normalizedUserId,
        groupName,
        memberIds,
        avatar,
      );

      addConversation(newGroup);

      if (normalizedUserId) {
        await refreshConversations(normalizedUserId);
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
      return <ErrorState message={error} onRetry={loadConversations} />;
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
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
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
        />

        <div className="flex-1 overflow-hidden">
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
              onToggleSenderDropdown={() => setIsSenderDropdownOpen((prev) => !prev)}
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
        userId={currentUser?._id || ""}
      />
    </>
  );
};

export default ChatSidebarLeft;
