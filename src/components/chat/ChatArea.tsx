// src/components/Chat/ChatArea.tsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  FileText,
  Loader2,
  MessageCircle,
  PinOff,
  Play,
  Volume2,
  X,
  AlertTriangle,
  Info,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useConversations } from "../../contexts/ConversationsContext";
import { useChat } from "../../hooks/useChat";
import { primeMessageSenderCache } from "../../hooks/useMessageSender";
import {
  MessageService,
  ParticipantService,
  UserService,
  ConversationService,
  fetchRelationshipStatusViaChat,
  socketService,
} from "../../services";
import type { ChatAreaProps } from "../../interfaces";
import type {
  ImageSendError,
  ImageSendSuccess,
  Message as ChatMessageType,
} from "../../types/message.type";

// Components
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatEmpty } from "./ChatEmpty";
import { ChatMessage } from "./ChatMessage";
import { ChatNotification } from "./ChatNotification";
import { ChatTimeSeparator } from "./ChatTimeSeparator";
import ChatSidebarRight from "./ChatSidebarRight";
import { ConfirmModal } from "../modal/ConfirmModal";
import { ReplacePinnedModal } from "../modal/ReplacePinnedModal";
import { ForwardMessageModal } from "../modal/ForwardMessageModal";
import { FriendRequestBar } from "./FriendRequestBar";
import { GroupInvitationBar } from "./GroupInvitationBar";

// Utils
import {
  shouldShowTimestamp,
  formatChatTimestamp,
  getCallOpenBlockReason,
  getConversationDisplayName,
  getConversationDisplayAvatar,
  getFullUrl,
  getFileNameFromUrl,
} from "../../utils";
import {
  convertDisplayShortcodeToEmoji,
  convertEmojiImageMarkupToText,
} from "../../constants/emoji.constants";
import { MediaViewer } from "./ChatMessage/MediaViewer";
import type { Message } from "../../types";

interface ExtendedChatAreaProps extends ChatAreaProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const isSystemLikeType = (type?: string) =>
  String(type || "").startsWith("system_");

const ChatArea: React.FC<ExtendedChatAreaProps> = ({
  conversation,
  isSidebarOpen = false,
  onToggleSidebar,
}) => {
  const { user: currentUser } = useAuth();
  const {
    conversations,
    updateConversation,
    updateParticipant,
    updateConversationParticipant,
    refreshConversations,
  } = useConversations();

  const normalizedUserId = currentUser?.id;

  const activeConversation = useMemo(() => {
    const matched = conversations.find(
      (item) => item.conversation._id === conversation?._id,
    )?.conversation;
    return matched || conversation;
  }, [conversations, conversation]);

  const {
    messages,
    appendMessage,
    loadMessages,
    loadOlderMessages,
    loadMessageContext,
    loadMessageContextAfterLast,
    loading,
    hasMore,
    hasMoreAfter,
  } = useChat(activeConversation?._id, normalizedUserId);
  const isInitialLoading = loading && messages.length === 0;

  const [isOpeningCall, setIsOpeningCall] = useState(false);
  const [callBlockModal, setCallBlockModal] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "revoke" | "delete" | "delete-history" | null;
    message: Message | null;
  }>({
    isOpen: false,
    action: null,
    message: null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMarkedRef = useRef<string>("0");
  const isLoadingMoreRef = useRef(false);
  const isLoadingNewerRef = useRef(false);
  const suppressAutoScrollAfterNewerLoadRef = useRef(false);
  const suppressTopLoadUntilRef = useRef(0);
  const suppressBottomLoadUntilRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const wasNearBottomRef = useRef(true);
  const forceScrollToBottomRef = useRef(false);
  const scrollHeightRef = useRef(0);
  const isFirstLoadRef = useRef(true); // Track if this is first load for this conversation
  const initialScrollRafRef = useRef<number | null>(null);
  const prevMessageCountRef = useRef(0);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const autoFillOlderRef = useRef(false);
  const pendingCallParamsRef = useRef<{
    type: "voice" | "video";
    action: "start" | "join";
    displayName: string;
    displayAvatar: string;
  } | null>(null);

  // State quản lý Media Viewer & Tin nhắn
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinnedMenu, setShowPinnedMenu] = useState(false);
  const [expandedSystemGroups, setExpandedSystemGroups] = useState<
    Record<string, boolean>
  >({});
  const [replacePinModalOpen, setReplacePinModalOpen] = useState(false);
  const [pendingPinMessage, setPendingPinMessage] = useState<Message | null>(
    null,
  );
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(
    null,
  );
  const [isForwarding, setIsForwarding] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState<Record<string, number>>(
    {},
  );
  const [locallyRemovedPinnedMap, setLocallyRemovedPinnedMap] = useState<
    Record<string, Message>
  >({});
  const [removedMessageNotice, setRemovedMessageNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const [relationshipStatus, setRelationshipStatus] = useState<any>(null);
  const [isRelationshipLoading, setIsRelationshipLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (activeConversation?.type === "private" && !activeConversation.is_self_conversation && normalizedUserId) {
      const otherParticipantId = activeConversation.participants?.find(p => String(p.user_id) !== String(normalizedUserId))?.user_id;
      
      // If participants list is not in activeConversation, try to find from members if it's a private chat
      // Actually, private conversations should have user_id if we fetch correctly.
      
      if (otherParticipantId) {
        setIsRelationshipLoading(true);
        const status = await fetchRelationshipStatusViaChat(normalizedUserId, otherParticipantId);
        setRelationshipStatus(status);
        setIsRelationshipLoading(false);
      }
    } else {
      setRelationshipStatus(null);
    }
  }, [activeConversation, normalizedUserId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Socket listener for relationship updates (Real-time)
  useEffect(() => {
    if (!normalizedUserId) return;

    const handleRelationshipUpdate = (payload: any) => {
      // If the update involves the current user and the other participant in this private chat
      if (activeConversation?.type === "private") {
        const otherParticipantId = activeConversation.participants?.find(p => String(p.user_id) !== String(normalizedUserId))?.user_id;
        if (otherParticipantId && 
            (String(payload.requester_id) === String(otherParticipantId) || 
             String(payload.receiver_id) === String(otherParticipantId))) {
          console.log("ChatArea: Relationship status updated via socket:", payload.status);
          setRelationshipStatus(payload);
        }
      }
    };

    socketService.onRelationshipUpdate(handleRelationshipUpdate);
    return () => {
      socketService.offRelationshipUpdate(handleRelationshipUpdate);
    };
  }, [activeConversation, normalizedUserId]);

  const myParticipant = useMemo(() => {
    return conversations.find(
      (item) => item.conversation._id === activeConversation?._id,
    )?.participant;
  }, [conversations, activeConversation?._id]);

  const isInvited = useMemo(() => {
    return myParticipant?.status === 'invited' || (myParticipant as any)?.status === 'invited';
  }, [myParticipant]);

  const isParticipant = useMemo(() => {
    if (!activeConversation || activeConversation.type === "private") return true;
    if (activeConversation.is_self_conversation) return true;

    return !!myParticipant;
  }, [activeConversation, myParticipant]);

  const isDissolved = useMemo(() => {
    if (activeConversation?.status === "dissolved" || Boolean(activeConversation?.is_dissolved)) return true;
    
    // Derived from messages
    return messages.some(
      (m) =>
        m.type === "system_group_dissolved" ||
        (m.type === "system" && m.action === "group_dissolved")
    );
  }, [activeConversation, messages]);

  const [optimisticImageMessages, setOptimisticImageMessages] = useState<
    Array<ChatMessageType>
  >([]);
  const imageUploadRemovalTimersRef = useRef<Map<string, number>>(new Map());
  const pinnedMenuRef = useRef<HTMLDivElement>(null);

  const getStableMessageId = useCallback((msg?: Message | null) => {
    return String(msg?.msg_id || msg?._id || "").trim();
  }, []);

  const getPinnedScopeKey = useCallback(
    (conversationId: string, messageId: string) =>
      `${conversationId}:${String(messageId || "").trim()}`,
    [],
  );

  const applyJumpHighlight = useCallback((container: HTMLElement | null) => {
    // 1. Guard clause: Tránh lỗi crash app nếu container chưa tồn tại
    if (!container) return;

    // 2. Tìm target gọn gàng, type-safe hơn với toán tử ??
    const bubbleTarget =
      container.querySelector<HTMLElement>(".group") ??
      (container.firstElementChild as HTMLElement) ??
      container;

    // 3. Khai báo và chạy animation trực tiếp
    bubbleTarget.animate(
      [
        {
          transform: "scale(1)",
        },
        {
          transform: "scale(1.10)",
          offset: 0.3,
        },
        {
          transform: "scale(0.9)",
          offset: 0.7,
        },
        {
          transform: "scale(1)",
        },
      ],
      {
        duration: 1000,
        easing: "ease-in-out",
      },
    );
  }, []);

  // Sidebar state (Internal fallback nếu không truyền từ props)
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const sidebarOpen = onToggleSidebar ? isSidebarOpen : internalSidebarOpen;

  const toggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      setInternalSidebarOpen(!internalSidebarOpen);
    }
  };

  const revokePreviewUrls = useCallback((urls?: string[]) => {
    (urls || []).forEach((url) => {
      if (typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
  }, []);

  useEffect(() => {
    imageUploadRemovalTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    imageUploadRemovalTimersRef.current.clear();

    setOptimisticImageMessages((prev) => {
      prev.forEach((item) => revokePreviewUrls(item.local_preview_urls));
      return [];
    });
  }, [activeConversation?._id, revokePreviewUrls]);

  const clearImageRemovalTimer = useCallback((clientMessageId: string) => {
    const timerId = imageUploadRemovalTimersRef.current.get(clientMessageId);
    if (timerId) {
      window.clearTimeout(timerId);
      imageUploadRemovalTimersRef.current.delete(clientMessageId);
    }
  }, []);

  const upsertOptimisticImageMessage = useCallback(
    (draft: ChatMessageType) => {
      const clientMessageId = String(
        draft.local_client_id || draft.msg_id || draft._id || "",
      );
      if (!clientMessageId) return;

      clearImageRemovalTimer(clientMessageId);

      setOptimisticImageMessages((prev) => {
        const existing = prev.find(
          (item) =>
            String(item.local_client_id || item.msg_id || item._id || "") ===
            clientMessageId,
        );

        if (
          existing?.local_preview_urls?.length &&
          draft.local_preview_urls?.length
        ) {
          if (
            existing.local_preview_urls.join("|") !==
            draft.local_preview_urls.join("|")
          ) {
            revokePreviewUrls(existing.local_preview_urls);
          }
        }

        const optimisticMessage: ChatMessageType = {
          ...draft,
          _id: draft._id || clientMessageId,
          msg_id: draft.msg_id || clientMessageId,
          created_at: draft.created_at || new Date().toISOString(),
          createdAt: draft.createdAt || new Date().toISOString(),
          sender_name:
            draft.sender_name ||
            currentUser?.fullName ||
            "Bạn",
          reactions: Array.isArray(draft.reactions) ? draft.reactions : [],
          local_status: draft.local_status || "uploading",
          local_error: draft.local_error,
          local_upload_progress: draft.local_upload_progress ?? 0,
          local_preview_urls: draft.local_preview_urls || [],
          local_retry: draft.local_retry,
        };

        if (existing) {
          return prev.map((item) =>
            String(item.local_client_id || item.msg_id || item._id || "") ===
              clientMessageId
              ? optimisticMessage
              : item,
          );
        }

        return [...prev, optimisticMessage];
      });
    },
    [clearImageRemovalTimer, currentUser, revokePreviewUrls],
  );

  const updateOptimisticImageMessage = useCallback(
    (
      clientMessageId: string,
      updater: (message: ChatMessageType) => ChatMessageType,
    ) => {
      setOptimisticImageMessages((prev) =>
        prev.map((item) =>
          item.local_client_id === clientMessageId ? updater(item) : item,
        ),
      );
    },
    [],
  );

  const removeOptimisticImageMessage = useCallback(
    (clientMessageId: string) => {
      clearImageRemovalTimer(clientMessageId);

      setOptimisticImageMessages((prev) => {
        const item = prev.find(
          (entry) => entry.local_client_id === clientMessageId,
        );
        if (item?.local_preview_urls?.length) {
          revokePreviewUrls(item.local_preview_urls);
        }

        return prev.filter(
          (entry) => entry.local_client_id !== clientMessageId,
        );
      });
    },
    [clearImageRemovalTimer, revokePreviewUrls],
  );

  const handleImageSendStart = useCallback(
    (draft: ChatMessageType) => {
      upsertOptimisticImageMessage(draft);
    },
    [upsertOptimisticImageMessage],
  );

  const handleImageSendProgress = useCallback(
    (clientMessageId: string, progress: number) => {
      updateOptimisticImageMessage(clientMessageId, (message) => ({
        ...message,
        local_status: "uploading",
        local_upload_progress: progress,
      }));
    },
    [updateOptimisticImageMessage],
  );

  const handleImageSendError = useCallback(
    ({ clientMessageId, error }: ImageSendError) => {
      clearImageRemovalTimer(clientMessageId);
      updateOptimisticImageMessage(clientMessageId, (message) => ({
        ...message,
        local_status: "error",
        local_error: error,
        local_upload_progress: 0,
      }));
    },
    [clearImageRemovalTimer, updateOptimisticImageMessage],
  );

  const handleImageSendSuccess = useCallback(
    ({ clientMessageId, sentMessage }: ImageSendSuccess) => {
      clearImageRemovalTimer(clientMessageId);

      const nextMessage: ChatMessageType = {
        ...(sentMessage as ChatMessageType),
        local_client_id: clientMessageId,
        local_status: "success",
        local_error: undefined,
        local_upload_progress: 100,
      };

      updateOptimisticImageMessage(clientMessageId, (message) => ({
        ...message,
        ...nextMessage,
      }));

      appendMessage(sentMessage);

      const timerId = window.setTimeout(() => {
        removeOptimisticImageMessage(clientMessageId);
        forceScrollToBottomRef.current = true;
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 650);

      imageUploadRemovalTimersRef.current.set(clientMessageId, timerId);
    },
    [
      appendMessage,
      clearImageRemovalTimer,
      removeOptimisticImageMessage,
      updateOptimisticImageMessage,
    ],
  );

  const loadPinnedMessages = useCallback(async (): Promise<Message[]> => {
    if (!activeConversation?._id) {
      setPinnedMessages([]);
      return [];
    }

    try {
      const list = await MessageService.getPinnedMessages(
        activeConversation._id,
        normalizedUserId,
      );
      const normalizedList = (Array.isArray(list) ? list : [])
        .filter((msg) => msg?.is_pinned)
        .map((msg) => ({ ...msg, is_pinned: true }));

      const mergedById = new Map<string, Message>();

      normalizedList.forEach((item) => {
        const itemId = getStableMessageId(item);
        if (!itemId) return;
        mergedById.set(itemId, item);
      });

      const currentScopePrefix = `${activeConversation._id}:`;
      Object.entries(locallyRemovedPinnedMap).forEach(([scopeKey, item]) => {
        if (!scopeKey.startsWith(currentScopePrefix)) return;
        const itemId = scopeKey.slice(currentScopePrefix.length);
        if (!itemId || mergedById.has(itemId)) return;
        mergedById.set(itemId, { ...item, is_pinned: true });
      });

      const normalized = Array.from(mergedById.values())
        .sort(
          (a, b) =>
            new Date(b.pinned_at || b.createdAt || 0).getTime() -
            new Date(a.pinned_at || a.createdAt || 0).getTime(),
        )
        .slice(0, 3);

      setPinnedMessages(normalized);
      return normalized;
    } catch {
      setPinnedMessages([]);
      return [];
    }
  }, [
    activeConversation?._id,
    getStableMessageId,
    locallyRemovedPinnedMap,
    normalizedUserId,
  ]);

  const getPinnedPreviewText = useCallback((msg: Message) => {
    const messageType = String(msg.type || "").toLowerCase();
    const contentItems = Array.isArray(msg.content)
      ? msg.content
      : [msg.content];
    const mediaCount = contentItems.filter(Boolean).length;

    if (messageType === "image" && mediaCount > 1) {
      return `${mediaCount} hình ảnh`;
    }

    const firstContent = Array.isArray(msg.content)
      ? msg.content[0]
      : msg.content;
    const rawContent =
      typeof firstContent === "string"
        ? firstContent
        : typeof firstContent === "object" && firstContent
          ? String(
            (firstContent as { text?: string; url?: string; name?: string })
              .text ||
            (firstContent as { text?: string; url?: string; name?: string })
              .url ||
            (firstContent as { text?: string; url?: string; name?: string })
              .name ||
            "",
          )
          : String(firstContent || "");

    if (
      messageType === "file" ||
      messageType === "image" ||
      messageType === "video" ||
      messageType === "audio"
    ) {
      const mediaValue =
        typeof firstContent === "string"
          ? firstContent
          : typeof firstContent === "object" && firstContent
            ? String(
              (firstContent as { url?: string; text?: string; name?: string })
                .url ||
              (
                firstContent as {
                  url?: string;
                  text?: string;
                  name?: string;
                }
              ).text ||
              (
                firstContent as {
                  url?: string;
                  text?: string;
                  name?: string;
                }
              ).name ||
              "",
            )
            : "";

      const fallbackLabel =
        messageType === "image"
          ? "Hinh anh"
          : messageType === "video"
            ? "Video"
            : messageType === "audio"
              ? "Am thanh"
              : "Tep dinh kem";

      const fileName = getFileNameFromUrl(
        getFullUrl(mediaValue || rawContent),
        fallbackLabel,
      );

      try {
        return decodeURIComponent(fileName);
      } catch {
        return fileName;
      }
    }

    const normalizedText = convertDisplayShortcodeToEmoji(
      convertEmojiImageMarkupToText(rawContent || "Tin nhắn"),
    );

    return normalizedText || "Tin nhắn";
  }, []);

  const extractContentValue = useCallback((value: unknown): string => {
    if (typeof value === "string") return value;

    if (typeof value === "object" && value) {
      const candidate = value as { text?: string; url?: string; name?: string };
      return String(candidate.text || candidate.url || candidate.name || "");
    }

    return String(value || "");
  }, []);

  const getPinnedMediaValue = useCallback((msg: Message) => {
    const firstContent = Array.isArray(msg.content)
      ? msg.content[0]
      : msg.content;
    if (typeof firstContent === "string") return firstContent;
    if (typeof firstContent === "object" && firstContent) {
      return String(
        (firstContent as { url?: string; text?: string; name?: string }).url ||
        (firstContent as { url?: string; text?: string; name?: string })
          .text ||
        (firstContent as { url?: string; text?: string; name?: string })
          .name ||
        "",
      );
    }
    return "";
  }, []);

  const getPinnedSenderName = useCallback(
    (msg: Message) => {
      const senderId = String(msg.sender_id || "");

      if (
        senderId &&
        normalizedUserId &&
        senderId === String(normalizedUserId)
      ) {
        return "Bạn";
      }

      if (msg.sender_name) {
        return msg.sender_name;
      }

      const participant = (activeConversation?.participants || []).find(
        (item) => String(item.user_id || item._id || "") === senderId,
      );

      return (
        participant?.display_name ||
        participant?.nickname ||
        participant?.name ||
        "Thành viên"
      );
    },
    [activeConversation?.participants, normalizedUserId],
  );

  const typingUsers = useMemo(() => {
    const typingIds = Object.keys(typingUserIds).filter(
      (userId) => userId && String(userId) !== String(normalizedUserId || ""),
    );

    return typingIds
      .map((userId) => {
        const participant = (activeConversation?.participants || []).find(
          (item) => String(item.user_id || item._id || "") === String(userId),
        );
        const participantAny = participant as
          | {
            avatar?: string;
            avatar_url?: string;
            profile_picture?: string;
          }
          | undefined;

        return {
          id: String(userId),
          name:
            participant?.display_name ||
            participant?.nickname ||
            participant?.name ||
            "Ai đó",
          avatar:
            participantAny?.avatar ||
            participantAny?.avatar_url ||
            participantAny?.profile_picture ||
            "",
        };
      })
      .filter(Boolean);
  }, [activeConversation?.participants, normalizedUserId, typingUserIds]);

  const jumpToPinnedMessage = useCallback(
    async (msg: Message) => {
      if (!activeConversation?._id) return;

      const pinnedMessageId = getStableMessageId(msg);
      if (!pinnedMessageId) return;

      const scopedKey = getPinnedScopeKey(
        activeConversation._id,
        pinnedMessageId,
      );

      setShowPinnedMenu(false);

      if (locallyRemovedPinnedMap[scopedKey]) {
        setRemovedMessageNotice({
          isOpen: true,
          title: "Không thể mở tin nhắn ghim",
          message: "Tin nhắn gốc đã bị gỡ ở phía bạn.",
        });
        return;
      }

      window.dispatchEvent(
        new CustomEvent("chat:jump", {
          detail: {
            conversationId: activeConversation._id,
            messageId: pinnedMessageId,
            highlight: true,
            fromPinned: true,
          },
        }),
      );
    },
    [
      activeConversation?._id,
      getPinnedScopeKey,
      getStableMessageId,
      locallyRemovedPinnedMap,
    ],
  );

  const primaryPinnedMessage = pinnedMessages[0] || null;
  const morePinnedCount = Math.max(0, pinnedMessages.length - 1);
  const pinnedMessageIdSet = useMemo(() => {
    return new Set(
      pinnedMessages.map((item) => String(item.msg_id || item._id || "")),
    );
  }, [pinnedMessages]);

  const renderedMessages = useMemo(() => {
    const mergedByKey = new Map<string, Message>();

    [...messages, ...optimisticImageMessages].forEach((item) => {
      const stableId = String(item?.msg_id || item?._id || "").trim();

      if (!stableId) {
        const fallbackKey = `no-id:${mergedByKey.size}`;
        mergedByKey.set(fallbackKey, item);
        return;
      }

      const scopedKey = `${stableId}:${String(item?.conversation_id || activeConversation?._id || "")}`;
      mergedByKey.set(scopedKey, item);
    });

    return Array.from(mergedByKey.values());
  }, [messages, optimisticImageMessages, activeConversation?._id]);

  const hydratedMessages = useMemo(() => {
    const messageById = new Map<string, Message>();

    renderedMessages.forEach((item) => {
      const stableId = String(item.msg_id || item._id || "").trim();
      if (!stableId) return;
      messageById.set(stableId, item);
    });

    return renderedMessages.map((item) => {
      if (item.reply_to || !item.reply_to_msg_id) {
        return item;
      }

      const replyTargetId = String(item.reply_to_msg_id || "").trim();
      if (!replyTargetId) return item;

      const replyTarget = messageById.get(replyTargetId);
      if (!replyTarget) return item;

      const replyType = String(replyTarget.type || "text") as
        | "text"
        | "link"
        | "image"
        | "video"
        | "file"
        | "audio"
        | "system_add"
        | "system_block"
        | "system_leave"
        | "system_pin"
        | "system_unpin"
        | "call_start"
        | "call_join"
        | "call_end"
        | "call_cancel"
        | "call_no_answer";
      const rawReplyContent = Array.isArray(replyTarget.content)
        ? extractContentValue(replyTarget.content[0])
        : extractContentValue(replyTarget.content);

      const replyTo: Message["reply_to"] & {
        media_urls?: string[];
        media_count?: number;
      } = {
        msg_id: String(replyTarget.msg_id || replyTarget._id || ""),
        sender_id: String(replyTarget.sender_id || ""),
        sender_name: String(replyTarget.sender_name || ""),
        type: replyType,
        content: rawReplyContent,
        raw_content: rawReplyContent,
        url: rawReplyContent,
        is_deleted: Boolean(replyTarget.is_deleted),
        is_revoked: Boolean(replyTarget.is_revoked),
      };

      if (replyType === "image") {
        const mediaUrls = (
          Array.isArray(replyTarget.content)
            ? replyTarget.content
            : [replyTarget.content]
        )
          .map((value) => extractContentValue(value))
          .filter(Boolean);

        replyTo.media_urls = mediaUrls;
        replyTo.media_count = mediaUrls.length;
      }

      if (
        replyType === "file" ||
        replyType === "video" ||
        replyType === "audio"
      ) {
        replyTo.file_name = getFileNameFromUrl(getFullUrl(rawReplyContent));
      }

      return {
        ...item,
        reply_to: replyTo,
      };
    });
  }, [extractContentValue, renderedMessages]);

  const timelineItems = useMemo(() => {
    const items: Array<
      | {
        kind: "system-group";
        key: string;
        messages: Message[];
        showTime: boolean;
        time: string;
      }
      | {
        kind: "message";
        key: string;
        message: Message;
        showTime: boolean;
        time: string;
        index: number;
      }
    > = [];

    for (let index = 0; index < hydratedMessages.length; index += 1) {
      const currentMsg = hydratedMessages[index];
      const prevMsg = hydratedMessages[index - 1];
      const isSystemMsg = isSystemLikeType(currentMsg.type);

      if (!isSystemMsg) {
        items.push({
          kind: "message",
          key: `message-${String(
            currentMsg.local_client_id ||
            currentMsg.msg_id ||
            currentMsg._id ||
            index,
          )}-${index}`,
          message: currentMsg,
          showTime: shouldShowTimestamp(
            currentMsg.createdAt || "",
            prevMsg?.createdAt,
          ),
          time: formatChatTimestamp(currentMsg.createdAt || ""),
          index,
        });
        continue;
      }

      const showTime = shouldShowTimestamp(
        currentMsg.createdAt || "",
        prevMsg?.createdAt,
      );

      let endIndex = index;
      while (endIndex + 1 < hydratedMessages.length) {
        const nextMsg = hydratedMessages[endIndex + 1];
        if (!isSystemLikeType(nextMsg.type)) {
          break;
        }

        if (
          shouldShowTimestamp(
            nextMsg.createdAt || "",
            hydratedMessages[endIndex].createdAt,
          )
        ) {
          break;
        }

        endIndex += 1;
      }

      const systemMessages = hydratedMessages.slice(index, endIndex + 1);
      const firstMessage = systemMessages[0];
      const lastMessage = systemMessages[systemMessages.length - 1];

      items.push({
        kind: "system-group",
        key: `system-group-${String(firstMessage.msg_id || firstMessage._id || index)}-${String(lastMessage.msg_id || lastMessage._id || endIndex)}`,
        messages: systemMessages,
        showTime,
        time: formatChatTimestamp(firstMessage.createdAt || ""),
      });

      index = endIndex;
    }

    return items;
  }, [hydratedMessages]);

  const renderPinnedTypeVisual = useCallback(
    (msg: Message, size: "sm" | "md" = "sm") => {
      const type = String(msg.type || "").toLowerCase();
      const mediaValue = getPinnedMediaValue(msg);
      const boxSize = size === "md" ? "w-9 h-9" : "w-7 h-7";
      const imageCount = Array.isArray(msg.content)
        ? msg.content.filter(Boolean).length
        : 0;

      if (type === "image" && mediaValue) {
        return (
          <span
            className={`${boxSize} relative rounded-md border border-slate-200 shrink-0 overflow-hidden`}
          >
            <img
              src={getFullUrl(mediaValue)}
              alt="preview"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            {imageCount > 1 && (
              <span className="absolute inset-0 bg-black/45 text-[10px] font-semibold text-white flex items-center justify-center">
                +{imageCount - 1}
              </span>
            )}
          </span>
        );
      }

      if (type === "video") {
        return (
          <span
            className={`${boxSize} rounded-md bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-600`}
          >
            <Play size={size === "md" ? 14 : 12} />
          </span>
        );
      }

      if (type === "audio") {
        return (
          <span
            className={`${boxSize} rounded-md bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-600`}
          >
            <Volume2 size={size === "md" ? 14 : 12} />
          </span>
        );
      }

      if (type === "file") {
        return (
          <span
            className={`${boxSize} rounded-md bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-600`}
          >
            <FileText size={size === "md" ? 14 : 12} />
          </span>
        );
      }

      return null;
    },
    [getPinnedMediaValue],
  );

  // Helper thực sự mở cửa sổ gọi (sau khi đã xác nhận sẵn sàng)
  const doOpenCallWindow = (
    type: "voice" | "video",
    action: "start" | "join",
    displayName: string,
    displayAvatar: string,
  ) => {
    const params = new URLSearchParams({
      conversationId: activeConversation!._id,
      type,
      action,
      name: displayName,
      // Tránh truyền base64 quá dài gây lỗi HTTP 431 (Request Header Fields Too Large)
      avatar: displayAvatar.startsWith("data:") ? "" : displayAvatar,
    });

    setIsOpeningCall(true);
    const callWindow = window.open(
      `/call?${params.toString()}`,
      "riff-call-window",
      "width=1180,height=760,menubar=no,toolbar=no,location=no,status=no",
    );

    if (!callWindow) {
      window.location.href = `/call?${params.toString()}`;
    }
    setTimeout(() => setIsOpeningCall(false), 500);
  };

  const openCallWindow = (
    type: "voice" | "video",
    action: "start" | "join" = "start",
  ) => {
    if (!activeConversation?._id) return;

    const blockReason = getCallOpenBlockReason(activeConversation._id);
    if (blockReason === "other") {
      setCallBlockModal({
        title: "Đang trong cuộc gọi",
        message:
          "Bạn đang trong một cuộc gọi khác. Vui lòng kết thúc trước khi gọi mới.",
      });
      return;
    }
    if (blockReason === "same") {
      setCallBlockModal({
        title: "Đang trong cuộc gọi",
        message: "Bạn đang ở trong cuộc gọi này rồi.",
      });
      return;
    }

    const displayName = getConversationDisplayName(
      activeConversation,
      normalizedUserId,
    );
    const displayAvatar =
      getConversationDisplayAvatar(activeConversation, normalizedUserId) || "";

    // Nếu là Join (chấp nhận cuộc gọi) -> mở luôn
    if (action === "join") {
      doOpenCallWindow(type, action, displayName, displayAvatar);
      return;
    }

    // Nếu là Start (bắt đầu gọi) -> Check bận trước
    pendingCallParamsRef.current = {
      type,
      action,
      displayName,
      displayAvatar,
    };
    socketService.checkCallAvailability(
      activeConversation._id,
      normalizedUserId as string,
    );
  };

  useEffect(() => {
    const onCallReady = (payload: { conversationId: string }) => {
      if (payload.conversationId !== activeConversation?._id) return;
      const params = pendingCallParamsRef.current;
      if (params) {
        doOpenCallWindow(
          params.type,
          params.action,
          params.displayName,
          params.displayAvatar,
        );
        pendingCallParamsRef.current = null;
      }
    };

    socketService.onCallReady(onCallReady);

    return () => {
      socketService.offCallReady(onCallReady);
    };
  }, [activeConversation?._id, normalizedUserId]);

  // Logic đánh dấu đã đọc
  useEffect(() => {
    lastMarkedRef.current = "0";
    setReplyToMessage(null);
    scrollHeightRef.current = 0; // Reset scroll position when conversation changes
    isLoadingMoreRef.current = false; // Reset loading state
    isFirstLoadRef.current = true; // Mark as first load for new conversation
    if (initialScrollRafRef.current !== null) {
      window.cancelAnimationFrame(initialScrollRafRef.current);
      initialScrollRafRef.current = null;
    }
    prevMessageCountRef.current = 0;
    prevLastMessageIdRef.current = null;
    forceScrollToBottomRef.current = false;
    suppressAutoScrollAfterNewerLoadRef.current = false;
    lastScrollTopRef.current = 0;
    suppressBottomLoadUntilRef.current = 0;

    // Immediately clear unread when entering a conversation
    updateParticipant(activeConversation._id, { unread_count: 0 });
  }, [activeConversation?._id, updateParticipant]);

  useEffect(() => {
    primeMessageSenderCache(activeConversation?.participants);
  }, [activeConversation?.participants]);

  useEffect(() => {
    if (!messages.length || !normalizedUserId || !activeConversation?._id)
      return;

    // Mark ALL visible messages as read (including our own)
    // This is correct because we're viewing them
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg.msg_id || lastMsg.msg_id === lastMarkedRef.current) return;

    lastMarkedRef.current = lastMsg.msg_id;

    console.log(
      `📖 Marking conversation as read up to msg_id: ${lastMsg.msg_id}`,
    );

    // Cập nhật UI ngay lập tức thông qua context
    updateParticipant(activeConversation._id, {
      last_read_message_id: lastMsg.msg_id,
    });

    // Lưu dự phòng và gọi API
    localStorage.setItem(
      `read_${activeConversation._id}_${normalizedUserId}`,
      lastMsg.msg_id,
    );
    ParticipantService.markAsRead(
      activeConversation._id,
      normalizedUserId,
      lastMsg.msg_id,
    )
      .then((updated) => {
        console.log(`✓ Backend confirmed read status update:`, updated);
      })
      .catch((error) => {
        console.error(`✗ Failed to mark as read:`, error);
      });
  }, [messages, normalizedUserId, activeConversation?._id, updateParticipant]);

  const handleOpenMedia = (msgId: string, imageIndex: number = 0) => {
    setSelectedMediaId(msgId);
    setSelectedImageIndex(imageIndex);
    setViewerOpen(true);
  };

  const handleReplyMessage = (msg: Message) => {
    setReplyToMessage(msg);
    window.dispatchEvent(new CustomEvent("chat:focus-input"));
  };

  const waitForNextFrame = useCallback(
    () =>
      new Promise<void>((resolve) =>
        window.requestAnimationFrame(() => resolve()),
      ),
    [],
  );

  const waitForInitialMediaToSettle = useCallback(
    async (container: HTMLElement, timeoutMs: number = 2500) => {
      const mediaElements = Array.from(
        container.querySelectorAll("img, video"),
      ) as Array<HTMLImageElement | HTMLVideoElement>;

      if (mediaElements.length === 0) return;

      const mediaPromises = mediaElements.map((element) => {
        if (element instanceof HTMLImageElement) {
          if (element.complete && element.naturalWidth > 0) {
            return Promise.resolve();
          }

          return new Promise<void>((resolve) => {
            const done = () => {
              element.removeEventListener("load", done);
              element.removeEventListener("error", done);
              resolve();
            };

            element.addEventListener("load", done, { once: true });
            element.addEventListener("error", done, { once: true });
          });
        }

        if (
          element instanceof HTMLVideoElement &&
          element.readyState >= HTMLMediaElement.HAVE_METADATA &&
          element.videoWidth > 0
        ) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          const done = () => {
            element.removeEventListener("loadedmetadata", done);
            element.removeEventListener("loadeddata", done);
            element.removeEventListener("error", done);
            resolve();
          };

          element.addEventListener("loadedmetadata", done, { once: true });
          element.addEventListener("loadeddata", done, { once: true });
          element.addEventListener("error", done, { once: true });
        });
      });

      await Promise.race([
        Promise.allSettled(mediaPromises),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, timeoutMs);
        }),
      ]);
    },
    [],
  );

  const waitForTargetVisible = useCallback(
    (target: HTMLElement, timeoutMs: number = 1800) =>
      new Promise<void>((resolve) => {
        const container = messagesContainerRef.current;

        if (!container || !target.isConnected) {
          resolve();
          return;
        }

        const isCenteredInView = () => {
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const targetCenterY = targetRect.top + targetRect.height / 2;
          return (
            targetCenterY >= containerRect.top &&
            targetCenterY <= containerRect.bottom
          );
        };

        if (isCenteredInView()) {
          resolve();
          return;
        }

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timerId);
          container.removeEventListener("scroll", handleScroll);
          observer.disconnect();
          resolve();
        };

        const handleScroll = () => {
          if (isCenteredInView()) {
            finish();
          }
        };

        const observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              finish();
            }
          },
          {
            root: container,
            threshold: 0.6,
          },
        );

        observer.observe(target);
        container.addEventListener("scroll", handleScroll, { passive: true });

        const timerId = window.setTimeout(() => {
          finish();
        }, timeoutMs);
      }),
    [],
  );

  const centerTargetInContainer = useCallback((target: HTMLElement) => {
    const container = messagesContainerRef.current;
    if (!container || !target.isConnected) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const targetTopInContainer = targetRect.top - containerRect.top;
    const desiredScrollTop =
      container.scrollTop +
      targetTopInContainer -
      (container.clientHeight - targetRect.height) / 2;

    const maxScrollTop = Math.max(
      0,
      container.scrollHeight - container.clientHeight,
    );

    container.scrollTop = Math.min(Math.max(desiredScrollTop, 0), maxScrollTop);
  }, []);

  const jumpToMessage = useCallback(
    async (conversationId: string, messageId: string, highlight = true) => {
      if (!conversationId || !messageId) return false;
      if (conversationId !== activeConversation?._id) return false;

      const findTarget = () =>
        document.getElementById(`chat-msg-${messageId}`) ||
        (document.querySelector(
          `[data-message-id="${messageId}"]`,
        ) as HTMLElement | null);

      let targetElement = findTarget();

      if (!targetElement) {
        const loadedContext = await loadMessageContext(messageId, 20, 20);

        if (loadedContext) {
          // Prevent immediate top-trigger load burst after context replacement.
          suppressTopLoadUntilRef.current = Date.now() + 600;
          await waitForNextFrame();
          targetElement = findTarget();
        }
      }

      if (!targetElement) return false;

      centerTargetInContainer(targetElement);
      await waitForNextFrame();
      if (targetElement.isConnected) {
        centerTargetInContainer(targetElement);
      }

      if (!highlight) return true;

      await waitForTargetVisible(targetElement);
      if (!targetElement.isConnected) return false;

      applyJumpHighlight(targetElement);
      return true;
    },
    [
      activeConversation?._id,
      applyJumpHighlight,
      centerTargetInContainer,
      loadMessageContext,
      waitForNextFrame,
      waitForTargetVisible,
    ],
  );

  const handleSendSuccess = useCallback(
    async (sentMessage?: Message | null) => {
      if (sentMessage) {
        appendMessage(sentMessage);
      } else {
        await loadMessageContextAfterLast();
      }

      forceScrollToBottomRef.current = true;

      const pinToBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        container.scrollTop = container.scrollHeight;
        wasNearBottomRef.current = true;
        setShowScrollButton(false);
      };

      // Ensure the viewport lands at latest message even if DOM updates in multiple ticks.
      pinToBottom();
      window.requestAnimationFrame(pinToBottom);
      window.setTimeout(pinToBottom, 120);
    },
    [appendMessage, loadMessageContextAfterLast],
  );

  const handleReactMessage = async (msg: Message, reactionType: string) => {
    if (!activeConversation?._id || !normalizedUserId || !msg.msg_id) return;
    try {
      await MessageService.reactToMessage(
        activeConversation._id,
        msg.msg_id,
        normalizedUserId,
        reactionType,
      );
    } catch (error) {
      console.error("Thả reaction thất bại:", error);
    }
  };

  const handleRevokeMessage = async (msg: Message) => {
    if (!activeConversation?._id || !normalizedUserId || !msg.msg_id) return;

    setConfirmModal({
      isOpen: true,
      action: "revoke",
      message: msg,
    });
  };

  const handleDeleteMessage = async (msg: Message) => {
    if (!activeConversation?._id || !normalizedUserId || !msg.msg_id) return;

    setConfirmModal({
      isOpen: true,
      action: "delete",
      message: msg,
    });
  };

  const handleForwardMessage = (msg: Message) => {
    setForwardingMessage(msg);
    setForwardModalOpen(true);
  };

  const handleConfirmForwardMessage = async (conversationIds: string[]) => {
    if (!forwardingMessage || !normalizedUserId || !activeConversation?._id) return;

    setIsForwarding(true);
    try {
      const response = await MessageService.forwardMessage(
        forwardingMessage.msg_id || forwardingMessage._id || "",
        activeConversation._id,
        conversationIds,
        normalizedUserId
      );

      const results = response.results || [];
      const successCount = results.length;

      if (successCount === 0) {
        alert("Chuyển tiếp thất bại");
        return;
      }

      if (successCount < conversationIds.length) {
        alert(
          `Đã chuyển tiếp ${successCount}/${conversationIds.length} hội thoại`,
        );
      }

      if (conversationIds.includes(String(activeConversation?._id || ""))) {
        await loadMessageContextAfterLast();
      }

      setForwardModalOpen(false);
      setForwardingMessage(null);
    } catch (error) {
      console.error("Lỗi chuyển tiếp tin nhắn:", error);
      alert(error instanceof Error ? error.message : "Chuyển tiếp thất bại");
    } finally {
      setIsForwarding(false);
    }
  };

  const handlePinMessage = async (msg: Message) => {
    if (!activeConversation?._id || !normalizedUserId || !msg.msg_id) return;

    const isPinAction = !Boolean(msg.is_pinned);

    let latestPinned = pinnedMessages;
    if (isPinAction) {
      latestPinned = await loadPinnedMessages();
    }

    if (isPinAction && latestPinned.length >= 3) {
      setPendingPinMessage(msg);
      setReplacePinModalOpen(true);
      return;
    }

    try {
      const pinResult = await MessageService.pinMessage(
        activeConversation._id,
        msg.msg_id,
        normalizedUserId,
        isPinAction,
      );

      const targetPinnedId = getStableMessageId(msg);
      if (!isPinAction && targetPinnedId) {
        const scopedKey = getPinnedScopeKey(
          activeConversation._id,
          targetPinnedId,
        );
        setLocallyRemovedPinnedMap((prev) => {
          if (!prev[scopedKey]) return prev;
          const next = { ...prev };
          delete next[scopedKey];
          return next;
        });
      }

      const systemMessage = pinResult?.systemMessage;
      if (systemMessage) {
        const rawSystemContent = Array.isArray(systemMessage.content)
          ? String(systemMessage.content[0] || "")
          : String(systemMessage.content || "");

        updateConversation(activeConversation._id, {
          last_message: {
            msg_id: String(systemMessage.msg_id || ""),
            sender_id: String(systemMessage.sender_id || ""),
            sender_name: String(systemMessage.sender_name || ""),
            content:
              rawSystemContent.length > 50
                ? `${rawSystemContent.substring(0, 50)}...`
                : rawSystemContent,
            type: "text",
            createdAt: systemMessage.createdAt || new Date().toISOString(),
          },
        });
      }

      await loadMessages();
      await loadPinnedMessages();
      window.dispatchEvent(
        new CustomEvent("chat:pinned-updated", {
          detail: { conversationId: activeConversation._id },
        }),
      );
    } catch (error) {
      console.error("Ghim/Bỏ ghim tin nhắn thất bại:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Ghim/Bỏ ghim thất bại";

      if (
        isPinAction &&
        /toi da 3|tối đa 3|gioi han 3|giới hạn 3/i.test(errorMessage)
      ) {
        await loadPinnedMessages();
        setPendingPinMessage(msg);
        setReplacePinModalOpen(true);
        return;
      }

      alert(errorMessage);
    }
  };

  const handleConfirmReplacePinned = async (messageToUnpin: Message) => {
    if (
      !activeConversation?._id ||
      !normalizedUserId ||
      !pendingPinMessage?.msg_id ||
      !messageToUnpin?.msg_id
    ) {
      return;
    }

    try {
      await MessageService.pinMessage(
        activeConversation._id,
        messageToUnpin.msg_id,
        normalizedUserId,
        false,
      );

      const replacedPinnedId = getStableMessageId(messageToUnpin);
      if (replacedPinnedId) {
        const scopedKey = getPinnedScopeKey(
          activeConversation._id,
          replacedPinnedId,
        );
        setLocallyRemovedPinnedMap((prev) => {
          if (!prev[scopedKey]) return prev;
          const next = { ...prev };
          delete next[scopedKey];
          return next;
        });
      }

      const pinResult = await MessageService.pinMessage(
        activeConversation._id,
        pendingPinMessage.msg_id,
        normalizedUserId,
        true,
      );

      const systemMessage = pinResult?.systemMessage;
      if (systemMessage) {
        const rawSystemContent = Array.isArray(systemMessage.content)
          ? String(systemMessage.content[0] || "")
          : String(systemMessage.content || "");

        updateConversation(activeConversation._id, {
          last_message: {
            msg_id: String(systemMessage.msg_id || ""),
            sender_id: String(systemMessage.sender_id || ""),
            sender_name: String(systemMessage.sender_name || ""),
            content:
              rawSystemContent.length > 50
                ? `${rawSystemContent.substring(0, 50)}...`
                : rawSystemContent,
            type: "text",
            createdAt: systemMessage.createdAt || new Date().toISOString(),
          },
        });
      }

      await loadMessages();
      await loadPinnedMessages();
      window.dispatchEvent(
        new CustomEvent("chat:pinned-updated", {
          detail: { conversationId: activeConversation._id },
        }),
      );

      setReplacePinModalOpen(false);
      setPendingPinMessage(null);
    } catch (error) {
      console.error("Thay thế ghim thất bại:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Không thể cập nhật ghim";
      alert(errorMessage);
    }
  };

  const handleConfirmAction = async () => {
    const { action, message } = confirmModal;
    if (
      !action ||
      !message ||
      !message.msg_id ||
      !activeConversation?._id ||
      !normalizedUserId
    )
      return;

    try {
      if (action === "delete-history") {
        await ParticipantService.deleteConversation(activeConversation._id, normalizedUserId);
        setConfirmModal({ isOpen: false, action: null, message: null });

        // Remove from list
        window.dispatchEvent(new CustomEvent("chat:remove-conversation", {
          detail: { conversationId: activeConversation._id }
        }));

        // Back to welcome screen or another conversation
        window.dispatchEvent(new CustomEvent("chat:return-to-welcome"));
        return;
      }

      if (action === "revoke") {
        const revokedResult = await MessageService.revokeMessage(
          activeConversation._id,
          message.msg_id,
          normalizedUserId,
        );

        if (revokedResult?.last_message) {
          updateConversation(activeConversation._id, {
            last_message: {
              msg_id: String(revokedResult.last_message.msg_id || ""),
              sender_id: String(revokedResult.last_message.sender_id || ""),
              sender_name: String(revokedResult.last_message.sender_name || ""),
              content: String(revokedResult.last_message.content || ""),
              type: "text",
              createdAt:
                revokedResult.last_message.createdAt ||
                new Date().toISOString(),
            },
          });
        }

        await loadMessages();
        await loadPinnedMessages();
        window.dispatchEvent(
          new CustomEvent("chat:pinned-updated", {
            detail: { conversationId: activeConversation._id },
          }),
        );
      } else if (action === "delete") {
        const wasCurrentLastMessage =
          String(activeConversation?.last_message?.msg_id || "") ===
          String(message.msg_id || "");

        await MessageService.deleteMessage(
          activeConversation._id,
          message.msg_id,
          normalizedUserId,
        );

        const deletedMessageId = getStableMessageId(message);
        const shouldKeepPinnedOnBar =
          Boolean(deletedMessageId) &&
          (Boolean(message.is_pinned) ||
            pinnedMessageIdSet.has(deletedMessageId));

        if (shouldKeepPinnedOnBar) {
          const scopedKey = getPinnedScopeKey(
            activeConversation._id,
            deletedMessageId,
          );
          setLocallyRemovedPinnedMap((prev) => ({
            ...prev,
            [scopedKey]: {
              ...message,
              is_pinned: true,
            },
          }));
        }

        if (wasCurrentLastMessage) {
          const previousMessage = [...messages]
            .reverse()
            .find(
              (item) =>
                String(item.msg_id || item._id || "") !==
                String(message.msg_id || message._id || ""),
            );

          if (previousMessage) {
            const rawContent = Array.isArray(previousMessage.content)
              ? String(previousMessage.content[0] || "")
              : String(previousMessage.content || "");

            const displayContent =
              previousMessage.type === "image"
                ? "[Hình ảnh]"
                : previousMessage.type === "video"
                  ? "[Video]"
                  : previousMessage.type === "audio"
                    ? "[Âm thanh]"
                    : previousMessage.type === "file"
                      ? "[Tệp tin]"
                      : rawContent.length > 50
                        ? `${rawContent.substring(0, 50)}...`
                        : rawContent;

            updateConversation(activeConversation._id, {
              last_message: {
                msg_id: String(previousMessage.msg_id || previousMessage._id),
                sender_id: String(previousMessage.sender_id || ""),
                sender_name: previousMessage.sender_name || "",
                content: displayContent,
                type: isSystemLikeType(previousMessage.type)
                  ? "text"
                  : (previousMessage.type as
                    | "text"
                    | "link"
                    | "image"
                    | "video"
                    | "file"
                    | "audio"),
                createdAt:
                  previousMessage.createdAt ||
                  (previousMessage as Message & { created_at?: string })
                    .created_at ||
                  new Date().toISOString(),
              },
            });
          }
        }

        await loadMessages();
        await loadPinnedMessages();
        window.dispatchEvent(
          new CustomEvent("chat:pinned-updated", {
            detail: { conversationId: activeConversation._id },
          }),
        );
      }
    } catch (error) {
      console.error(
        `${action === "revoke" ? "Thu hồi" : "Xóa"} tin nhắn thất bại:`,
        error,
      );
    } finally {
      setConfirmModal({
        isOpen: false,
        action: null,
        message: null,
      });
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || loading || !hasMore || messages.length === 0) {
      return;
    }

    const shouldAutoFill =
      container.scrollHeight <= container.clientHeight + 16;
    if (!shouldAutoFill || autoFillOlderRef.current) {
      return;
    }

    autoFillOlderRef.current = true;

    const runAutoFill = async () => {
      try {
        let keepLoading = true;
        let attempts = 0;

        while (keepLoading && attempts < 5) {
          attempts += 1;
          const loaded = await loadOlderMessages(true);
          const latestContainer = messagesContainerRef.current;

          if (!loaded || !latestContainer) {
            keepLoading = false;
            break;
          }

          const stillNotScrollable =
            latestContainer.scrollHeight <= latestContainer.clientHeight + 16;
          keepLoading = stillNotScrollable;
        }

        // Auto-fill runs right after initial open for short histories.
        // Keep viewport anchored to newest message instead of jumping to top.
        const latestContainer = messagesContainerRef.current;
        if (latestContainer && wasNearBottomRef.current) {
          latestContainer.scrollTop = latestContainer.scrollHeight;
          window.requestAnimationFrame(() => {
            const finalContainer = messagesContainerRef.current;
            if (!finalContainer) return;
            finalContainer.scrollTop = finalContainer.scrollHeight;
          });
          setShowScrollButton(false);
        }
      } finally {
        autoFillOlderRef.current = false;
      }
    };

    void runAutoFill();
  }, [messages.length, hasMore, loading, loadOlderMessages]);

  /**
   * Handle scroll to load older messages (infinite scroll)
   */
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const isScrollingDown = currentScrollTop > lastScrollTopRef.current + 1;

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceToBottom < 100;

    // Check if user scrolled to top (100px threshold)
    if (
      container.scrollTop < 100 &&
      hasMore &&
      !isLoadingMoreRef.current &&
      !loading &&
      Date.now() > suppressTopLoadUntilRef.current
    ) {
      isLoadingMoreRef.current = true;
      console.log("📥 User scrolled to top - loading older messages");

      // Save scroll height BEFORE loading
      scrollHeightRef.current = container.scrollHeight;

      loadOlderMessages().finally(() => {
        isLoadingMoreRef.current = false;
      });
    }

    // Symmetric behavior with top-loading: near bottom loads newer messages
    // when current list is a centered context (still has newer side).
    if (
      isNearBottom &&
      hasMoreAfter &&
      !isLoadingNewerRef.current &&
      !loading &&
      isScrollingDown &&
      Date.now() > suppressBottomLoadUntilRef.current
    ) {
      isLoadingNewerRef.current = true;
      suppressAutoScrollAfterNewerLoadRef.current = true;
      suppressBottomLoadUntilRef.current = Date.now() + 400;
      loadMessageContextAfterLast().finally(() => {
        isLoadingNewerRef.current = false;
        setShowScrollButton(true);
      });
    }

    // Show/hide scroll button based on scroll position
    wasNearBottomRef.current = isNearBottom;
    setShowScrollButton(hasMoreAfter ? true : !isNearBottom);
    lastScrollTopRef.current = currentScrollTop;
  };

  const scrollToBottom = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // If there are still messages below current context, reload the latest 20 messages.
    if (hasMoreAfter && !loading) {
      forceScrollToBottomRef.current = true;
      await loadMessages();
      return;
    }

    container.scrollTop = container.scrollHeight;
    await waitForNextFrame();
    container.scrollTop = container.scrollHeight;
    wasNearBottomRef.current = true;
    setShowScrollButton(false);
  }, [hasMoreAfter, loadMessages, loading, waitForNextFrame]);

  useEffect(() => {
    if (typingUsers.length === 0) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottomNow = distanceToBottom < 140;

    if (!isNearBottomNow && !wasNearBottomRef.current) return;

    requestAnimationFrame(() => {
      const activeContainer = messagesContainerRef.current;
      if (!activeContainer) return;
      activeContainer.scrollTop = activeContainer.scrollHeight;
    });
  }, [typingUsers.length]);

  /**
   * Restore scroll position after loading older messages
   * Auto-scroll to bottom on first load for new conversation (BEFORE render visible)
   * Auto-scroll to bottom when new messages arrive
   * Use useLayoutEffect to scroll before browser paint
   */
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentMessageCount = messages.length;
    const currentLastMessageId =
      (messages[messages.length - 1]?.msg_id as string | undefined) ||
      (messages[messages.length - 1]?._id as string | undefined) ||
      null;
    const previousMessageCount = prevMessageCountRef.current;
    const previousLastMessageId = prevLastMessageIdRef.current;

    if (forceScrollToBottomRef.current && messages.length > 0 && !loading) {
      if (initialScrollRafRef.current !== null) {
        window.cancelAnimationFrame(initialScrollRafRef.current);
      }

      initialScrollRafRef.current = window.requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        forceScrollToBottomRef.current = false;
        wasNearBottomRef.current = true;
        setShowScrollButton(false);
        initialScrollRafRef.current = null;
      });

      prevMessageCountRef.current = currentMessageCount;
      prevLastMessageIdRef.current = currentLastMessageId;
      return;
    }

    // First load of new conversation: wait for media to stabilize, then scroll to bottom.
    if (isFirstLoadRef.current && messages.length > 0 && !loading) {
      if (initialScrollRafRef.current !== null) {
        window.cancelAnimationFrame(initialScrollRafRef.current);
      }

      initialScrollRafRef.current = window.requestAnimationFrame(() => {
        void (async () => {
          await waitForNextFrame();
          await waitForInitialMediaToSettle(container);

          const activeContainer = messagesContainerRef.current;
          if (!activeContainer) return;

          activeContainer.scrollTop = activeContainer.scrollHeight;
          isFirstLoadRef.current = false;
          wasNearBottomRef.current = true;
          setShowScrollButton(false);
          prevMessageCountRef.current = currentMessageCount;
          prevLastMessageIdRef.current = currentLastMessageId;
          initialScrollRafRef.current = null;
        })();
      });

      return;
    }

    // If we just loaded older messages, restore scroll position
    if (scrollHeightRef.current > 0 && !isLoadingMoreRef.current) {
      // Không dùng requestAnimationFrame ở đây nếu có thể,
      // vì useLayoutEffect chạy ĐỒNG BỘ trước khi paint.
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - scrollHeightRef.current;

      container.scrollTop = heightDifference;
      scrollHeightRef.current = 0; // Reset ngay lập tức

      // Cập nhật ref để tránh logic auto-scroll xuống dưới chạy đè lên
      prevMessageCountRef.current = messages.length;
      return;
    }

    // When we just loaded messages below, keep viewport exactly where it is.
    if (
      suppressAutoScrollAfterNewerLoadRef.current &&
      !isLoadingNewerRef.current
    ) {
      suppressAutoScrollAfterNewerLoadRef.current = false;
      prevMessageCountRef.current = currentMessageCount;
      prevLastMessageIdRef.current = currentLastMessageId;
      return;
    }

    // Only auto-scroll when a brand-new message is appended at the end and user is near bottom.
    const hasAppendedNewMessage =
      currentMessageCount > previousMessageCount &&
      !!currentLastMessageId &&
      currentLastMessageId !== previousLastMessageId;

    const wasNearBottom = wasNearBottomRef.current;

    if (
      !isLoadingMoreRef.current &&
      !isLoadingNewerRef.current &&
      !loading &&
      hasAppendedNewMessage &&
      wasNearBottom
    ) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        wasNearBottomRef.current = true;
        setShowScrollButton(false); // Hide button when scrolling to bottom
        console.log("✓ Auto-scrolled to bottom (new message)");
      });
    }

    prevMessageCountRef.current = currentMessageCount;
    prevLastMessageIdRef.current = currentLastMessageId;
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (initialScrollRafRef.current !== null) {
        window.cancelAnimationFrame(initialScrollRafRef.current);
        initialScrollRafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleScrollBottom = () => {
      requestAnimationFrame(() => {
        void scrollToBottom();
      });
    };

    window.addEventListener(
      "chat:scroll-bottom",
      handleScrollBottom as EventListener,
    );
    return () => {
      window.removeEventListener(
        "chat:scroll-bottom",
        handleScrollBottom as EventListener,
      );
    };
  }, [scrollToBottom]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{
        conversationId: string;
        messageId: string;
        highlight?: boolean;
        openMedia?: boolean;
        fromPinned?: boolean;
      }>;

      void (async () => {
        const found = await jumpToMessage(
          custom.detail?.conversationId,
          custom.detail?.messageId,
          custom.detail?.highlight ?? true,
        );

        if (custom.detail?.fromPinned && !found) {
          setRemovedMessageNotice({
            isOpen: true,
            title: "Không thể mở tin nhắn ghim",
            message: "Tin nhắn gốc đã bị gỡ ở phía bạn.",
          });
          return;
        }

        // Open media viewer if requested (e.g., from pinned messages)
        if (custom.detail?.openMedia) {
          const msgId = custom.detail.messageId;
          handleOpenMedia(msgId, 0);
        }
      })();
    };

    window.addEventListener("chat:jump", handler as EventListener);
    return () => {
      window.removeEventListener("chat:jump", handler as EventListener);
    };
  }, [jumpToMessage, handleOpenMedia]);

  useEffect(() => {
    const rawTarget = sessionStorage.getItem("chat_jump_target");
    if (!rawTarget) return;

    try {
      const target = JSON.parse(rawTarget) as {
        conversationId?: string;
        messageId?: string;
      };

      if (
        target.conversationId !== activeConversation?._id ||
        !target.messageId
      ) {
        return;
      }

      const timer = window.setTimeout(() => {
        jumpToMessage(target.conversationId || "", target.messageId || "");
        sessionStorage.removeItem("chat_jump_target");
      }, 120);

      return () => window.clearTimeout(timer);
    } catch {
      sessionStorage.removeItem("chat_jump_target");
    }
  }, [activeConversation?._id, jumpToMessage]);

  useEffect(() => {
    void loadPinnedMessages();
    setShowPinnedMenu(false);
    setExpandedSystemGroups({});
  }, [loadPinnedMessages]);

  useEffect(() => {
    const handlePinnedUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ conversationId?: string }>;
      if (custom.detail?.conversationId !== activeConversation?._id) return;
      void loadPinnedMessages();
    };

    window.addEventListener(
      "chat:pinned-updated",
      handlePinnedUpdated as EventListener,
    );
    return () => {
      window.removeEventListener(
        "chat:pinned-updated",
        handlePinnedUpdated as EventListener,
      );
    };
  }, [activeConversation?._id, loadPinnedMessages]);

  useEffect(() => {
    const markTyping = (userId: string) => {
      if (!userId) return;

      setTypingUserIds((prev) => ({
        ...prev,
        [userId]: Date.now(),
      }));
    };

    const unmarkTyping = (userId: string) => {
      if (!userId) return;
      setTypingUserIds((prev) => {
        if (!prev[userId]) return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    const handleTypingStart = (payload: {
      conversationId?: string;
      userId?: string;
    }) => {
      if (payload.conversationId !== activeConversation?._id) return;
      if (
        !payload.userId ||
        String(payload.userId) === String(normalizedUserId || "")
      ) {
        return;
      }

      markTyping(payload.userId);
    };

    const handleTypingStop = (payload: {
      conversationId?: string;
      userId?: string;
    }) => {
      if (payload.conversationId !== activeConversation?._id) return;
      if (!payload.userId) return;
      unmarkTyping(payload.userId);
    };

    const handleReadStatus = (payload: {
      conversationId: string;
      userId: string;
      msgId: string;
    }) => {
      if (payload.conversationId !== activeConversation?._id) return;
      if (String(payload.userId) === String(normalizedUserId || "")) return;

      updateConversationParticipant(payload.conversationId, payload.userId, {
        last_read_message_id: payload.msgId,
      } as any);
    };

    socketService.onTyping(handleTypingStart);
    socketService.onTypingStopped(handleTypingStop);
    socketService.onReadStatus(handleReadStatus);

    return () => {
      socketService.offTyping(handleTypingStart);
      socketService.offTypingStopped(handleTypingStop);
      socketService.offReadStatus(handleReadStatus);
    };
  }, [
    activeConversation?._id,
    normalizedUserId,
    updateParticipant,
    updateConversationParticipant,
  ]);

  useEffect(() => {
    const handleRemovedReferenceNotice = (event: Event) => {
      const custom = event as CustomEvent<{
        title?: string;
        message?: string;
      }>;

      setRemovedMessageNotice({
        isOpen: true,
        title: custom.detail?.title || "Không thể mở tin nhắn",
        message: custom.detail?.message || "Tin nhắn gốc đã bị gỡ ở phía bạn.",
      });
    };

    window.addEventListener(
      "chat:open-removed-reference-notice",
      handleRemovedReferenceNotice as EventListener,
    );

    return () => {
      window.removeEventListener(
        "chat:open-removed-reference-notice",
        handleRemovedReferenceNotice as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        pinnedMenuRef.current &&
        !pinnedMenuRef.current.contains(event.target as Node)
      ) {
        setShowPinnedMenu(false);
      }
    };

    if (showPinnedMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showPinnedMenu]);

  return (
    <div className="flex-1 flex h-full overflow-hidden relative">
      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col bg-[#F2F4F7] h-full overflow-hidden transition-all duration-300 ${sidebarOpen ? "mr-80" : ""}`}
      >
        <ChatHeader
          conversation={activeConversation}
          currentUserId={normalizedUserId}
          onStartVoiceCall={() => openCallWindow("voice")}
          onStartVideoCall={() => openCallWindow("video")}
          disableCallActions={isOpeningCall}
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          hideCallActions={
            Boolean(activeConversation?.is_self_conversation) ||
            !isParticipant ||
            isDissolved
          }
        />

        {activeConversation?.type === "private" && !activeConversation.is_self_conversation && relationshipStatus?.status !== "ACCEPTED" && (
          <FriendRequestBar 
            relationship={relationshipStatus}
            currentUserId={normalizedUserId || ""}
            otherUserId={activeConversation.participants?.find(p => String(p.user_id) !== String(normalizedUserId))?.user_id || ""}
            onStatusChange={fetchStatus} 
            isFetching={isRelationshipLoading}
          />
        )}

        {isInvited && activeConversation?._id && normalizedUserId && (
          <GroupInvitationBar
            conversationId={activeConversation._id}
            userId={normalizedUserId}
            onStatusChange={() => {
              if (normalizedUserId) refreshConversations(normalizedUserId);
            }}
          />
        )}

        <div
          ref={messagesContainerRef}
          className="flex-1 px-4 pt-2 pb-2 gap-2 overflow-y-auto custom-scrollbar flex flex-col relative overflow-hidden"
          style={{
            ["overflowAnchor" as any]: "none",
          }}
          onScroll={handleScroll}
        >
          {primaryPinnedMessage && (
            <div
              className="shrink-0 full sticky top-0 -mx-4 px-2 w-[calc(100%+2.5rem)] z-40 "
              style={{
                transform: "translate3d(0, 0, 0)",
                willChange: "transform", // Báo trước cho trình duyệt để tối ưu
              }}
            >
              <div
                ref={pinnedMenuRef}
                className="relative w-full rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => jumpToPinnedMessage(primaryPinnedMessage)}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors rounded-xl"
                  title="Đi đến tin nhắn ghim"
                >
                  <span className="shrink-0 mt-0.5 text-primary-500">
                    <MessageCircle size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-slate-600">
                      Tin nhắn ghim
                    </div>
                    <div className="text-[14px] leading-5 text-slate-900 flex items-center gap-2 min-w-0">
                      {renderPinnedTypeVisual(primaryPinnedMessage, "sm")}
                      <span className="truncate">
                        {getPinnedSenderName(primaryPinnedMessage)}:{" "}
                        {getPinnedPreviewText(primaryPinnedMessage)}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handlePinMessage(primaryPinnedMessage);
                    }}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Bỏ ghim tin nhắn này"
                  >
                    <PinOff size={15} />
                  </button>

                  {morePinnedCount > 0 && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setShowPinnedMenu((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[13px] font-semibold text-slate-700 hover:bg-slate-100"
                      title="Xem thêm tin nhắn ghim"
                    >
                      +{morePinnedCount} ghim
                      <ChevronDown size={14} />
                    </button>
                  )}
                </div>

                {showPinnedMenu && pinnedMessages.length > 1 && (
                  <div className="absolute right-2 top-[calc(100%+8px)] z-50 w-[320px] rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
                    {pinnedMessages.slice(1).map((item) => (
                      <div
                        key={item._id || item.msg_id}
                        className="w-full rounded-md px-2.5 py-2 text-left text-slate-800 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              jumpToPinnedMessage(item);
                            }}
                            className="flex-1 text-left"
                          >
                            <div className="text-[12px] text-slate-500">
                              Tin nhắn ghim
                            </div>
                            <div className="text-[13px] text-slate-800 pr-2 flex items-center gap-2 w-60">
                              {renderPinnedTypeVisual(item, "sm")}
                              <span className="truncate">
                                {getPinnedSenderName(item)}:{" "}
                                {getPinnedPreviewText(item)}
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handlePinMessage(item);
                            }}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 mt-0.5"
                            title="Bỏ ghim"
                          >
                            <PinOff size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0" />

          {/* Loading indicator for older messages */}
          {loading && messages.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-1">
              <Loader2 size={14} className="animate-spin " />
              Đang tải tin nhắn cũ...
            </div>
          )}

          {/* No more messages indicator */}
          {!hasMore && messages.length > 0 && !isDissolved && (
            <div className="flex justify-center py-2">
              <div className="text-sm text-gray-400">
                Đây là tin nhắn đầu tiên của cuộc trò chuyện
              </div>
            </div>
          )}

          {isInitialLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin text-gray-100" />
            </div>
          ) : isDissolved ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in px-4 py-8 bg-slate-50/30">
              <div className="relative group overflow-hidden bg-white/70 backdrop-blur-xl px-10 py-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white flex flex-col items-center gap-6 max-w-sm transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-100/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-100/30 rounded-full blur-3xl" />

                <div className="relative w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
                  <AlertTriangle size={32} strokeWidth={2} />
                </div>

                <div className="relative flex flex-col items-center gap-2">
                  <h3 className="text-[19px] font-bold text-slate-800 text-center leading-tight">
                    Nhóm đã được giải tán
                  </h3>
                  <p className="text-[14px] text-slate-500 text-center max-w-[240px] leading-relaxed">
                    Trưởng nhóm đã đóng cuộc hội thoại này. Bạn vẫn có thể xem lại lịch sử tin nhắn.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      action: "delete-history" as any,
                      message: { msg_id: "DUMMY_ID" } as any,
                    });
                  }}
                  className="relative px-6 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-600 font-bold text-[15px] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shadow-sm"
                >
                  <Trash2 size={16} />
                  Xóa trò chuyện
                </button>
              </div>
            </div>
          ) : isInvited ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/30">
              <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white flex flex-col items-center gap-4 max-w-sm text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-500 shadow-inner">
                  <MessageCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800 text-lg">Chào mừng bạn!</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Bạn đã được mời tham gia cuộc trò chuyện này. Hãy chấp nhận lời mời để xem lịch sử tin nhắn và tham gia cùng mọi người.
                  </p>
                </div>
              </div>
            </div>
          ) : hydratedMessages.length === 0 ? (
            <ChatEmpty />
          ) : (
            timelineItems.map((item) => {
              if (item.kind === "system-group") {
                const isExpanded = !!expandedSystemGroups[item.key];
                const shouldCollapseGroup = item.messages.length >= 2;
                const visibleSystemMessages =
                  shouldCollapseGroup && !isExpanded ? [] : item.messages;

                return (
                  <React.Fragment key={item.key}>
                    {item.showTime && <ChatTimeSeparator time={item.time} />}

                    {visibleSystemMessages.map((systemMsg) => {
                      const notificationContent = Array.isArray(
                        systemMsg.content,
                      )
                        ? String(systemMsg.content[0] || "")
                        : String(systemMsg.content || "");

                      return (
                        <div
                          key={`system-${String(systemMsg.msg_id || systemMsg._id)}`}
                          id={`chat-msg-${systemMsg.msg_id || systemMsg._id}`}
                          data-message-id={String(
                            systemMsg.msg_id || systemMsg._id,
                          )}
                        >
                          <ChatNotification
                            type={systemMsg.type}
                            content={notificationContent}
                            msgId={String(systemMsg.msg_id || systemMsg._id)}
                            conversationId={activeConversation?._id}
                            sender_id={String(systemMsg.sender_id || "")}
                            sender_name={systemMsg.sender_name}
                          />
                        </div>
                      );
                    })}

                    {shouldCollapseGroup &&
                      visibleSystemMessages.length === 0 && (
                        <div className="flex justify-center mb-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSystemGroups((prev) => ({
                                ...prev,
                                [item.key]: !isExpanded,
                              }))
                            }
                            className="text-[12px] px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Xem {item.messages.length} thông báo
                          </button>
                        </div>
                      )}

                    {shouldCollapseGroup && isExpanded && (
                      <div className="flex justify-center mb-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSystemGroups((prev) => ({
                              ...prev,
                              [item.key]: false,
                            }))
                          }
                          className="text-[12px] px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Thu gọn thông báo
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              }

              const msg = item.message;
              const index = item.index;
              const prevMsg = hydratedMessages[index - 1];
              const nextMsg = hydratedMessages[index + 1];
              const prevIsSystem = isSystemLikeType(prevMsg?.type);
              const nextIsSystem = isSystemLikeType(nextMsg?.type);
              const nextShowTime = nextMsg
                ? shouldShowTimestamp(nextMsg.createdAt || "", msg.createdAt)
                : false;
              const firstUserMessageIndex = hydratedMessages.findIndex(
                (message) => !isSystemLikeType(message.type),
              );
              const isTopBoundary = index === firstUserMessageIndex;
              const isMe = msg.sender_id === normalizedUserId;

              const isFirstInSequence =
                !prevMsg ||
                prevIsSystem ||
                prevMsg.sender_id !== msg.sender_id ||
                item.showTime;
              const isLastInSequence =
                !nextMsg ||
                nextIsSystem ||
                nextMsg.sender_id !== msg.sender_id ||
                nextShowTime;

              return (
                <React.Fragment key={item.key}>
                  {item.showTime && <ChatTimeSeparator time={item.time} />}

                  <div
                    id={`chat-msg-${msg.msg_id || msg._id || msg.local_client_id}`}
                    data-message-id={String(
                      msg.msg_id || msg._id || msg.local_client_id || "",
                    )}
                  >
                    <ChatMessage
                      msg={{
                        ...msg,
                        is_pinned:
                          Boolean(msg.is_pinned) ||
                          pinnedMessageIdSet.has(
                            String(msg.msg_id || msg._id || ""),
                          ),
                      }}
                      isMe={isMe}
                      currentUserId={normalizedUserId}
                      isFirstInSequence={isFirstInSequence}
                      isLastInSequence={isLastInSequence}
                      isTopBoundary={isTopBoundary}
                      onMediaClick={(imageIndex) =>
                        handleOpenMedia(msg._id, imageIndex)
                      }
                      onReply={handleReplyMessage}
                      onReact={handleReactMessage}
                      onRevoke={handleRevokeMessage}
                      onDelete={handleDeleteMessage}
                      onPin={handlePinMessage}
                      onForward={handleForwardMessage}
                      conversation={activeConversation}
                    />
                  </div>
                </React.Fragment>
              );
            })
          )}

          {typingUsers.length > 0 && !isInvited && (
            <div className="flex items-center  gap-2 mt-1 mb-1 pl-0.5">
              {/* Phần Avatar giữ nguyên */}
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/80 shadow-sm bg-slate-300 shrink-0">
                {typingUsers[0].avatar ? (
                  <img
                    src={typingUsers[0].avatar}
                    alt={typingUsers[0].name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-white bg-slate-500">
                    {typingUsers[0].name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Phần bong bóng chat "..." đã được sửa lại giao diện sáng */}
              <div className="h-6 px-4 rounded-2xl bg-white flex items-center pt-1 gap-1 shadow-sm">
                <span
                  className="w-1 h-1 rounded-full bg-slate-400 animate-bounce-high"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-slate-400  animate-bounce-high"
                  style={{ animationDelay: "140ms" }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-slate-400  animate-bounce-high"
                  style={{ animationDelay: "280ms" }}
                />
                {typingUsers.length > 1 && (
                  <span className="ml-1 text-[11px] font-medium text-slate-500">
                    +{typingUsers.length - 1}
                  </span>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className={`fixed ${sidebarOpen ? "right-[344px]" : "right-6"
                } bottom-32 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-[110]`}
              title="Scroll to bottom"
            >
              <ChevronDown size={24} strokeWidth={2} />
            </button>
          )}
        </div>

        {isParticipant && !isDissolved && !isInvited ? (
          <ChatInput
            key={activeConversation._id}
            conversationId={activeConversation._id}
            senderId={normalizedUserId || ""}
            onSendSuccess={handleSendSuccess}
            onUploadStart={handleImageSendStart}
            onUploadProgress={handleImageSendProgress}
            onUploadSuccess={handleImageSendSuccess}
            onUploadError={handleImageSendError}
            replyToMessage={replyToMessage}
            onCancelReply={() => setReplyToMessage(null)}
            conversationType={activeConversation?.type}
          />
        ) : (
          <div className="px-5 py-4 bg-white border-t border-slate-100">
            <div className={`flex items-center gap-3 ${isDissolved ? "text-primary-600" : "text-slate-500"} bg-slate-50 px-4 py-3 rounded-xl border border-slate-100`}>
              {isDissolved ? (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <Info size={18} strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <AlertTriangle size={18} />
                </div>
              )}
              <p className="text-[14px] font-semibold">
                {isDissolved
                  ? "Bạn không thể gửi tin nhắn vào nhóm được nữa"
                  : isInvited
                    ? "Bạn được mời tham gia nhóm. Chấp nhận lời mời để bắt đầu trò chuyện."
                    : "Bạn không còn là thành viên của nhóm này"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <ChatSidebarRight
        conversation={activeConversation}
        isOpen={sidebarOpen}
        onClose={toggleSidebar}
      />

      {/* Media Viewer Overlay */}
      {viewerOpen && (
        <MediaViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          conversationId={activeConversation._id}
          initialMessageId={selectedMediaId}
          initialImageIndex={selectedImageIndex}
          seedMessages={messages}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.action === "revoke"
            ? "Thu hồi tin nhắn"
            : "Xóa ở phía bạn"
        }
        message={
          confirmModal.action === "revoke"
            ? "Tin nhắn này sẽ bị thu hồi với tất cả mọi người trong đoạn chat"
            : "Tin nhắn này sẽ bị xóa khỏi thiết bị của bạn, nhưng vẫn hiện thị với các thành viên khác trong đoạn chat."
        }
        confirmText={
          confirmModal.action === "revoke"
            ? "Thu Hồi"
            : confirmModal.action === "delete-history"
              ? "Xóa"
              : "Xóa"
        }
        cancelText="Hủy"
        isDangerous={confirmModal.action === "delete" || confirmModal.action === "delete-history"}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({
            isOpen: false,
            action: null,
            message: null,
          })
        }
      />

      <ConfirmModal
        isOpen={removedMessageNotice.isOpen}
        title={removedMessageNotice.title}
        message={removedMessageNotice.message}
        confirmText="Đóng"
        hideCancelButton
        onConfirm={() =>
          setRemovedMessageNotice((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        onCancel={() =>
          setRemovedMessageNotice((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
      />

      <ReplacePinnedModal
        isOpen={replacePinModalOpen}
        pinnedMessages={pinnedMessages}
        pendingMessage={pendingPinMessage}
        getSenderName={getPinnedSenderName}
        getPreviewText={getPinnedPreviewText}
        renderTypeVisual={renderPinnedTypeVisual}
        onClose={() => {
          setReplacePinModalOpen(false);
          setPendingPinMessage(null);
        }}
        onConfirm={handleConfirmReplacePinned}
      />

      <ForwardMessageModal
        isOpen={forwardModalOpen}
        message={forwardingMessage}
        conversations={conversations}
        currentConversationId={activeConversation?._id}
        currentUserId={normalizedUserId}
        isSubmitting={isForwarding}
        onClose={() => {
          setForwardModalOpen(false);
          setForwardingMessage(null);
        }}
        onConfirm={handleConfirmForwardMessage}
      />

      <ConfirmModal
        isOpen={!!callBlockModal}
        title={callBlockModal?.title ?? ""}
        message={callBlockModal?.message ?? ""}
        confirmText="Đóng"
        hideCancelButton
        onConfirm={() => setCallBlockModal(null)}
        onCancel={() => setCallBlockModal(null)}
      />
    </div>
  );
};

export default ChatArea;
