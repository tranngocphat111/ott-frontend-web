import React, { useEffect, useState, useCallback } from "react";
import { X, Users, Pin, Image, FileText, Link as LinkIcon, UserRoundPen } from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { useConversations } from "../../contexts/ConversationsContext";
import {
  MessageService,
  ParticipantService,
  UserService,
  ConversationService,
} from "../../services";
import type { Message } from "../../types";
import type {
  ConversationMember,
  LinkData,
  ViewMode,
  StorageTab,
  ChatSidebarRightProps,
} from "../../interfaces";

// Import components
import CollapsibleSection from "./ChatSidebarRight/components/CollapsibleSection";
import GroupInfoHeader from "./ChatSidebarRight/components/GroupInfoHeader";
import GroupActionButtons from "./ChatSidebarRight/components/GroupActionButtons";
import PinnedMessages from "./ChatSidebarRight/components/PinnedMessages";
import MediaGallery from "./ChatSidebarRight/components/MediaGallery";
import FilesList from "./ChatSidebarRight/components/FilesList";
import LinksList from "./ChatSidebarRight/components/LinksList";
import GroupActions from "./ChatSidebarRight/components/GroupActions";
import AddMemberModal from "./ChatSidebarRight/modals/AddMemberModal";
import NicknameManagementModal from "./ChatSidebarRight/modals/NicknameManagementModal";
import CreateGroupModal from "../modal/group/CreateGroupModal";
import { MediaViewer } from "./ChatMessage/MediaViewer";

// Import views
import MembersFullView from "./ChatSidebarRight/MembersFullView";
import StorageView from "./ChatSidebarRight/StorageView.tsx";

const ChatSidebarRight: React.FC<ChatSidebarRightProps> = ({
  conversation,
  isOpen,
  onClose,
}) => {
  const { currentUser } = useUser();
  const {
    conversations,
    categories,
    updateConversation,
    updateParticipant,
    refreshConversations,
  } = useConversations();

  // State
  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [mediaMessagesPreview, setMediaMessagesPreview] = useState<Message[]>(
    [],
  );
  const [fileMessagesPreview, setFileMessagesPreview] = useState<Message[]>([]);
  const [linkMessagesPreview, setLinkMessagesPreview] = useState<LinkData[]>([]);
  const [allMediaMessages, setAllMediaMessages] = useState<Message[]>([]);
  const [allFileMessages, setAllFileMessages] = useState<Message[]>([]);
  const [allLinkMessages, setAllLinkMessages] = useState<LinkData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [storageTab, setStorageTab] = useState<StorageTab>("media");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Modals
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerMessageId, setViewerMessageId] = useState<string | null>(null);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);

  // Helper to safely filter valid messages
  const filterValidMessages = (messages: any[]): Message[] => {
    if (!Array.isArray(messages)) return [];

    const filtered = messages.filter((msg) => {
      const isValid = msg && typeof msg === "object" && msg._id;

      return isValid;
    });

    return filtered;
  };

  // Helper to safely filter valid members
  const filterValidMembers = (members: any[]): ConversationMember[] => {
    if (!Array.isArray(members)) return [];

    return members
      .filter(
        (member) => member && typeof member === "object" && member.user_id,
      )
      .map((member) => ({
        _id: member._id,
        user_id: member.user_id,
        role: (member.roles || "user") as "admin" | "user",
        name: member.user?.name || `User ${String(member.user_id).slice(-4)}`,
        avatar: member.user?.avatar || "",
        joined_at: member.joined_at || "",
        added_by: member.added_by,
        nickname: member.nickname,
      }));
  };

  const filterValidLinkData = (items: any[]): LinkData[] => {
    if (!Array.isArray(items)) return [];

    return items.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item._id &&
        Array.isArray(item.links),
    );
  };

  const loadSidebarData = useCallback(async () => {
    if (!conversation?._id) return;

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        ParticipantService.getMembers(conversation._id),
        MessageService.getPinnedMessages(conversation._id),
        MessageService.getMediaMessages(conversation._id),
        MessageService.getFileMessages(conversation._id),
        MessageService.getLinkMessages(conversation._id),
      ]);

      const [
        membersResult,
        pinnedResult,
        mediaResult,
        filesResult,
        linksResult,
      ] = results;

      const membersData =
        membersResult.status === "fulfilled" ? membersResult.value : [];
      const pinnedData =
        pinnedResult.status === "fulfilled" ? pinnedResult.value : [];
      const mediaData =
        mediaResult.status === "fulfilled" ? mediaResult.value : [];
      const filesData =
        filesResult.status === "fulfilled" ? filesResult.value : [];
      const linksData =
        linksResult.status === "fulfilled" ? linksResult.value : [];

      const mappedMembers = filterValidMembers(membersData);
      setMembers(mappedMembers);
      setPinnedMessages(filterValidMessages(pinnedData));
      const validMedia = filterValidMessages(mediaData);
      const validFiles = filterValidMessages(filesData);
      const validLinks = filterValidLinkData(linksData);
      setAllMediaMessages(validMedia);
      setAllFileMessages(validFiles);
      setAllLinkMessages(validLinks);
      setMediaMessagesPreview(validMedia.slice(0, 8));
      setFileMessagesPreview(validFiles.slice(0, 5));
      setLinkMessagesPreview(validLinks.slice(0, 5));
    } catch (error) {
      console.error("Error loading sidebar data:", error);
      setError("Không thể tải thông tin sidebar");

      // Set empty arrays as fallback
      setMembers([]);
      setPinnedMessages([]);
      setMediaMessagesPreview([]);
      setFileMessagesPreview([]);
      setLinkMessagesPreview([]);
      setAllMediaMessages([]);
      setAllFileMessages([]);
      setAllLinkMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversation?._id]);

  // Load data
  useEffect(() => {
    if (isOpen && conversation?._id) {
      loadSidebarData();
    }
  }, [isOpen, conversation?._id, loadSidebarData]);

  // Load available users for create group modal
  useEffect(() => {
    if (showCreateGroupModal) {
      const loadUsers = async () => {
        try {
          const users = await UserService.getAllUsers();
          // Filter out current user
          const filtered = (users || []).filter(
            (u) => u._id !== currentUser?._id && u.user_id !== currentUser?._id,
          );
          setAvailableUsers(filtered);
        } catch (error) {
          console.error("Error loading users:", error);
        }
      };
      loadUsers();
    }
  }, [showCreateGroupModal, currentUser]);

  // Event handlers
  const handleUnpinMessage = async (messageId: string) => {
    try {
      if (!currentUser?._id || !conversation?._id) {
        console.error("User not logged in or conversation not found");
        return;
      }

      await MessageService.pinMessage(
        conversation._id,
        messageId,
        currentUser._id,
        false,
      );
      setPinnedMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error("Error unpinning message:", error);
      setError("Không thể bỏ ghim tin nhắn");
    }
  };

  const handleMembersAdded = (_newMembers: ConversationMember[]) => {
    loadSidebarData();
  };

  const handleMemberRemoved = async (userId: string) => {
    if (!userId) return;

    if (!currentUser?._id || !conversation?._id) return;
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm?"))
      return;

    try {
      await ParticipantService.removeMember(
        conversation._id,
        userId,
        currentUser._id,
      );
      await loadSidebarData();
    } catch (error) {
      console.error("Error removing member:", error);
      setError(
        error instanceof Error ? error.message : "Không thể xóa thành viên",
      );
    }
  };

  const handleRoleUpdated = async (userId: string, role: string) => {
    if (!userId || !role) return;

    if (!currentUser?._id || !conversation?._id) return;

    try {
      await ParticipantService.updateMemberRole(
        conversation._id,
        userId,
        role as "admin" | "user",
        currentUser._id,
      );
      await loadSidebarData();
    } catch (error) {
      console.error("Error updating member role:", error);
      setError(
        error instanceof Error ? error.message : "Không thể cập nhật vai trò",
      );
    }
  };

  const handleMemberNicknameUpdated = async (
    userId: string,
    nickname: string,
  ) => {
    const normalizedUserId = currentUser?._id || currentUser?.user_id;
    if (!userId || !normalizedUserId || !conversation?._id) return;

    try {
      await ParticipantService.updateMemberNickname(
        conversation._id,
        userId,
        normalizedUserId,
        nickname,
      );

      // Reload both sidebar data and global conversations so nickname appears immediately everywhere.
      await Promise.all([
        loadSidebarData(),
        refreshConversations(normalizedUserId),
      ]);
    } catch (error) {
      console.error("Error updating member nickname:", error);
      throw error instanceof Error
        ? error
        : new Error("Không thể cập nhật biệt danh");
    }
  };

  const getOtherParticipants = (): string[] => {
    if (conversation.type !== "private") return [];
    return members
      .filter(
        (member) =>
          member.user_id !== currentUser?._id &&
          member.user_id !== currentUser?.user_id,
      )
      .map((member) => member.user_id);
  };

  const handleMediaClick = useCallback(
    (messageId: string, imageIndex: number = 0) => {
      setViewerMessageId(messageId);
      setViewerImageIndex(imageIndex);
      setViewerOpen(true);
    },
    [],
  );

  const handleViewAllMedia = useCallback(() => {
    setStorageTab("media");
    setViewMode("storage");
  }, []);

  const handleViewAllFiles = useCallback(() => {
    setStorageTab("files");
    setViewMode("storage");
  }, []);

  const handleViewAllLinks = useCallback(() => {
    setStorageTab("links");
    setViewMode("storage");
  }, []);

  const handleViewMembers = useCallback(() => {
    setViewMode("members");
  }, []);

  const handleBackToMain = useCallback(() => {
    setViewMode("main");
  }, []);

  const handleCreateGroupFromPrivate = async (
    groupName: string,
    selectedUsers: any[],
    groupAvatar?: string,
  ) => {
    try {
      if (!currentUser?._id || !conversation?._id) return;

      // Create group with selected users (including current user)
      const userIds = selectedUsers.map((u) => u._id || u.user_id);
      const newGroup = await ConversationService.createGroup(
        currentUser._id,
        groupName,
        userIds,
        groupAvatar,
      );

      if (newGroup) {
        setShowCreateGroupModal(false);
        // Here you can navigate to the newly created group if needed
        // For now, just close the modal
      }
    } catch (error) {
      console.error("Error creating group:", error);
      setError(error instanceof Error ? error.message : "Không thể tạo nhóm");
    }
  };

  const isGroupChat = conversation?.type === "group";
  const isOwner = currentUser?._id === conversation?.created_by;
  const currentParticipant = conversations.find(
    (item) => item.conversation._id === conversation._id,
  )?.participant;

  // Safety checks
  if (!isOpen || !conversation) return null;

  // Debug logging
  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold cursor-pointer">
            ×
          </button>
        </div>
      )}
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 overflow-y-auto">
        {/* MAIN VIEW */}
        {viewMode === "main" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                Thông tin {isGroupChat ? "nhóm" : "đoạn chat"}
              </h2>
              <button
                onClick={onClose}
                className="cursor-pointer p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Group Info Header */}
            {conversation._id && (
              <GroupInfoHeader
                conversation={conversation}
                memberCount={members.length}
                onUpdate={(updates) =>
                  updateConversation?.(conversation._id, updates)
                }
                isAdmin={isOwner}
                currentUserId={currentUser?._id || currentUser?.user_id}
              />
            )}

            {/* Action Buttons */}
            {conversation._id && (
              <GroupActionButtons
                conversation={conversation}
                participant={currentParticipant}
                currentUserId={currentUser?._id || ""}
                onAddMember={() => setShowAddMemberModal(true)}
                onCreateGroup={() => setShowCreateGroupModal(true)}
                onParticipantUpdated={(updates) => {
                  updateParticipant(conversation._id, updates);
                }}
              />
            )}

            {/* Group-only sections */}
            {conversation.type === "group" && (
              <>
                <CollapsibleSection
                  title="Thành viên nhóm"
                  icon={<Users size={20} />}
                  badge={members.length}
                  onClick={handleViewMembers}
                  showIndicator={false}
                />
              </>
            )}

            {/* Nickname section for both group and private */}
            {(conversation.type === "group" ||
              conversation.type === "private") && (
              <CollapsibleSection
                title="Biệt danh"
                icon={<UserRoundPen size={20} />}
                onClick={() => setShowNicknameModal(true)}
                showIndicator={false}
              />
            )}

            <CollapsibleSection
              title="Bảng tin nhóm"
              icon={<Pin size={20} />}
              badge={pinnedMessages.length}
              defaultOpen={true}
            >
              <PinnedMessages
                messages={pinnedMessages}
                conversationId={conversation._id}
                currentUserId={currentUser?._id || ""}
                onUnpin={handleUnpinMessage}
              />
            </CollapsibleSection>

            {/* Media Gallery - Expandable */}
            <CollapsibleSection
              title="Ảnh/Video"
              icon={<Image size={20} />}
              defaultOpen={true}
            >
              <MediaGallery
                messages={mediaMessagesPreview}
                onMediaClick={handleMediaClick}
                onViewAll={handleViewAllMedia}
              />
            </CollapsibleSection>

            {/* Files - Expandable */}
            <CollapsibleSection
              title="File"
              icon={<FileText size={20} />}
              defaultOpen={true}
            >
              <FilesList
                messages={fileMessagesPreview}
                onViewAll={handleViewAllFiles}
              />
            </CollapsibleSection>

            {/* Links - Expandable */}
            <CollapsibleSection
              title="Link"
              icon={<LinkIcon size={20} />}
              defaultOpen={true}
            >
              <LinksList
                messages={linkMessagesPreview}
                onViewAll={handleViewAllLinks}
              />
            </CollapsibleSection>

            {/* Group Actions */}
            {conversation._id && (
              <GroupActions
                conversation={conversation}
                currentUserId={currentUser?._id || ""}
                onLeaveSuccess={onClose}
              />
            )}
          </>
        )}

        {/* MEMBERS FULL VIEW */}
        {viewMode === "members" && (
          <MembersFullView
            members={members}
            ownerId={conversation.created_by}
            currentUserId={currentUser?._id || ""}
            isOwner={isOwner}
            onBack={handleBackToMain}
            onMemberRemoved={handleMemberRemoved}
            onMemberRoleUpdated={handleRoleUpdated}
            onAddMember={() => setShowAddMemberModal(true)}
          />
        )}

        {/* STORAGE FULL VIEW */}
        {viewMode === "storage" && (
          <StorageView
            conversationId={conversation._id}
            initialTab={storageTab}
            onBack={handleBackToMain}
            members={members}
            messages={[...allMediaMessages, ...allFileMessages]}
            linkMessages={allLinkMessages}
            onMediaClick={(messageId: string, imageIndex: number) => {
              handleMediaClick(messageId, imageIndex);
            }}
          />
        )}
      </div>

      <MediaViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        initialMessageId={viewerMessageId}
        initialImageIndex={viewerImageIndex}
        messages={allMediaMessages}
      />

      {/* Modals */}
      {conversation._id && showAddMemberModal && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          conversationId={conversation._id}
          currentMembers={members}
          onMembersAdded={handleMembersAdded}
        />
      )}

      {conversation._id && showNicknameModal && (
        <NicknameManagementModal
          isOpen={showNicknameModal}
          onClose={() => setShowNicknameModal(false)}
          members={members}
          currentUserId={currentUser?._id || ""}
          onNicknameUpdate={handleMemberNicknameUpdated}
        />
      )}

      {/* Create Group Modal - for private chats */}
      {showCreateGroupModal && conversation.type === "private" && (
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onCreateGroup={handleCreateGroupFromPrivate}
          availableUsers={availableUsers}
          preSelectedUserIds={getOtherParticipants()}
          categories={categories}
        />
      )}
    </>
  );
};

export default ChatSidebarRight;
