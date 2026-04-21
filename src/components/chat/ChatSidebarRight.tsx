import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Users,
  Pin,
  Image,
  FileText,
  Link as LinkIcon,
  UserRoundPen,
  Info,
  Clock3,
} from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { useConversations } from "../../contexts/ConversationsContext";
import {
  MessageService,
  ParticipantService,
  UserService,
  ConversationService,
} from "../../services";
import { socketService } from "../../services/socket.service";
import type { Message, User } from "../../types";
import type {
  ConversationMember,
  LinkData,
  ViewMode,
  StorageTab,
  BulletinTab,
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
import GroupBulletinBoard from "./ChatSidebarRight/components/GroupBulletinBoard";
import AddMemberModal from "./ChatSidebarRight/modals/AddMemberModal";
import NicknameManagementModal from "./ChatSidebarRight/modals/NicknameManagementModal";
import CreateGroupModal from "../modal/group/CreateGroupModal";
import { ConfirmModal } from "../modal/ConfirmModal";
import { MediaViewer } from "./ChatMessage/MediaViewer";

// Import views
import MembersFullView from "./ChatSidebarRight/MembersFullView";
import StorageView from "./ChatSidebarRight/StorageView.tsx";
import Avatar from "../common/Avatar.tsx";
import { getConversationDisplayAvatar, getConversationDisplayName } from "../../utils/conversationDisplayUtils.ts";

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
  const [pollMessages, setPollMessages] = useState<Message[]>([]);
  const [mediaMessagesPreview, setMediaMessagesPreview] = useState<Message[]>(
    [],
  );
  const [fileMessagesPreview, setFileMessagesPreview] = useState<Message[]>([]);
  const [linkMessagesPreview, setLinkMessagesPreview] = useState<LinkData[]>(
    [],
  );
  const [allMediaMessages, setAllMediaMessages] = useState<Message[]>([]);
  const [allFileMessages, setAllFileMessages] = useState<Message[]>([]);
  const [allLinkMessages, setAllLinkMessages] = useState<LinkData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [storageTab, setStorageTab] = useState<StorageTab>("media");
  const [bulletinTab, setBulletinTab] = useState<BulletinTab>("pinned");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Modals
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerMessageId, setViewerMessageId] = useState<string | null>(null);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);

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
        role: (member.roles || member.role || "user") as "admin" | "user",
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
        MessageService.getPinnedMessages(conversation._id, currentUser?._id),
        MessageService.getMediaMessages(conversation._id),
        MessageService.getFileMessages(conversation._id),
        MessageService.getLinkMessages(conversation._id),
        conversation.type === "group" 
          ? MessageService.getPollMessages(conversation._id, currentUser?._id)
          : Promise.resolve([]),
      ]);

      const [
        membersResult,
        pinnedResult,
        mediaResult,
        filesResult,
        linksResult,
        pollsResult,
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
      const pollsData =
        pollsResult.status === "fulfilled" ? pollsResult.value : [];

      const mappedMembers = filterValidMembers(membersData);
      const memberNameById = new Map<string, string>();
      mappedMembers.forEach((member) => {
        const preferredName =
          (member.nickname || "").trim() ||
          (member.name || "").trim() ||
          `User ${String(member.user_id).slice(-4)}`;
        memberNameById.set(member.user_id, preferredName);
      });

      setMembers(mappedMembers);
      setPinnedMessages(
        filterValidMessages(pinnedData).map((message: Message) => {
          const senderId = String(message.sender_id || "");
          const preferredName = memberNameById.get(senderId);
          if (!preferredName) return message;
          return {
            ...message,
            sender_name: preferredName,
          };
        }),
      );
      const validMedia = filterValidMessages(mediaData);
      const validFiles = filterValidMessages(filesData);
      const validLinks = filterValidLinkData(linksData);
      const validPolls = filterValidMessages(pollsData);
      setAllMediaMessages(validMedia);
      setAllFileMessages(validFiles);
      setAllLinkMessages(validLinks);
      setPollMessages(validPolls);
      setMediaMessagesPreview(validMedia.slice(0, 8));
      setFileMessagesPreview(validFiles.slice(0, 5));
      setLinkMessagesPreview(validLinks.slice(0, 5));
    } catch (error) {
      console.error("Error loading sidebar data:", error);
      setError("Không thể tải thông tin sidebar");
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
  }, [conversation?._id, currentUser?._id]);

  // Load data
  useEffect(() => {
    if (isOpen && conversation?._id) {
      loadSidebarData();
    }
  }, [isOpen, conversation?._id, loadSidebarData]);

  useEffect(() => {
    const handlePinnedUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ conversationId?: string }>;
      if (custom.detail?.conversationId !== conversation?._id) return;
      if (!isOpen) return;
      void loadSidebarData();
    };

    const handleMemberUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ conversationId?: string }>;
      if (custom.detail?.conversationId !== conversation?._id) return;
      if (!isOpen) return;
      void loadSidebarData();
    };

    // --- SOCKET HANDLERS FOR REAL-TIME POLLS ---
    const handleSocketNewMessage = (msg: any) => {
      if (!isOpen || !conversation?._id) return;
      const msgId = String(msg.msg_id || msg._id || "");
      const msgConvId = String(msg.conversation_id || msg.conversationId || "");
      if (msgConvId !== conversation._id) return;

      // Only care about polls
      if (msg.type !== "poll") return;

      setPollMessages((prev) => {
        if (prev.some(p => String(p.msg_id || p._id || "") === msgId)) return prev;
        return [msg, ...prev];
      });
    };

    const handleSocketMessageUpdated = (payload: any) => {
      if (!isOpen || !conversation?._id) return;
      const msgId = String(payload.msg_id || payload._id || "");
      const payloadConvId = String(payload.conversation_id || payload.conversationId || "");
      if (payloadConvId !== conversation._id) return;

      setPollMessages((prev) =>
        prev.map((m) => {
          const mId = String(m.msg_id || m._id || "");
          if (mId === msgId) {
            return { ...m, ...payload };
          }
          return m;
        })
      );
    };

    const handleSocketMessageRemoved = (payload: any) => {
      if (!isOpen || !conversation?._id) return;
      const msgId = String(payload.msg_id || payload._id || payload.messageId || "");
      const payloadConvId = String(payload.conversation_id || payload.conversationId || "");
      if (payloadConvId !== conversation._id) return;

      setPollMessages((prev) =>
        prev.filter((m) => {
          const mId = String(m.msg_id || m._id || "");
          return mId !== msgId;
        })
      );
    };

    window.addEventListener(
      "chat:pinned-updated",
      handlePinnedUpdated as EventListener,
    );
    window.addEventListener(
      "chat:member-removed",
      handleMemberUpdated as EventListener,
    );
    window.addEventListener(
      "chat:member-left",
      handleMemberUpdated as EventListener,
    );

    // Socket Listeners
    socketService.onNewMessage(handleSocketNewMessage);
    socketService.onPollUpdate(handleSocketMessageUpdated);
    socketService.onMessageDestroyed(handleSocketMessageRemoved);
    socketService.onMessageRecalled(handleSocketMessageRemoved);

    return () => {
      window.removeEventListener(
        "chat:pinned-updated",
        handlePinnedUpdated as EventListener,
      );
      window.removeEventListener(
        "chat:member-removed",
        handleMemberUpdated as EventListener,
      );
      window.removeEventListener(
        "chat:member-left",
        handleMemberUpdated as EventListener,
      );

      socketService.offNewMessage(handleSocketNewMessage);
      socketService.offPollUpdate(handleSocketMessageUpdated);
      socketService.offMessageDestroyed(handleSocketMessageRemoved);
      socketService.offMessageRecalled(handleSocketMessageRemoved);
    };
  }, [conversation?._id, isOpen, loadSidebarData]);

  // Load available users for create group modal
  useEffect(() => {
    if (showCreateGroupModal) {
      const loadUsers = async () => {
        try {
          const users = await UserService.getAllUsers();
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

  const handleUnpinMessage = async (messageId: string) => {
    try {
      if (!currentUser?._id || !conversation?._id) return;
      await MessageService.pinMessage(
        conversation._id,
        messageId,
        currentUser._id,
        false,
      );
      setPinnedMessages((prev) =>
        prev.filter(
          (msg) =>
            String(msg.msg_id || "") !== String(messageId) &&
            String(msg._id || "") !== String(messageId),
        ),
      );
      window.dispatchEvent(
        new CustomEvent("chat:pinned-updated", {
          detail: { conversationId: conversation._id },
        }),
      );
    } catch (error) {
      console.error("Error unpinning message:", error);
      setError("Không thể bỏ ghim tin nhắn");
    }
  };

  const handleMembersAdded = (_newMembers: ConversationMember[]) => {
    loadSidebarData();
  };

  const handleMemberRemoved = async (userId: string) => {
    if (!userId || !currentUser?._id || !conversation?._id) return;
    const target = members.find((item) => item.user_id === userId);
    const displayName =
      (target?.nickname || "").trim() ||
      (target?.name || "").trim() ||
      `User ${String(userId).slice(-4)}`;
    setRemoveMemberTarget({ userId, displayName });
  };

  const handleConfirmRemoveMember = async () => {
    if (!removeMemberTarget || !currentUser?._id || !conversation?._id) {
      setRemoveMemberTarget(null);
      return;
    }
    try {
      await ParticipantService.removeMember(
        conversation._id,
        removeMemberTarget.userId,
        currentUser._id,
      );
      setRemoveMemberTarget(null);
      await loadSidebarData();
      await refreshConversations(currentUser._id || currentUser.user_id || "");
    } catch (error) {
      console.error("Error removing member:", error);
      setError(
        error instanceof Error ? error.message : "Không thể xóa thành viên",
      );
    }
  };

  const handleRoleUpdated = async (userId: string, role: string) => {
    if (!userId || !role || !currentUser?._id || !conversation?._id) return;
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

  const handleTransferOwnership = async (newOwnerId: string) => {
    const normalizedUserId = currentUser?._id || currentUser?.user_id;
    if (!normalizedUserId || !conversation?._id) return;
    try {
      await ParticipantService.transferOwnership(
        conversation._id,
        normalizedUserId,
        newOwnerId,
      );
      await loadSidebarData();
      refreshConversations(normalizedUserId);
    } catch (error) {
      console.error("Error transferring ownership:", error);
      setError(
        error instanceof Error ? error.message : "Không thể chuyển quyền trưởng nhóm",
      );
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

  const handleOpenBulletin = useCallback((tab: BulletinTab = "pinned") => {
    setBulletinTab(tab);
    setViewMode("bulletin");
  }, []);

  const handleCreateGroupFromPrivate = async (
    groupName: string,
    selectedUsers: User[],
    groupAvatar?: string,
  ) => {
    try {
      if (!currentUser?._id || !conversation?._id) return;
      const userIds = selectedUsers.map((u: User) => u._id || u.user_id);
      const newGroup = await ConversationService.createGroup(
        currentUser._id,
        groupName,
        userIds,
        groupAvatar,
      );
      if (newGroup) {
        setShowCreateGroupModal(false);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      setError(error instanceof Error ? error.message : "Không thể tạo nhóm");
    }
  };

  const isGroupChat = conversation?.type === "group";
  const isSelfConversation = Boolean(conversation?.is_self_conversation);

  const activeConversation = conversations.find(
    (item) => item.conversation._id === conversation._id,
  )?.conversation || conversation;

  const isOwner = currentUser?._id === activeConversation?.created_by ||
    currentUser?.user_id === activeConversation?.created_by;
  const currentParticipant = conversations.find(
    (item) => item.conversation._id === conversation._id,
  )?.participant;

  const userRole = currentParticipant?.roles || (currentParticipant as any)?.role || "user";
  const isAdmin = userRole === "admin";
  const isManager = Boolean(isOwner || isAdmin);
  const selfConversationId =
    conversations.find((item) => item.conversation.is_self_conversation)
      ?.conversation._id || "";

  if (!isOpen || !conversation) return null;

  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  const mb = 1024 * 1024;
  const storageLimitMB = 500;

  const getMessageSize = (message: Message) => {
    const messageSize = Number((message as any)?.size || 0);
    if (Number.isFinite(messageSize) && messageSize > 0) return messageSize;
    const content = Array.isArray(message.content) ? message.content : [message.content];
    const contentSize = content.reduce((total, item: any) => {
      const itemSize = Number(item?.size || 0);
      return total + (Number.isFinite(itemSize) ? itemSize : 0);
    }, 0);
    return contentSize > 0 ? contentSize : 0;
  };

  const storageByType = {
    image: allMediaMessages.filter((item) => item.type === "image").reduce((sum, item) => sum + getMessageSize(item), 0),
    video: allMediaMessages.filter((item) => item.type === "video").reduce((sum, item) => sum + getMessageSize(item), 0),
    file: allFileMessages.reduce((sum, item) => sum + getMessageSize(item), 0),
    other: 0,
  };

  const usedBytes = storageByType.image + storageByType.video + storageByType.file + storageByType.other;
  const usedMB = Math.min(storageLimitMB, usedBytes / mb);
  const usagePercent = Math.max(0, Math.min(100, (usedMB / storageLimitMB) * 100));

  const imagePercent = usedBytes > 0 ? (storageByType.image / usedBytes) * usagePercent : 0;
  const videoPercent = usedBytes > 0 ? (storageByType.video / usedBytes) * usagePercent : 0;
  const filePercent = usedBytes > 0 ? (storageByType.file / usedBytes) * usagePercent : 0;
  const otherPercent = Math.max(0, usagePercent - imagePercent - videoPercent - filePercent);

  const isDissolved = activeConversation?.status === "dissolved" || Boolean(activeConversation?.is_dissolved);
  const selfTitle = "Cloud của tôi";

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold cursor-pointer">×</button>
        </div>
      )}
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 z-40 overflow-y-auto custom-scrollbar">
        {/* MAIN VIEW */}
        {viewMode === "main" && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                {isDissolved ? "Tuỳ chọn" : isGroupChat ? "Thông tin nhóm" : "Thông tin đoạn chat"}
              </h2>
              <button onClick={onClose} className="cursor-pointer p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {isDissolved ? (
              <div className="flex-1 flex flex-col bg-white">
                <div className="px-4 py-8 text-center">
                  <Avatar
                    src={getConversationDisplayAvatar(activeConversation, currentUser?._id)}
                    name={getConversationDisplayName(activeConversation, currentUser?._id)}
                    size={80}
                    className="mx-auto mb-3 shadow-md"
                  />
                  <h3 className="text-xl font-bold text-gray-900">
                    {getConversationDisplayName(activeConversation, currentUser?._id)}
                  </h3>
                </div>
                <div className="mt-4">
                  <GroupActions
                    conversation={activeConversation}
                    currentUserId={currentUser?._id || ""}
                    isOwner={isOwner}
                    isDissolved={true}
                    onLeaveSuccess={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent("chat:conversation-dissolved", {
                        detail: { conversationId: activeConversation._id }
                      }));
                    }}
                    onActionSuccess={loadSidebarData}
                  />
                </div>
              </div>
            ) : isSelfConversation ? (
              <div className="border-b border-gray-100 bg-gray-50/35 pb-4">
                <div className="px-4 py-5 text-center">
                  <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-blue-500/15 ring-2 ring-blue-200 flex items-center justify-center text-blue-600 text-2xl">
                    📁
                  </div>
                  <h3 className="text-[30px] font-semibold text-slate-800 leading-8 mb-2">{selfTitle}</h3>
                  <p className="text-sm text-slate-500">Lưu trữ và truy cập nhanh những nội dung quan trọng của bạn ngay trên Zalo</p>
                </div>
                <div className="mx-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-slate-800">Dung lượng</span>
                    <span className="text-sm text-slate-500">{usedMB.toFixed(1)} MB / {storageLimitMB} MB</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    {usagePercent > 0 && (
                      <div className="flex h-full">
                        <div className="bg-orange-500" style={{ width: `${imagePercent}%` }} />
                        <div className="bg-emerald-500" style={{ width: `${videoPercent}%` }} />
                        <div className="bg-yellow-500" style={{ width: `${filePercent}%` }} />
                        <div className="bg-slate-400" style={{ width: `${otherPercent}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-orange-500" /> Ảnh</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Video</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-yellow-500" /> File</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-slate-400" /> Khác</span>
                  </div>
                  <button onClick={handleViewAllMedia} className="mt-3 w-full rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300">
                    Xem và dọn dẹp {selfTitle}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <GroupInfoHeader
                  conversation={conversation}
                  memberCount={members.length}
                  onUpdate={(updates) => updateConversation?.(conversation._id, updates)}
                  isAdmin={isManager}
                  currentUserId={currentUser?._id || currentUser?.user_id}
                />
                {!isSelfConversation && conversation._id && (
                  <GroupActionButtons
                    conversation={conversation}
                    participant={currentParticipant}
                    currentUserId={currentUser?._id || ""}
                    onAddMember={() => setShowAddMemberModal(true)}
                    onCreateGroup={() => setShowCreateGroupModal(true)}
                    onParticipantUpdated={(updates) => updateParticipant(conversation._id, updates)}
                  />
                )}

                {!isSelfConversation && conversation.type === "group" && (
                  <CollapsibleSection title="Thành viên nhóm" icon={<Users size={20} />} badge={members.length} onClick={handleViewMembers} showIndicator={false} />
                )}

                {!isSelfConversation && (conversation.type === "group" || conversation.type === "private") && (
                  <CollapsibleSection title="Biệt danh" icon={<UserRoundPen size={20} />} onClick={() => setShowNicknameModal(true)} showIndicator={false} />
                )}

                <CollapsibleSection title={isSelfConversation ? "Danh sách nhắc hẹn" : conversation.type === "group" ? "Bảng tin nhóm" : "Tin nhắn đã ghim"} icon={<Pin size={20} />} badge={conversation.type === "group" ? pinnedMessages.length : undefined} defaultOpen={true} onClick={isSelfConversation ? undefined : () => handleOpenBulletin("pinned")} showIndicator={!isSelfConversation}>
                  <PinnedMessages messages={pinnedMessages} conversationId={conversation._id} currentUserId={currentUser?._id || ""} onUnpin={handleUnpinMessage} />
                </CollapsibleSection>

                <CollapsibleSection title="Ảnh/Video" icon={<Image size={20} />} defaultOpen={true}>
                  <MediaGallery messages={mediaMessagesPreview} onMediaClick={handleMediaClick} onViewAll={handleViewAllMedia} />
                </CollapsibleSection>

                <CollapsibleSection title="File" icon={<FileText size={20} />} defaultOpen={true}>
                  <FilesList messages={fileMessagesPreview} onViewAll={handleViewAllFiles} currentUserId={currentUser?._id || currentUser?.user_id} currentConversationId={conversation._id} selfConversationId={selfConversationId} onDataChanged={() => { void loadSidebarData(); }} />
                </CollapsibleSection>

                <CollapsibleSection title="Link" icon={<LinkIcon size={20} />} defaultOpen={true}>
                  <LinksList messages={linkMessagesPreview} onViewAll={handleViewAllLinks} />
                </CollapsibleSection>

                {!isSelfConversation && conversation._id && (
                  <GroupActions
                    conversation={conversation}
                    currentUserId={currentUser?._id || ""}
                    isOwner={isOwner}
                    onLeaveSuccess={onClose}
                    onActionSuccess={async () => {
                      if (currentUser?._id || currentUser?.user_id) {
                        await refreshConversations(currentUser._id || currentUser.user_id || "");
                      }
                    }}
                  />
                )}
              </>
            )}
          </>
        )}

        {viewMode === "members" && (
          <div className="absolute inset-0 bg-white z-20">
            <MembersFullView
              members={members}
              ownerId={conversation.created_by}
              currentUserId={currentUser?._id || currentUser?.user_id || ""}
              isManager={isManager}
              onBack={handleBackToMain}
              onMemberRemoved={handleMemberRemoved}
              onMemberRoleUpdated={handleRoleUpdated}
              onTransferOwnership={handleTransferOwnership}
              onAddMember={() => setShowAddMemberModal(true)}
            />
          </div>
        )}

        {viewMode === "storage" && (
          <StorageView
            conversationId={conversation._id}
            initialTab={storageTab}
            onBack={handleBackToMain}
            members={members}
            messages={[...allMediaMessages, ...allFileMessages]}
            linkMessages={allLinkMessages}
            onMediaClick={handleMediaClick}
          />
        )}

        {viewMode === "bulletin" && (
          <GroupBulletinBoard
            conversationId={conversation._id}
            currentUserId={currentUser?._id || ""}
            pinnedMessages={pinnedMessages}
            pollMessages={pollMessages}
            activeTab={bulletinTab}
            onUnpin={handleUnpinMessage}
            onBack={handleBackToMain}
            conversationType={conversation.type}
          />
        )}
      </div>

      <MediaViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        conversationId={conversation._id}
        initialMessageId={viewerMessageId}
        initialImageIndex={viewerImageIndex}
        seedMessages={allMediaMessages}
      />

      {conversation._id && showAddMemberModal && (
        <AddMemberModal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} conversationId={conversation._id} currentMembers={members} onMembersAdded={handleMembersAdded} />
      )}

      {conversation._id && showNicknameModal && (
        <NicknameManagementModal isOpen={showNicknameModal} onClose={() => setShowNicknameModal(false)} members={members} currentUserId={currentUser?._id || ""} onNicknameUpdate={handleMemberNicknameUpdated} />
      )}

      {showCreateGroupModal && conversation.type === "private" && (
        <CreateGroupModal isOpen={showCreateGroupModal} onClose={() => setShowCreateGroupModal(false)} onCreateGroup={handleCreateGroupFromPrivate} availableUsers={availableUsers} preSelectedUserIds={getOtherParticipants()} categories={categories} />
      )}

      <ConfirmModal
        isOpen={Boolean(removeMemberTarget)}
        title="Xóa thành viên"
        message={`Bạn có chắc muốn xóa ${removeMemberTarget?.displayName || "thành viên này"} khỏi nhóm?`}
        confirmText="Xóa khỏi nhóm"
        cancelText="Hủy"
        isDangerous={true}
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => setRemoveMemberTarget(null)}
      />
    </>
  );
};

export default ChatSidebarRight;
