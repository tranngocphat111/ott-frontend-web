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
  MessageCircle,
  PinOff,
  Play,
  Volume2,
  AlertTriangle,
  Info,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useConversations } from "../../contexts/ConversationsContext";
import { useToast } from "../../contexts/ToastContext";
import { useChat } from "../../hooks/useChat";
import { primeMessageSenderCache } from "../../hooks/useMessageSender";
import {
  MessageService,
  ParticipantService,
  fetchRelationshipStatusViaChat,
  socketService,
  AiService,
} from "../../services";
import type { AiSummaryResult } from "../../services";
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
import Avatar from "../common/Avatar";
import { ConfirmModal } from "../modal/ConfirmModal";
import { ReplacePinnedModal } from "../modal/ReplacePinnedModal";
import { ForwardMessageModal } from "../modal/ForwardMessageModal";
import { FriendRequestBar } from "./FriendRequestBar";
import GroupCallModal from "./Modal/GroupCallModal";
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
  onBackToList?: () => void;
}

const isSystemLikeType = (type?: string) =>
  String(type || "").startsWith("system_") ||
  String(type || "").toLowerCase() === "call_join";

const isPollMessageType = (type?: string) =>
  String(type || "").toLowerCase() === "poll";

const isCallMessageType = (type?: string) =>
  String(type || "").startsWith("call_");

const REVOKE_WINDOW_MS = 24 * 60 * 60 * 1000;
const REVOKE_EXPIRED_MESSAGE =
  "Bạn chỉ có thể thu hồi tin nhắn trong vòng 24 giờ";
const GROUP_CALL_PENDING_LOCK_MS = 15000;
const MAX_GROUP_CALL_PARTICIPANTS = 8;
const RIGHT_SIDEBAR_DOCK_MIN_WIDTH = 1280;
const TYPING_TTL_MS = 4500;

const messageLoadingShimmerStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(90deg, rgba(226,232,240,0.82) 0%, rgba(248,250,252,0.96) 46%, rgba(226,232,240,0.82) 86%)",
  backgroundSize: "220% 100%",
};

const messageLoadingRows = [
  {
    side: "left",
    width: "w-[224px]",
    height: "h-11",
    showAvatar: true,
  },
  {
    side: "left",
    width: "w-[164px]",
    height: "h-10",
    showAvatar: false,
  },
  {
    side: "right",
    width: "w-[196px]",
    height: "h-10",
    showAvatar: false,
  },
  {
    side: "left",
    width: "w-[252px]",
    height: "h-14",
    showAvatar: true,
  },
  {
    side: "right",
    width: "w-[132px]",
    height: "h-10",
    showAvatar: false,
  },
] as const;

const MessageLoadingSkeleton = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-[360px] flex-1 flex-col justify-end gap-2.5 px-2 pb-5 pt-3 sm:px-4"
  >
    <span className="sr-only">Đang tải tin nhắn</span>

    <div
      className="animate-shimmer mx-auto mb-3 h-6 w-24 rounded-full"
      style={messageLoadingShimmerStyle}
    />

    {messageLoadingRows.map((row, index) => (
      <div
        key={`${row.side}-${index}`}
        className={`flex items-end gap-2 ${row.side === "right" ? "justify-end" : "justify-start"
          }`}
      >
        {row.side === "left" &&
          (row.showAvatar ? (
            <div
              className="animate-shimmer h-8 w-8 shrink-0 rounded-full"
              style={messageLoadingShimmerStyle}
            />
          ) : (
            <div className="w-8 shrink-0" />
          ))}

        <div
          className={`animate-shimmer ${row.width} ${row.height} rounded-[18px] ${row.side === "right" ? "rounded-br-md" : "rounded-bl-md"
            }`}
          style={messageLoadingShimmerStyle}
        />
      </div>
    ))}
  </div>
);

const isRevokeWindowExpired = (msg: Message) => {
  const rawTime = msg.created_at || msg.createdAt;
  if (!rawTime) return false;

  const createdTime = new Date(rawTime).getTime();
  if (Number.isNaN(createdTime)) return false;

  return Date.now() - createdTime > REVOKE_WINDOW_MS;
};

const ChatArea: React.FC<ExtendedChatAreaProps> = ({
  conversation,
  isSidebarOpen = false,
  onToggleSidebar,
  onBackToList,
}) => {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const {
    conversations,
    addConversation,
    updateConversation,
    updateParticipant,
  } = useConversations();
  const normalizedUserId = currentUser?.id;
  const [isOpeningCall, setIsOpeningCall] = useState(false);
  const [
    pendingGroupCallConversationId,
    setPendingGroupCallConversationId,
  ] = useState<string | null>(null);

  const activeConversation = useMemo(() => {
    const matched = conversations.find(
      (item) => item.conversation._id === conversation?._id,
    )?.conversation;
    return matched || conversation;
  }, [conversations, conversation]);
  const isPendingGroupCallStart =
    activeConversation?.type === "group" &&
    pendingGroupCallConversationId === activeConversation._id;
  const messageConversation = useMemo(() => {
    if (!activeConversation || !isPendingGroupCallStart) {
      return activeConversation;
    }

    return {
      ...activeConversation,
      is_calling: true,
    };
  }, [activeConversation, isPendingGroupCallStart]);
  const disableGroupRecallCall =
    activeConversation?.type === "group" &&
    (isPendingGroupCallStart || Boolean(activeConversation.is_calling));

  const {
    messages,
    appendMessage,
    removeMessage,
    loadMessages,
    loadOlderMessages,
    loadMessageContext,
    loadMessageContextAfterLast,
    loading,
    hasMore,
    hasMoreAfter,
  } = useChat(activeConversation?._id, normalizedUserId);

  const isInitialLoading = loading && messages.length === 0;
  const latestSmartReplySource = useMemo(() => {
    const conversationId = String(activeConversation?._id || "").trim();
    if (!conversationId) return null;

    const createSource = (message?: Partial<Message> | null) => {
      if (!message) return null;

      const type = String((message as any).type || "").toLowerCase();
      const messageId = String(
        (message as any).msg_id || (message as any)._id || "",
      ).trim();
      if (
        !messageId ||
        isSystemLikeType(type) ||
        isCallMessageType(type) ||
        type === "poll" ||
        type === "system_poll"
      ) {
        return null;
      }

      const senderId = String(
        (message as any).sender_id || (message as any).senderId || "",
      ).trim();
      const messageConversationId = String(
        (message as any).conversation_id || (message as any).conversationId || "",
      ).trim();
      if (messageConversationId && messageConversationId !== conversationId) {
        return null;
      }

      return {
        conversationId,
        messageId,
        senderId,
        type,
        key: `${conversationId}:${messageId}:${senderId}:${type}`,
      };
    };

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const source = createSource(messages[index]);
      if (source) return source;
    }

    return createSource(activeConversation?.last_message as any);
  }, [
    activeConversation?._id,
    activeConversation?.last_message?.msg_id,
    activeConversation?.last_message?.sender_id,
    activeConversation?.last_message?.type,
    messages,
  ]);

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
  const composerContainerRef = useRef<HTMLDivElement>(null);
  const lastComposerHeightRef = useRef<number | null>(null);
  const lastMarkedRef = useRef<string>("0");
  const lastDeliveredRef = useRef<string>("0");

  const seenMarkTimerRef = useRef<number | null>(null);
  const allowInitialSeenRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const isLoadingNewerRef = useRef(false);
  const typingExpiryTimersRef = useRef<Map<string, number>>(new Map());

  const suppressAutoScrollAfterNewerLoadRef = useRef(false);
  const newerLoadScrollTopRef = useRef<number | null>(null);
  const suppressTopLoadUntilRef = useRef(0);
  const suppressBottomLoadUntilRef = useRef(0);

  const suppressAutoScrollUntilRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const wasNearBottomRef = useRef(true);
  const forceScrollToBottomRef = useRef(false);
  const scrollHeightRef = useRef(0);
  const scrollTopBeforeLoadMoreRef = useRef(0);

  const lastLayoutScrollHeightRef = useRef(0);
  const lastLayoutClientHeightRef = useRef(0);
  const isFirstLoadRef = useRef(true); // Track if this is first load for this conversation
  const initialScrollRafRef = useRef<number | null>(null);
  const bottomPinRafRef = useRef<number | null>(null);
  const mediaSettleCleanupRef = useRef<(() => void) | null>(null);

  const prevMessageCountRef = useRef(0);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const lastSmartReplyMessageIdRef = useRef<string | null>(null);
  const smartReplyCacheRef = useRef<Map<string, string[]>>(new Map());
  const smartReplyLoadingTimerRef = useRef<number | null>(null);
  const scrollAnchorRef = useRef<{
    messageId: string;
    topOffset: number;
  } | null>(null);
  const autoFillOlderRef = useRef(false);

  const pendingCallParamsRef = useRef<{
    type: "voice" | "video";
    action: "start" | "join";
    displayName: string;
    displayAvatar: string;
  } | null>(null);
  const pendingGroupCallTimerRef = useRef<number | null>(null);

  const clearPendingGroupCallLock = useCallback(() => {
    if (pendingGroupCallTimerRef.current !== null) {
      window.clearTimeout(pendingGroupCallTimerRef.current);
      pendingGroupCallTimerRef.current = null;
    }
    setPendingGroupCallConversationId(null);
  }, []);

  const lockPendingGroupCall = useCallback((conversationId: string) => {
    if (pendingGroupCallTimerRef.current !== null) {
      window.clearTimeout(pendingGroupCallTimerRef.current);
    }

    setPendingGroupCallConversationId(conversationId);
    pendingGroupCallTimerRef.current = window.setTimeout(() => {
      setPendingGroupCallConversationId((currentConversationId) =>
        currentConversationId === conversationId ? null : currentConversationId,
      );
      pendingGroupCallTimerRef.current = null;
    }, GROUP_CALL_PENDING_LOCK_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingGroupCallTimerRef.current !== null) {
        window.clearTimeout(pendingGroupCallTimerRef.current);
        pendingGroupCallTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      activeConversation?.is_calling &&
      pendingGroupCallConversationId === activeConversation._id
    ) {
      clearPendingGroupCallLock();
    }
  }, [
    activeConversation?._id,
    activeConversation?.is_calling,
    clearPendingGroupCallLock,
    pendingGroupCallConversationId,
  ]);

  // State quản lý Media Viewer & Tin nhắn
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [composerHeight, setComposerHeight] = useState(112);
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

  const [isGroupCallModalOpen, setIsGroupCallModalOpen] = useState(false);

  const [relationshipStatus, setRelationshipStatus] = useState<any>(null);
  const [isRelationshipLoading, setIsRelationshipLoading] = useState(false);
  const canShowPrivatePresence =
    activeConversation?.type === "private" &&
    String(relationshipStatus?.status || "").toUpperCase() === "ACCEPTED";
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isSmartReplyLoading, setIsSmartReplyLoading] = useState(false);
  const [isSmartReplyOpen, setIsSmartReplyOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const isSummarizingRef = useRef(false);
  const [summaryResult, setSummaryResult] = useState<AiSummaryResult | null>(null);

  const fetchStatus = useCallback(async () => {
    if (activeConversation?.type === "private" && !activeConversation.is_self_conversation && normalizedUserId) {
      const otherParticipantId = activeConversation.participants?.find(p => String(p.user_id) !== String(normalizedUserId))?.user_id;

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

    const normalizeRelationshipPayload = (payload: any) => ({
      ...payload,
      _id: payload?._id || payload?.id || payload?.relationship_id,
      requester_id: payload?.requester_id || payload?.requesterId,
      receiver_id: payload?.receiver_id || payload?.receiverId,
      requesterId: payload?.requesterId || payload?.requester_id,
      receiverId: payload?.receiverId || payload?.receiver_id,
      status: payload?.status ? String(payload.status).toUpperCase() : payload?.status,
    });

    const handleRelationshipUpdate = (payload: any) => {
      const normalizedPayload = normalizeRelationshipPayload(payload);
      // If the update involves the current user and the other participant in this private chat
      if (activeConversation?.type === "private") {
        const otherParticipantId = activeConversation.participants?.find(p => String(p.user_id) !== String(normalizedUserId))?.user_id;
        const requesterId = normalizedPayload.requester_id;
        const receiverId = normalizedPayload.receiver_id;

        if (otherParticipantId &&
          (String(requesterId) === String(otherParticipantId) ||
            String(receiverId) === String(otherParticipantId))) {
          console.log("ChatArea: Relationship status updated via socket:", normalizedPayload.status);
          setRelationshipStatus(normalizedPayload);
        }
      }
    };

    const handleLocalRelationshipUpdate = (event: Event) => {
      handleRelationshipUpdate((event as CustomEvent).detail);
    };

    socketService.onRelationshipUpdate(handleRelationshipUpdate);
    window.addEventListener("chat:relationship-updated", handleLocalRelationshipUpdate);

    return () => {
      socketService.offRelationshipUpdate(handleRelationshipUpdate);
      window.removeEventListener("chat:relationship-updated", handleLocalRelationshipUpdate);
    };
  }, [activeConversation, normalizedUserId]);

  const myParticipant = useMemo(() => {
    return conversations.find(
      (item) => item.conversation._id === activeConversation?._id,
    )?.participant;
  }, [conversations, activeConversation?._id]);

  const isInvited = false;

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
    if (!container) return;

    const bubbleTarget =
      container.querySelector<HTMLElement>('[data-chat-message-bubble="true"]') ??
      container.querySelector<HTMLElement>(".group") ??
      (container.firstElementChild as HTMLElement) ??
      container;

    const getHighlightBorderRadius = () => {
      const candidates = [
        bubbleTarget.firstElementChild as HTMLElement | null,
        ...Array.from(bubbleTarget.querySelectorAll<HTMLElement>("*")),
      ].filter(Boolean) as HTMLElement[];

      for (const candidate of candidates) {
        const style = getComputedStyle(candidate);
        const hasRadius = [
          style.borderTopLeftRadius,
          style.borderTopRightRadius,
          style.borderBottomRightRadius,
          style.borderBottomLeftRadius,
        ].some((value) => value && value !== "0px");

        if (hasRadius) {
          return {
            borderTopLeftRadius: style.borderTopLeftRadius,
            borderTopRightRadius: style.borderTopRightRadius,
            borderBottomRightRadius: style.borderBottomRightRadius,
            borderBottomLeftRadius: style.borderBottomLeftRadius,
          };
        }
      }

      return {
        borderTopLeftRadius: "18px",
        borderTopRightRadius: "18px",
        borderBottomRightRadius: "18px",
        borderBottomLeftRadius: "18px",
      };
    };

    const previousPosition = bubbleTarget.style.position;
    const previousZIndex = bubbleTarget.style.zIndex;
    const previousFilter = bubbleTarget.style.filter;
    const previousTransformOrigin = bubbleTarget.style.transformOrigin;
    const highlightRadius = getHighlightBorderRadius();
    const primaryColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary-500")
        .trim() || "#B77C45";

    bubbleTarget.style.position = previousPosition || "relative";
    bubbleTarget.style.zIndex = "45";
    bubbleTarget.style.transformOrigin = "center";

    const ring = document.createElement("div");
    ring.setAttribute("aria-hidden", "true");
    ring.style.position = "absolute";
    ring.style.inset = "0";
    ring.style.borderTopLeftRadius = highlightRadius.borderTopLeftRadius;
    ring.style.borderTopRightRadius = highlightRadius.borderTopRightRadius;
    ring.style.borderBottomRightRadius = highlightRadius.borderBottomRightRadius;
    ring.style.borderBottomLeftRadius = highlightRadius.borderBottomLeftRadius;
    ring.style.pointerEvents = "none";
    ring.style.border = `2px solid ${primaryColor}`;
    ring.style.boxShadow = `0 0 0 6px rgba(183, 124, 69, 0.16), 0 14px 36px rgba(183, 124, 69, 0.22)`;
    ring.style.opacity = "0";
    ring.style.zIndex = "5";
    ring.style.mixBlendMode = "normal";
    bubbleTarget.appendChild(ring);

    bubbleTarget.animate(
      [
        { transform: "scale(1)", filter: previousFilter || "brightness(1)" },
        { transform: "scale(1.025)", filter: "brightness(1.06)", offset: 0.18 },
        { transform: "scale(1)", filter: "brightness(1.02)", offset: 0.42 },
        { transform: "scale(1.015)", filter: "brightness(1.05)", offset: 0.68 },
        { transform: "scale(1)", filter: previousFilter || "brightness(1)" },
      ],
      {
        duration: 2200,
        easing: "cubic-bezier(0.2, 0, 0.2, 1)",
      },
    );

    const ringAnimation = ring.animate(
      [
        {
          opacity: 0,
          transform: "scale(0.96)",
          boxShadow: "0 0 0 0 rgba(183, 124, 69, 0)",
        },
        {
          opacity: 1,
          transform: "scale(1)",
          boxShadow:
            "0 0 0 6px rgba(183, 124, 69, 0.18), 0 14px 36px rgba(183, 124, 69, 0.24)",
          offset: 0.16,
        },
        {
          opacity: 0.72,
          transform: "scale(1.015)",
          boxShadow:
            "0 0 0 10px rgba(183, 124, 69, 0.08), 0 12px 30px rgba(183, 124, 69, 0.16)",
          offset: 0.45,
        },
        {
          opacity: 1,
          transform: "scale(1)",
          boxShadow:
            "0 0 0 6px rgba(183, 124, 69, 0.16), 0 14px 36px rgba(183, 124, 69, 0.22)",
          offset: 0.68,
        },
        {
          opacity: 0,
          transform: "scale(1.025)",
          boxShadow: "0 0 0 14px rgba(183, 124, 69, 0)",
        },
      ],
      {
        duration: 2200,
        easing: "cubic-bezier(0.2, 0, 0.2, 1)",
      },
    );

    ringAnimation.onfinish = () => {
      ring.remove();
      bubbleTarget.style.position = previousPosition;
      bubbleTarget.style.zIndex = previousZIndex;
      bubbleTarget.style.filter = previousFilter;
      bubbleTarget.style.transformOrigin = previousTransformOrigin;
    };
  }, []);

  // Sidebar state (Internal fallback nếu không truyền từ props)
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const sidebarOpen = onToggleSidebar ? isSidebarOpen : internalSidebarOpen;
  const sidebarResponsiveCloseQueuedRef = useRef(false);

  useEffect(() => {
    if (!sidebarOpen) {
      sidebarResponsiveCloseQueuedRef.current = false;
      return;
    }

    let lastWindowWidth =
      typeof window === "undefined"
        ? RIGHT_SIDEBAR_DOCK_MIN_WIDTH
        : window.innerWidth;

    const closeSidebarWhenEnteringCrowdedLayout = () => {
      if (
        typeof window === "undefined" ||
        sidebarResponsiveCloseQueuedRef.current
      ) {
        return;
      }

      const currentWindowWidth = window.innerWidth;
      const enteredCrowdedLayout =
        lastWindowWidth >= RIGHT_SIDEBAR_DOCK_MIN_WIDTH &&
        currentWindowWidth < RIGHT_SIDEBAR_DOCK_MIN_WIDTH;
      lastWindowWidth = currentWindowWidth;

      if (!enteredCrowdedLayout) return;

      sidebarResponsiveCloseQueuedRef.current = true;
      if (onToggleSidebar) {
        onToggleSidebar();
      } else {
        setInternalSidebarOpen(false);
      }
    };

    window.addEventListener("resize", closeSidebarWhenEnteringCrowdedLayout);
    return () => {
      window.removeEventListener(
        "resize",
        closeSidebarWhenEnteringCrowdedLayout,
      );
    };
  }, [onToggleSidebar, sidebarOpen]);

  const toggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      setInternalSidebarOpen((open) => !open);
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
          sender_name: draft.sender_name || currentUser?.fullName || "Bạn",
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

  const syncConversationAfterOwnMessage = useCallback(
    (sentMessage?: Message | ChatMessageType | null) => {
      if (!sentMessage || !activeConversation?._id) return;

      const sentPayload = sentMessage as { message?: unknown; result?: unknown };
      const sent = (sentPayload?.message || sentPayload?.result || sentPayload) as ChatMessageType & {
        conversationId?: string;
        content?: unknown;
      };
      const conversationId = String(
        sent.conversation_id || sent.conversationId || activeConversation._id || "",
      ).trim();

      if (!conversationId || conversationId.startsWith("VIRTUAL_CONV_")) return;

      const messageId = String(sent.msg_id || sent._id || Date.now()).trim();
      const createdAt = String(
        sent.createdAt || sent.created_at || new Date().toISOString(),
      );
      const messageType = String(sent.type || "text").toLowerCase();

      const readContentValue = (value: unknown): string => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
          const item = value as { text?: string; content?: string; url?: string; name?: string };
          return String(item.text || item.content || item.name || item.url || "");
        }
        return String(value || "");
      };

      const contentItems = Array.isArray(sent.content)
        ? sent.content
        : [sent.content];
      const rawContent = contentItems
        .map(readContentValue)
        .filter(Boolean)
        .join(" ");
      const mediaCount = contentItems.filter(Boolean).length;

      let displayContent = rawContent;
      switch (messageType) {
        case "image":
          displayContent = mediaCount > 1 ? `[${mediaCount} hình ảnh]` : "[Hình ảnh]";
          break;
        case "video":
          displayContent = "[Video]";
          break;
        case "audio":
          displayContent = "[Âm thanh]";
          break;
        case "file":
          displayContent = sent.fileName || "[Tệp tin]";
          break;
        default:
          displayContent = convertDisplayShortcodeToEmoji(
            convertEmojiImageMarkupToText(rawContent || "Tin nhắn"),
          );
      }

      if (displayContent.length > 50) {
        displayContent = `${displayContent.slice(0, 50).trim()}...`;
      }

      const lastMessage = {
        msg_id: messageId,
        sender_id: String(sent.sender_id || normalizedUserId || ""),
        sender_name:
          sent.sender_name ||
          (String(sent.sender_id || "") === String(normalizedUserId || "")
            ? "Bạn"
            : ""),
        content: displayContent,
        type: sent.type as any,
        createdAt,
      };

      addConversation({
        ...activeConversation,
        _id: conversationId,
        is_deleted: false,
        last_message: lastMessage,
        updatedAt: createdAt,
      });

      updateConversation(conversationId, {
        is_deleted: false,
        last_message: lastMessage,
        updatedAt: createdAt,
      });

      updateParticipant(conversationId, {
        deleted_msg_id: "0",
        unread_count: 0,
        last_read_message_id: messageId,
        last_read_at: createdAt,
        last_delivered_message_id: messageId,
        last_delivered_at: createdAt,
      });

      window.dispatchEvent(
        new CustomEvent("chat:message-upserted", {
          detail: {
            conversationId,
            message: sent,
          },
        }),
      );
    },
    [
      activeConversation,
      addConversation,
      normalizedUserId,
      updateConversation,
      updateParticipant,
    ],
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
      syncConversationAfterOwnMessage(sentMessage);

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
      syncConversationAfterOwnMessage,
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
            (firstContent as { text?: string; url?: string; name?: string }).text ||
            (firstContent as { text?: string; url?: string; name?: string }).url ||
            (firstContent as { text?: string; url?: string; name?: string }).name ||
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
              (firstContent as { url?: string; text?: string; name?: string }).url ||
              (firstContent as { url?: string; text?: string; name?: string }).text ||
              (firstContent as { url?: string; text?: string; name?: string }).name ||
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
        (firstContent as { url?: string; text?: string; name?: string }).text ||
        (firstContent as { url?: string; text?: string; name?: string }).name ||
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

      const participant = (activeConversation?.participants || []).find(
        (item) => String(item.user_id || item._id || "") === senderId,
      );
      const participantNickname = String(participant?.nickname || "").trim();
      if (participantNickname) {
        return participantNickname;
      }

      if (msg.sender_name) {
        return msg.sender_name;
      }

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
    const activeConversationId = String(activeConversation?._id || "");
    const typingKeyPrefix = `${activeConversationId}:`;
    const typingIds = Object.keys(typingUserIds)
      .filter((key) => key.startsWith(typingKeyPrefix))
      .map((key) => key.slice(typingKeyPrefix.length))
      .filter(
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
      .filter((user) => Boolean(user.id));
  }, [
    activeConversation?._id,
    activeConversation?.participants,
    normalizedUserId,
    typingUserIds,
  ]);

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
      const activeConversationId = String(activeConversation?._id || "");
      const itemConversationId = String(
        item?.conversation_id || (item as Message & { conversationId?: string })?.conversationId || "",
      );

      if (
        activeConversationId &&
        itemConversationId &&
        itemConversationId !== activeConversationId
      ) {
        return;
      }

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

  const latestOwnMessageId = useMemo(() => {
    for (let index = hydratedMessages.length - 1; index >= 0; index -= 1) {
      const message = hydratedMessages[index];
      const stableId = String(
        message.msg_id || message._id || message.local_client_id || "",
      ).trim();

      if (
        stableId &&
        !isSystemLikeType(message.type) &&
        String(message.sender_id || "") === String(normalizedUserId || "")
      ) {
        return stableId;
      }
    }

    return "";
  }, [hydratedMessages, normalizedUserId]);

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
        const stableMessageKey = String(
          currentMsg.local_client_id ||
          currentMsg.msg_id ||
          currentMsg._id ||
          `index-${index}`,
        );

        items.push({
          kind: "message",
          key: `message-${stableMessageKey}`,
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
    invitedUserIds?: string[],
    callId?: string,
  ) => {
    const conversationId = activeConversation!._id;
    const effectiveType =
      activeConversation?.type === "group" ? "video" : type;
    const windowName = `call_${conversationId}`;
    const channelName = `call_channel_${conversationId}`;

    // Premium: Kiểm tra xem cửa sổ gọi cho cuộc hội thoại này đã mở chưa
    // Nếu đã mở thì chỉ focus, không tải lại (để không ngắt kết nối LiveKit)
    const bc = new BroadcastChannel(channelName);
    let isHandled = false;

    // Lắng nghe phản hồi từ cửa sổ đang mở
    bc.onmessage = (ev) => {
      if (ev.data.type === "PONG_ALIVE") {
        isHandled = true;
        bc.close();
      }
    };

    // Gửi tín hiệu yêu cầu focus
    bc.postMessage({ type: "PING_FOCUS" });

    // Sau một khoảng thời gian ngắn, nếu không có ai phản hồi thì mới mở cửa sổ mới
    setTimeout(() => {
      if (!isHandled) {
        const params = new URLSearchParams({
          conversationId,
          type: effectiveType,
          action,
          name: displayName,
          avatar: displayAvatar.startsWith("data:") ? "" : displayAvatar,
        });

        if (activeConversation?.type === "group") {
          params.append("isGroup", "true");
          params.append("transport", "livekit");
        }

        if (callId) {
          params.append("callId", callId);
        }

        if (invitedUserIds && invitedUserIds.length > 0) {
          params.append("invitedUserIds", invitedUserIds.join(","));
        }

        setIsOpeningCall(true);
        const callWindow = window.open(
          `/call?${params.toString()}`,
          windowName,
          "width=1180,height=760,menubar=no,toolbar=no,location=no,status=no",
        );

        if (!callWindow) {
          window.location.href = `/call?${params.toString()}`;
        }
        setTimeout(() => setIsOpeningCall(false), 500);
      }
      bc.close();
    }, 250);
  };

  const handleGroupCallStart = (selectedUserIds: string[]) => {
    if (!activeConversation?._id) return;

    setIsGroupCallModalOpen(false);
    lockPendingGroupCall(activeConversation._id);

    const displayName = getConversationDisplayName(activeConversation, normalizedUserId);
    const displayAvatar = getConversationDisplayAvatar(activeConversation, normalizedUserId) || "";

    doOpenCallWindow("video", "start", displayName, displayAvatar, selectedUserIds);
  };

  const openCallWindow = (
    type: "voice" | "video",
    action: "start" | "join" = "start",
  ) => {
    if (!activeConversation?._id) return;

    if (
      activeConversation.type === "group" &&
      isPendingGroupCallStart &&
      !activeConversation.is_calling
    ) {
      return;
    }

    // Nếu cuộc gọi đang diễn ra -> Chuyển sang join luôn, không hiện modal chọn người
    if (activeConversation.is_calling && activeConversation.type === "group") {
      const activeParticipantCount = Number(
        activeConversation.call_participant_count || 0,
      );
      if (activeParticipantCount >= MAX_GROUP_CALL_PARTICIPANTS) {
        setCallBlockModal({
          title: "Cuộc gọi đã đủ người",
          message: `Cuộc gọi nhóm tối đa ${MAX_GROUP_CALL_PARTICIPANTS} người tham gia.`,
        });
        return;
      }

      const displayName = getConversationDisplayName(activeConversation, normalizedUserId);
      const displayAvatar = getConversationDisplayAvatar(activeConversation, normalizedUserId) || "";
      doOpenCallWindow(
        "video",
        "join",
        displayName,
        displayAvatar,
        undefined,
        activeConversation.active_call_id,
      );
      return;
    }

    // Nếu là bắt đầu gọi nhóm -> hiện modal chọn thành viên trước
    if (action === "start" && activeConversation.type === "group") {
      setIsGroupCallModalOpen(true);
      return;
    }

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

  const handleRecallFromCallMessage = (type: "voice" | "video") => {
    if (!activeConversation?._id) return;

    if (activeConversation.type === "group") {
      if (activeConversation.is_calling || isPendingGroupCallStart) return;
      openCallWindow("video");
      return;
    }

    openCallWindow(type);
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
    lastDeliveredRef.current = "0";
    allowInitialSeenRef.current = true;
    if (seenMarkTimerRef.current !== null) {
      window.clearTimeout(seenMarkTimerRef.current);
      seenMarkTimerRef.current = null;
    }
    setReplyToMessage(null);
    scrollHeightRef.current = 0; // Reset scroll position when conversation changes
    scrollTopBeforeLoadMoreRef.current = 0;
    isLoadingMoreRef.current = false; // Reset loading state
    isFirstLoadRef.current = true; // Mark as first load for new conversation
    if (initialScrollRafRef.current !== null) {
      window.cancelAnimationFrame(initialScrollRafRef.current);
      initialScrollRafRef.current = null;
    }
    if (bottomPinRafRef.current !== null) {
      window.cancelAnimationFrame(bottomPinRafRef.current);
      bottomPinRafRef.current = null;
    }
    mediaSettleCleanupRef.current?.();
    mediaSettleCleanupRef.current = null;
    prevMessageCountRef.current = 0;
    prevLastMessageIdRef.current = null;
    lastLayoutScrollHeightRef.current = 0;
    lastLayoutClientHeightRef.current = 0;
    newerLoadScrollTopRef.current = null;
    wasNearBottomRef.current = true;
    forceScrollToBottomRef.current = false;
    suppressAutoScrollAfterNewerLoadRef.current = false;
    lastScrollTopRef.current = 0;
    suppressTopLoadUntilRef.current = Date.now() + 800;
    suppressBottomLoadUntilRef.current = 0;
    suppressAutoScrollUntilRef.current = 0;
    setShowScrollButton(false);

    // Immediately clear unread when entering a conversation
    updateParticipant(activeConversation._id, { unread_count: 0 });
  }, [activeConversation?._id, updateParticipant]);

  useEffect(() => {
    primeMessageSenderCache(activeConversation?.participants);
  }, [activeConversation?.participants]);

  useEffect(() => {
    return () => {
      if (initialScrollRafRef.current !== null) {
        window.cancelAnimationFrame(initialScrollRafRef.current);
        initialScrollRafRef.current = null;
      }
      if (bottomPinRafRef.current !== null) {
        window.cancelAnimationFrame(bottomPinRafRef.current);
        bottomPinRafRef.current = null;
      }
      mediaSettleCleanupRef.current?.();
      mediaSettleCleanupRef.current = null;
      if (smartReplyLoadingTimerRef.current !== null) {
        window.clearTimeout(smartReplyLoadingTimerRef.current);
        smartReplyLoadingTimerRef.current = null;
      }
      typingExpiryTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      typingExpiryTimersRef.current.clear();
    };
  }, []);

  const latestMessageForCursor = messages[messages.length - 1] as
    | (ChatMessageType & { _id?: string; msg_id?: string; sender_id?: string })
    | undefined;

  const latestCursorMsgId = String(latestMessageForCursor?.msg_id || "").trim();
  const latestStableMsgId = String(
    latestMessageForCursor?.msg_id ||
    latestMessageForCursor?._id ||
    latestMessageForCursor?.local_client_id ||
    "",
  ).trim();

  const latestMessageSenderId = String(
    latestMessageForCursor?.sender_id || "",
  ).trim();

  const latestMessageConversationId = String(
    latestMessageForCursor?.conversation_id ||
    (latestMessageForCursor as
      | (ChatMessageType & { conversationId?: string })
      | undefined)?.conversationId ||
    "",
  ).trim();

  const latestMessageMatchesActiveConversation =
    !latestMessageConversationId ||
    latestMessageConversationId === String(activeConversation?._id || "");

  useEffect(() => {
    if (
      !latestCursorMsgId ||
      !latestMessageMatchesActiveConversation ||
      !normalizedUserId ||
      !activeConversation?._id
    ) {
      return;
    }

    if (latestCursorMsgId === lastDeliveredRef.current) return;

    lastDeliveredRef.current = latestCursorMsgId;
    updateParticipant(activeConversation._id, {
      last_delivered_message_id: latestCursorMsgId,
      last_delivered_at: new Date().toISOString(),
    });

    socketService.markMessagesDeliveredUpTo(
      activeConversation._id,
      normalizedUserId,
      latestCursorMsgId,
    );
  }, [
    latestCursorMsgId,
    latestMessageMatchesActiveConversation,
    normalizedUserId,
    activeConversation?._id,
    updateParticipant,
  ]);

  const markMessageSeenUpTo = useCallback(
    (msgId: string, options: { immediate?: boolean } = {}) => {
      if (!msgId || !normalizedUserId || !activeConversation?._id) return;
      if (msgId === lastMarkedRef.current) return;

      if (seenMarkTimerRef.current !== null) {
        window.clearTimeout(seenMarkTimerRef.current);
        seenMarkTimerRef.current = null;
      }

      const markSeen = () => {
        lastMarkedRef.current = msgId;
        seenMarkTimerRef.current = null;

        const now = new Date().toISOString();
        updateParticipant(activeConversation._id, {
          last_delivered_message_id: msgId,
          last_delivered_at: now,
          last_read_message_id: msgId,
          last_read_at: now,
          unread_count: 0,
        });

        socketService.markMessageSeenUpTo(
          activeConversation._id,
          normalizedUserId,
          msgId,
        );
      };

      if (options.immediate) {
        markSeen();
        return;
      }

      seenMarkTimerRef.current = window.setTimeout(markSeen, 120);
    },
    [activeConversation?._id, normalizedUserId, updateParticipant],
  );

  const markLatestMessageSeen = useCallback(
    (requireNearBottom: boolean = true) => {
      if (!latestCursorMsgId) return;
      if (!latestMessageMatchesActiveConversation) return;

      if (requireNearBottom) {
        const container = messagesContainerRef.current;
        if (!container) return;

        const distanceToBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceToBottom > 180) return;
      }

      markMessageSeenUpTo(latestCursorMsgId);
    },
    [
      latestCursorMsgId,
      latestMessageMatchesActiveConversation,
      markMessageSeenUpTo,
    ],
  );

  useEffect(() => {
    if (!allowInitialSeenRef.current) return;
    if (!latestCursorMsgId) return;
    if (!latestMessageMatchesActiveConversation) return;
    if (latestCursorMsgId === lastMarkedRef.current) return;

    allowInitialSeenRef.current = false;
    markMessageSeenUpTo(latestCursorMsgId, { immediate: true });
  }, [
    latestCursorMsgId,
    latestMessageMatchesActiveConversation,
    markMessageSeenUpTo,
  ]);

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

  const pinMessagesToBottom = useCallback(
    (options: { force?: boolean } = {}) => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const shouldPin =
        options.force ||
        forceScrollToBottomRef.current ||
        wasNearBottomRef.current ||
        distanceToBottom < 80;

      if (
        !shouldPin ||
        isLoadingMoreRef.current ||
        isLoadingNewerRef.current ||
        suppressAutoScrollAfterNewerLoadRef.current ||
        Date.now() <= suppressAutoScrollUntilRef.current
      ) {
        return;
      }

      if (bottomPinRafRef.current !== null) {
        window.cancelAnimationFrame(bottomPinRafRef.current);
      }

      bottomPinRafRef.current = window.requestAnimationFrame(() => {
        const activeContainer = messagesContainerRef.current;
        bottomPinRafRef.current = null;
        if (!activeContainer) return;

        activeContainer.scrollTop = activeContainer.scrollHeight;
        wasNearBottomRef.current = true;
        setShowScrollButton(false);
      });
    },
    [],
  );

  const keepBottomWhileMediaSettles = useCallback(
    (container: HTMLElement, timeoutMs: number = 3500) => {
      mediaSettleCleanupRef.current?.();

      const mediaElements = Array.from(
        container.querySelectorAll("img, video"),
      ) as Array<HTMLImageElement | HTMLVideoElement>;

      if (mediaElements.length === 0) {
        mediaSettleCleanupRef.current = null;
        return null;
      }

      let disposed = false;
      let timeoutId: number | null = null;
      const observer =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => pinMessagesToBottom())
          : null;

      const handleMediaSettled = () => {
        if (disposed) return;
        pinMessagesToBottom();
      };

      const cleanup = () => {
        if (disposed) return;
        disposed = true;

        mediaElements.forEach((element) => {
          element.removeEventListener("load", handleMediaSettled);
          element.removeEventListener("error", handleMediaSettled);
          element.removeEventListener("loadedmetadata", handleMediaSettled);
          element.removeEventListener("loadeddata", handleMediaSettled);
        });

        observer?.disconnect();

        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (mediaSettleCleanupRef.current === cleanup) {
          mediaSettleCleanupRef.current = null;
        }
      };

      mediaElements.forEach((element) => {
        element.addEventListener("load", handleMediaSettled);
        element.addEventListener("error", handleMediaSettled);
        element.addEventListener("loadedmetadata", handleMediaSettled);
        element.addEventListener("loadeddata", handleMediaSettled);
        observer?.observe(element);
      });

      timeoutId = window.setTimeout(cleanup, timeoutMs);
      mediaSettleCleanupRef.current = cleanup;

      return cleanup;
    },
    [pinMessagesToBottom],
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
          // Prevent auto-scroll to bottom from fighting with our jump.
          suppressAutoScrollUntilRef.current = Date.now() + 1500;
          isFirstLoadRef.current = false;
          wasNearBottomRef.current = false;

          // Prevent immediate top-trigger load burst after context replacement.
          suppressTopLoadUntilRef.current = Date.now() + 600;

          // React batches state updates - the DOM may not be ready after just
          // one animation frame.
          // Poll up to 20 times (x50ms = 1s) so the
          // element is found as soon as React commits the new messages to DOM.
          const MAX_RETRIES = 20;
          const RETRY_INTERVAL_MS = 50;
          for (let i = 0; i < MAX_RETRIES; i++) {
            await waitForNextFrame();
            targetElement = findTarget();
            if (targetElement) break;
            await new Promise<void>((resolve) =>
              window.setTimeout(resolve, RETRY_INTERVAL_MS),
            );
          }
        }
      }

      if (!targetElement) return false;

      const syncJumpScrollButton = () => {
        const activeContainer = messagesContainerRef.current;
        if (!activeContainer) return;

        const hasScrollableOverflow =
          activeContainer.scrollHeight > activeContainer.clientHeight + 8;
        const distanceToBottom =
          activeContainer.scrollHeight -
          activeContainer.scrollTop -
          activeContainer.clientHeight;
        const isNearBottom = distanceToBottom < 100;

        wasNearBottomRef.current = isNearBottom;
        lastScrollTopRef.current = activeContainer.scrollTop;
        setShowScrollButton(hasScrollableOverflow && distanceToBottom >= 100);
      };

      // Ensure auto-scroll doesn't override our manual scroll.
      suppressAutoScrollUntilRef.current = Date.now() + 1000;
      wasNearBottomRef.current = false;
      setShowScrollButton(false);

      centerTargetInContainer(targetElement);
      await waitForNextFrame();

      if (targetElement.isConnected) {
        centerTargetInContainer(targetElement);
      }

      syncJumpScrollButton();
      window.requestAnimationFrame(syncJumpScrollButton);

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
        syncConversationAfterOwnMessage(sentMessage);
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
    [appendMessage, loadMessageContextAfterLast, syncConversationAfterOwnMessage],
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

    if (isRevokeWindowExpired(msg)) {
      showToast(REVOKE_EXPIRED_MESSAGE, "warning", "Thông báo", 3000);
      return;
    }

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
          detail: {
            conversationId: activeConversation._id,
            reason: "delete-history",
          }
        }));

        // Back to welcome screen or another conversation
        window.dispatchEvent(new CustomEvent("chat:return-to-welcome"));
        return;
      }

      if (action === "revoke") {
        if (isRevokeWindowExpired(message)) {
          showToast(REVOKE_EXPIRED_MESSAGE, "warning", "Thông báo", 3000);
          return;
        }

        const revokedMessageId = getStableMessageId(message);
        const containerBeforeRevoke = messagesContainerRef.current;
        const targetBeforeRevoke = revokedMessageId
          ? document.getElementById(`chat-msg-${revokedMessageId}`) ||
            (document.querySelector(
              `[data-message-id="${revokedMessageId}"]`,
            ) as HTMLElement | null)
          : null;
        const revokeAnchor =
          containerBeforeRevoke && targetBeforeRevoke
            ? {
              messageId: revokedMessageId,
              topOffset:
                targetBeforeRevoke.getBoundingClientRect().top -
                containerBeforeRevoke.getBoundingClientRect().top,
            }
            : null;

        if (revokeAnchor) {
          scrollAnchorRef.current = revokeAnchor;
        }
        suppressAutoScrollUntilRef.current = Date.now() + 1800;
        forceScrollToBottomRef.current = false;
        wasNearBottomRef.current = false;
        isFirstLoadRef.current = false;

        const revokedResult = await MessageService.revokeMessage(
          activeConversation._id,
          message.msg_id,
          normalizedUserId,
        );

        const lastMessageSource =
          revokedResult?.systemMessage || revokedResult?.last_message;

        if (lastMessageSource) {
          const lastContent = Array.isArray(lastMessageSource.content)
            ? String(lastMessageSource.content[0] || "")
            : String(lastMessageSource.content || "");

          updateConversation(activeConversation._id, {
            last_message: {
              msg_id: String(lastMessageSource.msg_id || ""),
              sender_id: String(lastMessageSource.sender_id || ""),
              sender_name: String(lastMessageSource.sender_name || ""),
              content: lastContent,
              type: "text",
              createdAt:
                lastMessageSource.createdAt ||
                new Date().toISOString(),
            },
          });
        }

        const revokedMessagePatch = {
          ...message,
          ...revokedResult,
          content: revokedResult?.content || ["Tin nhắn đã được thu hồi"],
          is_revoked: true,
          is_deleted: Boolean(revokedResult?.is_deleted),
          is_pinned: false,
          pinned_at: null,
          pinned_by: null,
          reactions: [],
        };

        appendMessage(revokedMessagePatch);
        if (revokedResult?.systemMessage) {
          appendMessage(revokedResult.systemMessage);
        }

        window.dispatchEvent(
          new CustomEvent("chat:message-upserted", {
            detail: {
              conversationId: activeConversation._id,
              message: revokedMessagePatch,
            },
          }),
        );

        if (revokedResult?.systemMessage) {
          window.dispatchEvent(
            new CustomEvent("chat:message-upserted", {
              detail: {
                conversationId: activeConversation._id,
                message: revokedResult.systemMessage,
              },
            }),
          );
        }

        if (revokeAnchor) {
          window.requestAnimationFrame(() => {
            const container = messagesContainerRef.current;
            if (!container) return;

            const target =
              document.getElementById(`chat-msg-${revokeAnchor.messageId}`) ||
              (document.querySelector(
                `[data-message-id="${revokeAnchor.messageId}"]`,
              ) as HTMLElement | null);
            if (!target) return;

            const containerRect = container.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const nextOffset = targetRect.top - containerRect.top;
            container.scrollTop += nextOffset - revokeAnchor.topOffset;
            lastScrollTopRef.current = container.scrollTop;
            wasNearBottomRef.current = false;
            setShowScrollButton(shouldShowScrollToBottomButton(container));
          });
        }

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
        const deletedMessageId = getStableMessageId(message);
        const containerBeforeDelete = messagesContainerRef.current;
        const deleteScrollTop = containerBeforeDelete?.scrollTop ?? 0;
        const deleteAnchor =
          containerBeforeDelete && deletedMessageId
            ? (() => {
              const containerRect =
                containerBeforeDelete.getBoundingClientRect();
              const messageElements =
                containerBeforeDelete.querySelectorAll<HTMLElement>(
                  "[data-message-id]",
                );

              for (const element of Array.from(messageElements)) {
                const messageId = element.dataset.messageId || "";
                if (!messageId || messageId === deletedMessageId) continue;

                const rect = element.getBoundingClientRect();
                const isVisible =
                  rect.bottom >= containerRect.top + 8 &&
                  rect.top <= containerRect.bottom - 8;

                if (isVisible) {
                  return {
                    messageId,
                    topOffset: rect.top - containerRect.top,
                  };
                }
              }

              return null;
            })()
            : null;

        if (deleteAnchor) {
          scrollAnchorRef.current = deleteAnchor;
        }
        suppressAutoScrollUntilRef.current = Date.now() + 1800;
        forceScrollToBottomRef.current = false;
        wasNearBottomRef.current = false;
        isFirstLoadRef.current = false;

        await MessageService.deleteMessage(
          activeConversation._id,
          message.msg_id,
          normalizedUserId,
        );

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

        removeMessage({
          msg_id: message.msg_id,
          _id: message._id,
          messageId: deletedMessageId,
        });

        window.dispatchEvent(
          new CustomEvent("chat:message-upserted", {
            detail: {
              conversationId: activeConversation._id,
              message: {
                ...message,
                conversation_id: activeConversation._id,
                is_deleted: true,
              },
            },
          }),
        );

        window.requestAnimationFrame(() => {
          const container = messagesContainerRef.current;
          if (!container) return;

          if (deleteAnchor) {
            const target =
              document.getElementById(`chat-msg-${deleteAnchor.messageId}`) ||
              (document.querySelector(
                `[data-message-id="${deleteAnchor.messageId}"]`,
              ) as HTMLElement | null);

            if (target) {
              const containerRect = container.getBoundingClientRect();
              const targetRect = target.getBoundingClientRect();
              const nextOffset = targetRect.top - containerRect.top;
              container.scrollTop += nextOffset - deleteAnchor.topOffset;
            }
          } else {
            container.scrollTop = Math.min(
              deleteScrollTop,
              Math.max(0, container.scrollHeight - container.clientHeight),
            );
          }

          lastScrollTopRef.current = container.scrollTop;
          wasNearBottomRef.current = false;
          setShowScrollButton(shouldShowScrollToBottomButton(container));
        });

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
      const errorMessage = error instanceof Error ? error.message : "";
      if (
        action === "revoke" &&
        /24|thu hồi|thu hoi|revoke/i.test(errorMessage)
      ) {
        showToast(REVOKE_EXPIRED_MESSAGE, "warning", "Thông báo", 3000);
      }
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

  const shouldShowScrollToBottomButton = useCallback(
    (container: HTMLDivElement | null = messagesContainerRef.current) => {
      if (messages.length === 0) return false;
      if (!container) return false;

      const hasScrollableOverflow =
        container.scrollHeight > container.clientHeight + 8;
      if (!hasScrollableOverflow) return false;

      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      return distanceToBottom >= 100;
    },
    [messages.length],
  );

  const captureScrollAnchor = useCallback(
    (container: HTMLDivElement | null = messagesContainerRef.current) => {
      if (!container) {
        scrollAnchorRef.current = null;
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const messageElements =
        container.querySelectorAll<HTMLElement>("[data-message-id]");

      for (const element of Array.from(messageElements)) {
        const messageId = element.dataset.messageId || "";
        if (!messageId) continue;

        const rect = element.getBoundingClientRect();
        const isVisible =
          rect.bottom >= containerRect.top + 8 &&
          rect.top <= containerRect.bottom - 8;

        if (isVisible) {
          scrollAnchorRef.current = {
            messageId,
            topOffset: rect.top - containerRect.top,
          };
          return;
        }
      }

      scrollAnchorRef.current = null;
    },
    [],
  );

  const restoreScrollAnchor = useCallback(
    (container: HTMLDivElement, anchor = scrollAnchorRef.current) => {
      if (!anchor?.messageId) return false;

      const target = Array.from(
        container.querySelectorAll<HTMLElement>("[data-message-id]"),
      ).find((element) => element.dataset.messageId === anchor.messageId);

      if (!target) return false;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const nextOffset = targetRect.top - containerRect.top;
      const delta = nextOffset - anchor.topOffset;

      if (Math.abs(delta) < 1) return true;

      container.scrollTop += delta;
      lastScrollTopRef.current = container.scrollTop;
      return true;
    },
    [],
  );

  const syncScrollButtonAfterLayout = useCallback(() => {
    window.requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceToBottom < 100;

      wasNearBottomRef.current = isNearBottom;
      setShowScrollButton(shouldShowScrollToBottomButton(container));
      captureScrollAnchor(container);
    });
  }, [captureScrollAnchor, shouldShowScrollToBottomButton]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (messages.length === 0) {
      wasNearBottomRef.current = true;
      setShowScrollButton(false);
      return;
    }

    if (!container) return;
    setShowScrollButton(shouldShowScrollToBottomButton(container));
  }, [
    activeConversation._id,
    hasMoreAfter,
    messages.length,
    shouldShowScrollToBottomButton,
  ]);

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
      !isFirstLoadRef.current &&
      !isLoadingMoreRef.current &&
      !loading &&
      Date.now() > suppressTopLoadUntilRef.current
    ) {
      isLoadingMoreRef.current = true;
      console.log("📥 User scrolled to top - loading older messages");

      if (initialScrollRafRef.current !== null) {
        window.cancelAnimationFrame(initialScrollRafRef.current);
        initialScrollRafRef.current = null;
      }

      // User is intentionally reading older messages; prevent pending initial
      // bottom anchoring from snapping the viewport back to the newest message.
      isFirstLoadRef.current = false;
      wasNearBottomRef.current = false;
      forceScrollToBottomRef.current = false;
      suppressAutoScrollUntilRef.current = Date.now() + 600;

      // Save scroll height BEFORE loading
      scrollHeightRef.current = container.scrollHeight;
      scrollTopBeforeLoadMoreRef.current = container.scrollTop;

      loadOlderMessages().finally(() => {
        isLoadingMoreRef.current = false;
      });
    }

    // Symmetric behavior with top-loading: near bottom loads newer messages
    // when current list is a centered context (still has newer side).
    if (
      isNearBottom &&
      hasMoreAfter &&
      !isFirstLoadRef.current &&
      !isLoadingNewerRef.current &&
      !loading &&
      isScrollingDown &&
      Date.now() > suppressBottomLoadUntilRef.current
    ) {
      isLoadingNewerRef.current = true;
      suppressAutoScrollAfterNewerLoadRef.current = true;
      newerLoadScrollTopRef.current = currentScrollTop;
      suppressBottomLoadUntilRef.current = Date.now() + 400;

      loadMessageContextAfterLast().finally(() => {
        isLoadingNewerRef.current = false;
        setShowScrollButton(
          shouldShowScrollToBottomButton(messagesContainerRef.current),
        );
      });
    }

    // Show/hide scroll button based on scroll position
    wasNearBottomRef.current = isNearBottom;
    setShowScrollButton(shouldShowScrollToBottomButton(container));
    lastScrollTopRef.current = currentScrollTop;
    captureScrollAnchor(container);
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

  useLayoutEffect(() => {
    const composer = composerContainerRef.current;
    if (!composer || typeof ResizeObserver === "undefined") return;

    const initialComposerHeight = composer.getBoundingClientRect().height;
    lastComposerHeightRef.current = initialComposerHeight;
    setComposerHeight(initialComposerHeight);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const nextHeight =
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      const previousHeight = lastComposerHeightRef.current;
      lastComposerHeightRef.current = nextHeight;
      setComposerHeight(nextHeight);

      if (
        previousHeight === null ||
        Math.abs(nextHeight - previousHeight) < 1
      ) {
        return;
      }

      const container = messagesContainerRef.current;
      if (!container) return;

      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const shouldKeepBottom =
        distanceToBottom < 80 ||
        (wasNearBottomRef.current && distanceToBottom < 120);

      if (!shouldKeepBottom || isLoadingMoreRef.current || isLoadingNewerRef.current) {
        return;
      }

      requestAnimationFrame(() => {
        const activeContainer = messagesContainerRef.current;
        if (!activeContainer) return;
        activeContainer.scrollTop = activeContainer.scrollHeight;
        wasNearBottomRef.current = true;
        setShowScrollButton(false);
      });
    });

    observer.observe(composer);

    return () => observer.disconnect();
  }, [activeConversation._id]);

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
    const currentLastMessageId = latestStableMsgId || null;
    const previousMessageCount = prevMessageCountRef.current;
    const previousLastMessageId = prevLastMessageIdRef.current;

    // Loading newer messages below should extend the bottom only.
    // Keep the viewport anchored exactly where the user was before the fetch.
    if (suppressAutoScrollAfterNewerLoadRef.current) {
      if (newerLoadScrollTopRef.current !== null) {
        container.scrollTop = newerLoadScrollTopRef.current;
      }

      // After appending messages below, this viewport is no longer anchored to
      // the bottom. Keep later layout changes from snapping it down.
      wasNearBottomRef.current = false;
      setShowScrollButton(shouldShowScrollToBottomButton(container));
      prevMessageCountRef.current = currentMessageCount;
      prevLastMessageIdRef.current = currentLastMessageId;

      lastLayoutScrollHeightRef.current = container.scrollHeight;
      lastLayoutClientHeightRef.current = container.clientHeight;

      if (!isLoadingNewerRef.current) {
        suppressAutoScrollAfterNewerLoadRef.current = false;
        newerLoadScrollTopRef.current = null;
      }

      return;
    }

    // If we just loaded older messages, restore scroll position before any
    // initial/new-message auto-scroll can run.
    if (scrollHeightRef.current > 0 && !isLoadingMoreRef.current) {
      // Không dùng requestAnimationFrame ở đây nếu có thể,
      // vì useLayoutEffect chạy ĐỒNG BỘ trước khi paint.
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - scrollHeightRef.current;

      container.scrollTop = scrollTopBeforeLoadMoreRef.current + heightDifference;
      scrollHeightRef.current = 0; // Reset ngay lập tức
      scrollTopBeforeLoadMoreRef.current = 0;
      isFirstLoadRef.current = false;
      wasNearBottomRef.current = false;
      setShowScrollButton(shouldShowScrollToBottomButton(container));

      // Cập nhật ref để tránh logic auto-scroll xuống dưới chạy đè lên
      prevMessageCountRef.current = messages.length;
      prevLastMessageIdRef.current = currentLastMessageId;
      lastLayoutScrollHeightRef.current = container.scrollHeight;
      lastLayoutClientHeightRef.current = container.clientHeight;

      return;
    }

    if (forceScrollToBottomRef.current && messages.length > 0 && !loading) {
      if (initialScrollRafRef.current !== null) {
        window.cancelAnimationFrame(initialScrollRafRef.current);
      }

      container.scrollTop = container.scrollHeight;
      lastScrollTopRef.current = container.scrollTop;
      wasNearBottomRef.current = true;
      setShowScrollButton(false);

      initialScrollRafRef.current = window.requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        lastScrollTopRef.current = container.scrollTop;
        forceScrollToBottomRef.current = false;
        wasNearBottomRef.current = true;
        setShowScrollButton(false);
        initialScrollRafRef.current = null;
      });

      prevMessageCountRef.current = currentMessageCount;
      prevLastMessageIdRef.current = currentLastMessageId;
      return;
    }

    // First load of new conversation: jump to bottom immediately, then keep
    // the viewport pinned while images/videos finish measuring.
    if (isFirstLoadRef.current && messages.length > 0 && !loading) {
      if (initialScrollRafRef.current !== null) {
        window.cancelAnimationFrame(initialScrollRafRef.current);
      }

      container.scrollTop = container.scrollHeight;
      lastScrollTopRef.current = container.scrollTop;
      wasNearBottomRef.current = true;
      setShowScrollButton(false);

      initialScrollRafRef.current = window.requestAnimationFrame(() => {
        void (async () => {
          const initialContainer = messagesContainerRef.current;
          if (!initialContainer) {
            initialScrollRafRef.current = null;
            return;
          }

          pinMessagesToBottom({ force: true });
          keepBottomWhileMediaSettles(initialContainer);

          await waitForNextFrame();
          pinMessagesToBottom({ force: true });

          await waitForInitialMediaToSettle(initialContainer, 1800);

          const activeContainer = messagesContainerRef.current;
          if (!activeContainer) {
            initialScrollRafRef.current = null;
            return;
          }
          if (
            !isFirstLoadRef.current ||
            scrollHeightRef.current > 0 ||
            Date.now() <= suppressAutoScrollUntilRef.current
          ) {
            initialScrollRafRef.current = null;
            return;
          }

          const finalDistanceToBottom =
            activeContainer.scrollHeight -
            activeContainer.scrollTop -
            activeContainer.clientHeight;
          const shouldStayPinned =
            wasNearBottomRef.current || finalDistanceToBottom < 180;

          if (shouldStayPinned) {
            activeContainer.scrollTop = activeContainer.scrollHeight;
            await waitForNextFrame();

            const finalContainer = messagesContainerRef.current;
            if (finalContainer) {
              finalContainer.scrollTop = finalContainer.scrollHeight;
              lastScrollTopRef.current = finalContainer.scrollTop;
            }
            wasNearBottomRef.current = true;
            setShowScrollButton(false);
          } else {
            wasNearBottomRef.current = false;
            setShowScrollButton(shouldShowScrollToBottomButton(activeContainer));
          }

          isFirstLoadRef.current = false;
          prevMessageCountRef.current = currentMessageCount;
          prevLastMessageIdRef.current = currentLastMessageId;
          initialScrollRafRef.current = null;
        })();
      });

      return;
    }

    // Only auto-scroll when a brand-new message is appended at the end and user is near bottom.
    const hasAppendedNewMessage =
      currentMessageCount > previousMessageCount &&
      !!currentLastMessageId &&
      currentLastMessageId !== previousLastMessageId;

    const wasNearBottom = wasNearBottomRef.current;
    const previousDistanceToBottom =
      (lastLayoutScrollHeightRef.current || container.scrollHeight) -
      container.scrollTop -
      (lastLayoutClientHeightRef.current || container.clientHeight);
    const shouldAutoScrollNewMessage =
      previousDistanceToBottom < 96 ||
      (wasNearBottom && previousDistanceToBottom < 140);
    const isIncomingLatestMessage =
      !!latestMessageSenderId &&
      !!normalizedUserId &&
      latestMessageSenderId !== String(normalizedUserId);

    if (
      !isLoadingMoreRef.current &&
      !isLoadingNewerRef.current &&
      !loading &&
      hasAppendedNewMessage &&
      shouldAutoScrollNewMessage &&
      Date.now() > suppressAutoScrollUntilRef.current
    ) {
      requestAnimationFrame(() => {
        pinMessagesToBottom({ force: true });
        const activeContainer = messagesContainerRef.current;
        if (activeContainer) {
          keepBottomWhileMediaSettles(activeContainer);
        }
        wasNearBottomRef.current = true;
        setShowScrollButton(false); // Hide button when scrolling to bottom

        if (
          isIncomingLatestMessage &&
          latestCursorMsgId &&
          latestMessageMatchesActiveConversation
        ) {
          markMessageSeenUpTo(latestCursorMsgId, { immediate: true });
        }
        console.log("✓ Auto-scrolled to bottom (new message)");
      });
    }

    prevMessageCountRef.current = currentMessageCount;
    prevLastMessageIdRef.current = currentLastMessageId;

  }, [
    messages.length,
    latestStableMsgId,
    latestCursorMsgId,
    latestMessageMatchesActiveConversation,
    latestMessageSenderId,
    loading,
    markMessageSeenUpTo,
    normalizedUserId,
    shouldShowScrollToBottomButton,
    keepBottomWhileMediaSettles,
    pinMessagesToBottom,
    waitForInitialMediaToSettle,
    waitForNextFrame,
  ]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const previousAnchor = scrollAnchorRef.current;
    const previousHeight = lastLayoutScrollHeightRef.current;
    const previousClientHeight = lastLayoutClientHeightRef.current;
    const currentHeight = container.scrollHeight;
    const currentClientHeight = container.clientHeight;
    const heightChanged = previousHeight > 0 && currentHeight !== previousHeight;
    const clientHeightChanged =
      previousClientHeight > 0 && currentClientHeight !== previousClientHeight;

    if (heightChanged || clientHeightChanged) {
      const previousDistanceToBottom =
        (previousHeight || currentHeight) -
        container.scrollTop -
        (previousClientHeight || currentClientHeight);
      const currentDistanceToBottom =
        currentHeight - container.scrollTop - currentClientHeight;
      const shouldKeepBottom =
        previousDistanceToBottom < 96 ||
        currentDistanceToBottom < 72 ||
        (wasNearBottomRef.current && previousDistanceToBottom < 120);

      if (
        shouldKeepBottom &&
        !isLoadingMoreRef.current &&
        !isLoadingNewerRef.current &&
        !isFirstLoadRef.current &&
        !forceScrollToBottomRef.current &&
        !suppressAutoScrollAfterNewerLoadRef.current &&
        Date.now() > suppressAutoScrollUntilRef.current
      ) {
        container.scrollTop = container.scrollHeight;
        lastScrollTopRef.current = container.scrollTop;
        wasNearBottomRef.current = true;
        setShowScrollButton(false);
      } else if (
        !isLoadingMoreRef.current &&
        !isLoadingNewerRef.current &&
        !isFirstLoadRef.current &&
        !forceScrollToBottomRef.current &&
        !suppressAutoScrollAfterNewerLoadRef.current &&
        Date.now() > suppressAutoScrollUntilRef.current &&
        previousAnchor
      ) {
        restoreScrollAnchor(container, previousAnchor);
        const nextDistanceToBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        wasNearBottomRef.current = nextDistanceToBottom < 100;
        setShowScrollButton(shouldShowScrollToBottomButton(container));
      }
    }

    lastLayoutScrollHeightRef.current = container.scrollHeight;
    lastLayoutClientHeightRef.current = container.clientHeight;
    captureScrollAnchor(container);

    if (heightChanged || clientHeightChanged) {
      syncScrollButtonAfterLayout();
    }
  });

  // AI Smart Replies Logic
  useEffect(() => {
    let cancelled = false;
    const clearSmartReplyLoadingTimer = () => {
      if (smartReplyLoadingTimerRef.current !== null) {
        window.clearTimeout(smartReplyLoadingTimerRef.current);
        smartReplyLoadingTimerRef.current = null;
      }
    };

    if (isDissolved) {
      clearSmartReplyLoadingTimer();
      setSmartReplies([]);
      setIsSmartReplyLoading(false);
      setIsSmartReplyOpen(false);
      setSummaryResult(null);
      lastSmartReplyMessageIdRef.current = null;
      return () => {
        cancelled = true;
      };
    }

    const source = latestSmartReplySource;
    const smartReplySourceKey = source?.key || "";

    if (loading || messages.length === 0 || !source || !smartReplySourceKey) {
      clearSmartReplyLoadingTimer();
      setSmartReplies([]);
      setIsSmartReplyLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const isEligibleIncomingSmartReplySource =
      Boolean(source) &&
      Boolean(normalizedUserId) &&
      Boolean(smartReplySourceKey) &&
      String(source?.senderId || "") !== String(normalizedUserId) &&
      (source?.type === "text" || source?.type === "link");
    const shouldFetchSmartReplies =
      isEligibleIncomingSmartReplySource &&
      smartReplySourceKey !== lastSmartReplyMessageIdRef.current;

    if (shouldFetchSmartReplies) {
      const cachedReplies = smartReplyCacheRef.current.get(smartReplySourceKey);
      if (cachedReplies) {
        lastSmartReplyMessageIdRef.current = smartReplySourceKey;
        clearSmartReplyLoadingTimer();
        setSmartReplies(cachedReplies);
        setIsSmartReplyLoading(false);
        setIsSmartReplyOpen(false);
        return () => {
          cancelled = true;
        };
      }

      setSmartReplies([]);
      setIsSmartReplyOpen(false);
      clearSmartReplyLoadingTimer();

      const fetchSuggestions = async () => {
        lastSmartReplyMessageIdRef.current = smartReplySourceKey;
        setIsSmartReplyLoading(true);

        try {
          const aiConvId = activeConversation._id.startsWith("VIRTUAL_CONV_")
            ? activeConversation._id.replace("VIRTUAL_CONV_", "")
            : activeConversation._id;

          const suggestions = await AiService.getSmartReplies(
            aiConvId,
            normalizedUserId,
            {
              conversationType: activeConversation.type,
              limit: activeConversation.type === "group" ? 18 : 12,
            },
          );
          if (!cancelled) {
            const nextSuggestions = suggestions || [];
            smartReplyCacheRef.current.set(smartReplySourceKey, nextSuggestions);
            setSmartReplies(nextSuggestions);
          }
        } catch (error) {
          console.error("Error fetching smart replies:", error);
        } finally {
          clearSmartReplyLoadingTimer();
          if (!cancelled) {
            setIsSmartReplyLoading(false);
          }
        }
      };

      void fetchSuggestions();
    } else if (!isEligibleIncomingSmartReplySource) {
      clearSmartReplyLoadingTimer();
      setSmartReplies([]);
      setIsSmartReplyLoading(false);
    }

    return () => {
      cancelled = true;
      clearSmartReplyLoadingTimer();
    };
  }, [
    activeConversation._id,
    activeConversation.type,
    isDissolved,
    latestSmartReplySource,
    loading,
    messages.length,
    normalizedUserId,
  ]);

  // Tự động đóng gợi ý khi chuyển cuộc hội thoại
  useEffect(() => {
    setIsSmartReplyOpen(false);
    setSmartReplies([]);
    setIsSmartReplyLoading(false);
    if (smartReplyLoadingTimerRef.current !== null) {
      window.clearTimeout(smartReplyLoadingTimerRef.current);
      smartReplyLoadingTimerRef.current = null;
    }
    lastSmartReplyMessageIdRef.current = null;
  }, [activeConversation._id]);

  const handleSelectSmartReply = (reply: string) => {
    setSmartReplies([]);
    window.dispatchEvent(
      new CustomEvent("chat:send-smart-reply", { detail: { text: reply } }),
    );
  };

  const handleSummarize = async () => {
    if (isDissolved || !normalizedUserId || isSummarizingRef.current) return;

    isSummarizingRef.current = true;
    setIsSummarizing(true);

    try {
      const aiConvId = activeConversation._id.startsWith("VIRTUAL_CONV_")
        ? activeConversation._id.replace("VIRTUAL_CONV_", "")
        : activeConversation._id;

      const summary = await AiService.summarizeConversation(
        aiConvId,
        normalizedUserId,
        {
          limit: activeConversation.type === "group" ? 100 : 60,
        },
      );
      setSummaryResult(summary);
    } catch (error) {
      console.error("Summarization error:", error);
    } finally {
      isSummarizingRef.current = false;
      setIsSummarizing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (seenMarkTimerRef.current !== null) {
        window.clearTimeout(seenMarkTimerRef.current);
        seenMarkTimerRef.current = null;
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
        mediaMessageId?: string;
        imageIndex?: number;
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
          const msgId =
            custom.detail.mediaMessageId || custom.detail.messageId;
          handleOpenMedia(msgId, custom.detail.imageIndex ?? 0);
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
    const getTypingPayloadValue = (payload: any, keys: string[]) => {
      for (const key of keys) {
        const value = payload?.[key];
        if (value !== undefined && value !== null && String(value).trim()) {
          return String(value).trim();
        }
      }
      return "";
    };

    const getTypingKey = (conversationId: string, userId: string) =>
      `${conversationId}:${userId}`;

    const clearTypingTimer = (typingKey: string) => {
      const timerId = typingExpiryTimersRef.current.get(typingKey);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        typingExpiryTimersRef.current.delete(typingKey);
      }
    };

    const markTyping = (conversationId: string, userId: string) => {
      if (!conversationId || !userId) return;

      const typingKey = getTypingKey(conversationId, userId);
      const timestamp = Date.now();

      setTypingUserIds((prev) => ({
        ...prev,
        [typingKey]: timestamp,
      }));

      clearTypingTimer(typingKey);
      const timerId = window.setTimeout(() => {
        setTypingUserIds((prev) => {
          if (prev[typingKey] !== timestamp) return prev;
          const next = { ...prev };
          delete next[typingKey];
          return next;
        });
        typingExpiryTimersRef.current.delete(typingKey);
      }, TYPING_TTL_MS);

      typingExpiryTimersRef.current.set(typingKey, timerId);
    };

    const unmarkTyping = (conversationId: string, userId: string) => {
      if (!conversationId || !userId) return;
      const typingKey = getTypingKey(conversationId, userId);
      clearTypingTimer(typingKey);

      setTypingUserIds((prev) => {
        if (!prev[typingKey]) return prev;
        const next = { ...prev };
        delete next[typingKey];
        return next;
      });
    };

    const handleTypingStart = (payload: any) => {
      const conversationId = getTypingPayloadValue(payload, [
        "conversationId",
        "conversation_id",
        "roomId",
      ]);
      const userId = getTypingPayloadValue(payload, [
        "userId",
        "user_id",
        "senderId",
        "sender_id",
      ]);

      if (
        !conversationId ||
        !userId ||
        String(userId) === String(normalizedUserId || "")
      ) {
        return;
      }

      markTyping(conversationId, userId);
    };

    const handleTypingStop = (payload: any) => {
      const conversationId = getTypingPayloadValue(payload, [
        "conversationId",
        "conversation_id",
        "roomId",
      ]);
      const userId = getTypingPayloadValue(payload, [
        "userId",
        "user_id",
        "senderId",
        "sender_id",
      ]);

      if (!conversationId || !userId) return;
      unmarkTyping(conversationId, userId);
    };

    socketService.onTyping(handleTypingStart);
    socketService.onTypingStopped(handleTypingStop);

    return () => {
      socketService.offTyping(handleTypingStart);
      socketService.offTypingStopped(handleTypingStop);
    };

  }, [
    normalizedUserId,
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

  const pinnedBar = primaryPinnedMessage ? (
    <div className="shrink-0 bg-[#F2F4F7] px-2 pt-2 sm:px-4">
      <div ref={pinnedMenuRef} className="relative w-full">
        <div className="relative w-full rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm">
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
  ) : null;

  const isChatOverlayOpen =
    confirmModal.isOpen ||
    removedMessageNotice.isOpen ||
    replacePinModalOpen ||
    forwardModalOpen ||
    Boolean(callBlockModal) ||
    isGroupCallModalOpen ||
    Boolean(summaryResult) ||
    viewerOpen;

  return (
    <div className="relative flex h-full min-w-0 flex-1 overflow-hidden">
      {/* Main Chat Area */}
      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F2F4F7] transition-all duration-300">
        <ChatHeader
          conversation={activeConversation}
          currentUserId={normalizedUserId}
          onBackToList={onBackToList}
          onStartVoiceCall={() => openCallWindow("voice")}
          onStartVideoCall={() => openCallWindow("video")}
          disableCallActions={
            isOpeningCall ||
            isPendingGroupCallStart ||
            (activeConversation?.type === "group" && Boolean(activeConversation.is_calling))
          }
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          onSummarize={isDissolved ? undefined : handleSummarize}
          isSummarizing={isSummarizing}
          canShowPrivatePresence={canShowPrivatePresence}
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



        {pinnedBar}

        <div
          ref={messagesContainerRef}
          className="custom-scrollbar relative flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-2 pb-2 pt-2 sm:px-4"
          style={{
            ["overflowAnchor" as any]: "none",
          }}
          onScroll={handleScroll}
          onMouseDown={() => markLatestMessageSeen(true)}
          onTouchStart={() => markLatestMessageSeen(true)}
          onWheel={() => markLatestMessageSeen(true)}
        >
          {!isInitialLoading && <div className="flex-1 min-h-0" />}

          {/* Loading indicator for older messages */}
          {loading && messages.length > 0 && (
            <div className="flex justify-center py-1">
              <div
                className="animate-shimmer h-6 w-24 rounded-full"
                style={messageLoadingShimmerStyle}
              />
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
            <MessageLoadingSkeleton />
          ) : isDissolved ? (
            <div className="flex h-full items-center justify-center px-5 py-10 animate-fade-in">
              <div className="flex w-full max-w-[360px] flex-col items-center text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
                  <Info size={22} strokeWidth={2.2} />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <h3 className="text-[20px] font-bold leading-tight text-slate-900">
                    Nhóm đã được giải tán
                  </h3>
                  <p className="max-w-[310px] text-[14px] leading-6 text-slate-500">
                    Cuộc trò chuyện đã đóng. Bạn không thể xem lại lịch sử tin nhắn, không thể gửi tin mới.
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
                  className="mt-6 inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-[14px] font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                >
                  <Trash2 size={15} />
                  Xóa lịch sử trò chuyện
                </button>
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

                    {shouldCollapseGroup &&
                      isExpanded && (
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
              const prevIsSequenceBoundary =
                isSystemLikeType(prevMsg?.type) || isPollMessageType(prevMsg?.type);
              const nextIsSequenceBoundary =
                isSystemLikeType(nextMsg?.type) || isPollMessageType(nextMsg?.type);
              const nextShowTime = nextMsg
                ? shouldShowTimestamp(nextMsg.createdAt || "", msg.createdAt)
                : false;
              const firstUserMessageIndex = hydratedMessages.findIndex(
                (message) =>
                  !isSystemLikeType(message.type) &&
                  !isPollMessageType(message.type),
              );
              const isTopBoundary = index === firstUserMessageIndex;
              const isMe = msg.sender_id === normalizedUserId;
              const isFirstInSequence =
                !prevMsg || prevIsSequenceBoundary ||
                prevMsg.sender_id !== msg.sender_id ||
                item.showTime;
              const isLastInSequence =
                !nextMsg || nextIsSequenceBoundary ||
                nextMsg.sender_id !== msg.sender_id ||
                nextShowTime;
              const stableMessageId = String(
                msg.msg_id || msg._id || msg.local_client_id || "",
              ).trim();
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
                        __show_delivery_status:
                          isMe &&
                          Boolean(stableMessageId) &&
                          stableMessageId === latestOwnMessageId,
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
                      onRecallCall={handleRecallFromCallMessage}
                      disableRecallCall={disableGroupRecallCall}
                      conversation={messageConversation}
                    />
                  </div>
                </React.Fragment>
              );
            })
          )}

          {typingUsers.length > 0 && !isInvited && (
            <div className="flex items-center  gap-2 mt-1 mb-1 pl-0.5">
              <Avatar
                src={typingUsers[0].avatar ? getFullUrl(typingUsers[0].avatar) : ""}
                name={typingUsers[0].name}
                size={32}
                className="border border-white/80 bg-slate-300 shadow-sm hover:scale-100 active:scale-100"
              />

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
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && !isChatOverlayOpen && (
          <button
            onClick={scrollToBottom}
            className="absolute left-1/2 z-[65] -translate-x-1/2 rounded-full bg-primary-500 p-3 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-primary-600"
            style={{ bottom: Math.max(composerHeight + 18, 112) }}
            title="Scroll to bottom"
          >
            <ChevronDown size={24} strokeWidth={2} />
          </button>
        )}

        {isParticipant && !isDissolved && !isInvited && relationshipStatus?.status !== "BLOCKED" ? (
          <>
            <div
              ref={composerContainerRef}
              className="relative border-t border-slate-100 bg-white"
            >
              <div className="w-full">
                <ChatInput
                  key={
                    activeConversation.type === 'private' ||
                      activeConversation._id.startsWith('VIRTUAL_CONV_')
                      ? (activeConversation._id.startsWith('VIRTUAL_CONV_')
                        ? activeConversation._id.replace('VIRTUAL_CONV_', '')
                        : (activeConversation.participants?.find(p => String(p.user_id || (p as any)._id) !== String(normalizedUserId))?.user_id || activeConversation._id))
                      : activeConversation._id
                  }
                  conversationId={activeConversation._id}
                  senderId={normalizedUserId || ""}
                  onSendSuccess={handleSendSuccess}
                  onUploadStart={handleImageSendStart}
                  onUploadProgress={handleImageSendProgress}
                  onUploadSuccess={handleImageSendSuccess}
                  onUploadError={handleImageSendError}
                  onConversationCreated={(newConv) => {
                    const createdConversation = newConv as any;
                    window.dispatchEvent(new CustomEvent("chat:open-conversation", {
                      detail: {
                        conversationId: createdConversation.conversation?._id || createdConversation._id,
                        conversation: createdConversation.conversation || createdConversation
                      }
                    }));
                  }}
                  replyToMessage={replyToMessage}
                  onCancelReply={() => setReplyToMessage(null)}
                  conversationType={activeConversation?.type}
                  smartReplies={smartReplies}
                  smartReplyContextKey={latestSmartReplySource?.key || ""}
                  isSmartReplyLoading={isSmartReplyLoading}
                  isSmartReplyOpen={isSmartReplyOpen}
                  onSmartReplyToggle={() => setIsSmartReplyOpen((open) => !open)}
                  onSmartReplyClose={() => setIsSmartReplyOpen(false)}
                  onSmartReplySelect={(reply) => {
                    handleSelectSmartReply(reply);
                    setIsSmartReplyOpen(false);
                  }}
                />
              </div>
            </div>
          </>
        ) : isDissolved ? null : (
          <div className="px-5 py-4 bg-white border-t border-slate-100">
            <div
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${relationshipStatus?.status === "BLOCKED"
                ? "border-primary-100 bg-primary-50 text-primary-600"
                : "border-slate-100 bg-slate-50 text-slate-500"
                }`}
            >
              {relationshipStatus?.status === "BLOCKED" ? (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600"
                >
                  <Info size={18} strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <AlertTriangle size={18} />
                </div>
              )}
              <p className="text-[14px] font-semibold">
                {relationshipStatus?.status === "BLOCKED"
                  ? ((relationshipStatus.requester_id === normalizedUserId || relationshipStatus.requesterId === normalizedUserId)
                    ? "Bạn đã chặn người dùng này. Bỏ chặn để tiếp tục trò chuyện."
                    : "Bạn không thể gửi tin nhắn cho người dùng này.")
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

      {activeConversation?._id && normalizedUserId && (
        <GroupCallModal
          isOpen={isGroupCallModalOpen}
          onClose={() => setIsGroupCallModalOpen(false)}
          onStart={handleGroupCallStart}
          conversationId={activeConversation._id}
          currentUserId={normalizedUserId}
        />
      )}

      {!isDissolved && (
        <ConfirmModal
          isOpen={!!summaryResult}
          title="Tóm tắt hội thoại (AI)"
          message={
            <div className="py-2 text-left">
              <div className="max-h-[60vh] space-y-4 overflow-y-auto rounded-2xl border border-primary-100 bg-white p-5 shadow-inner">
                {summaryResult?.summary.split("\n").map((line, index) => {
                  const cleanLine = line.trim();
                  if (!cleanLine) return null;
                  const isBullet = cleanLine.startsWith("-") || cleanLine.startsWith("*");

                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${isBullet ? "pl-2" : ""}`}
                    >
                      {isBullet ? (
                        <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400 shadow-sm" />
                      ) : (
                        <div className="mt-1 flex-shrink-0 rounded-lg bg-primary-50 p-1.5 text-primary-600 shadow-sm">
                          <Sparkles size={14} />
                        </div>
                      )}
                      <p
                        className={`text-sm leading-relaxed ${isBullet ? "text-gray-700" : "font-medium text-gray-800"}`}
                      >
                        {cleanLine.replace(/^[-*]\s*/, "")}
                      </p>
                    </div>
                  );
                })}

                {summaryResult?.meta?.hasImportantContent !== false && summaryResult?.highlights?.length ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mb-2 text-[12px] font-bold uppercase text-slate-500">
                      Ý chính
                    </div>
                    <div className="space-y-2">
                      {summaryResult.highlights.map((item, index) => (
                        <div key={`highlight-${index}`} className="flex items-start gap-2">
                          <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                          <p className="text-sm leading-relaxed text-slate-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {summaryResult?.meta?.hasImportantContent !== false && summaryResult?.actionItems?.length ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                    <div className="mb-2 text-[12px] font-bold uppercase text-amber-700">
                      Việc cần làm
                    </div>
                    <div className="space-y-2">
                      {summaryResult.actionItems.map((item, index) => (
                        <div
                          key={`action-${index}`}
                          className="text-sm leading-relaxed text-slate-700"
                        >
                          <span className="font-semibold text-slate-800">
                            {item.owner || "Chưa rõ"}:{" "}
                          </span>
                          {item.task}
                          {item.due ? (
                            <span className="text-amber-700"> ({item.due})</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {summaryResult?.meta?.hasImportantContent !== false && summaryResult?.questions?.length ? (
                  <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                    <div className="mb-2 text-[12px] font-bold uppercase text-sky-700">
                      Cần làm rõ
                    </div>
                    <div className="space-y-2">
                      {summaryResult.questions.map((item, index) => (
                        <p
                          key={`question-${index}`}
                          className="text-sm leading-relaxed text-slate-700"
                        >
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          }
          confirmText="Đóng"
          hideCancelButton
          maxWidthClassName="max-w-lg"
          onConfirm={() => setSummaryResult(null)}
          onCancel={() => setSummaryResult(null)}
        />
      )}
    </div>
  );
};

export default ChatArea;
