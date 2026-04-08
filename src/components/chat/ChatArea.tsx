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
} from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { useConversations } from "../../contexts/ConversationsContext";
import { useChat } from "../../hooks/useChat";
import { primeMessageSenderCache } from "../../hooks/useMessageSender";
import { MessageService, ParticipantService } from "../../services";
import type { ChatAreaProps } from "../../interfaces";

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

// Utils
import {
  shouldShowTimestamp,
  formatChatTimestamp,
  getConversationDisplayName,
  getFullUrl,
  getFileNameFromUrl,
} from "../../utils";
import { MediaViewer } from "./ChatMessage/MediaViewer";
import type { Message } from "../../types";

interface ExtendedChatAreaProps extends ChatAreaProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const ChatArea: React.FC<ExtendedChatAreaProps> = ({
  conversation,
  isSidebarOpen = false,
  onToggleSidebar,
}) => {
  const { currentUser } = useUser();
  const { conversations, updateConversation, updateParticipant } =
    useConversations();

  const normalizedUserId = currentUser?.user_id || currentUser?._id;

  const activeConversation = useMemo(() => {
    const matched = conversations.find(
      (item) => item.conversation._id === conversation?._id,
    )?.conversation;
    return matched || conversation;
  }, [conversations, conversation]);

  const {
    messages,
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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "revoke" | "delete" | null;
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

  // State quản lý Media Viewer & Tin nhắn
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinnedMenu, setShowPinnedMenu] = useState(false);
  const [replacePinModalOpen, setReplacePinModalOpen] = useState(false);
  const [pendingPinMessage, setPendingPinMessage] = useState<Message | null>(
    null,
  );
  const pinnedMenuRef = useRef<HTMLDivElement>(null);

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

  const getConversationName = () => {
    return getConversationDisplayName(activeConversation, normalizedUserId);
  };

  const loadPinnedMessages = useCallback(async () => {
    if (!activeConversation?._id) {
      setPinnedMessages([]);
      return;
    }

    try {
      const list = await MessageService.getPinnedMessages(
        activeConversation._id,
      );
      const normalized = (Array.isArray(list) ? list : [])
        .filter((msg) => msg?.is_pinned)
        .sort(
          (a, b) =>
            new Date(b.pinned_at || b.createdAt || 0).getTime() -
            new Date(a.pinned_at || a.createdAt || 0).getTime(),
        )
        .slice(0, 3);
      setPinnedMessages(normalized);
    } catch {
      setPinnedMessages([]);
    }
  }, [activeConversation?._id]);

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

    return rawContent || "Tin nhắn";
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
        const participant = (activeConversation?.participants || []).find(
          (item) => String(item.user_id || item._id || "") === senderId,
        );

        const preferredName =
          (participant?.nickname || "").trim() ||
          (msg.sender_name || "").trim();

        if (preferredName) return preferredName;
      }

      const participant = (activeConversation?.participants || []).find(
        (item) => String(item.user_id || item._id || "") === senderId,
      );

      return (
        participant?.nickname ||
        participant?.display_name ||
        participant?.name ||
        "Thành viên"
      );
    },
    [activeConversation?.participants, normalizedUserId],
  );

  const jumpToPinnedMessage = useCallback(
    (msg: Message) => {
      if (!msg?.msg_id || !activeConversation?._id) return;
      setShowPinnedMenu(false);
      window.dispatchEvent(
        new CustomEvent("chat:jump", {
          detail: {
            conversationId: activeConversation._id,
            messageId: msg.msg_id,
            highlight: true,
          },
        }),
      );
    },
    [activeConversation?._id],
  );

  const primaryPinnedMessage = pinnedMessages[0] || null;
  const morePinnedCount = Math.max(0, pinnedMessages.length - 1);

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

  const openCallWindow = (
    type: "voice" | "video",
    action: "start" | "join" = "start",
  ) => {
    if (!activeConversation?._id) return;

    const params = new URLSearchParams({
      conversationId: activeConversation._id,
      type,
      action,
      name: getConversationName(),
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

    if (!msg.msg_id || !activeConversation?._id) return;

    window.dispatchEvent(
      new CustomEvent("chat:jump", {
        detail: {
          conversationId: activeConversation._id,
          messageId: msg.msg_id,
          highlight: false,
        },
      }),
    );
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
      if (!conversationId || !messageId) return;
      if (conversationId !== activeConversation?._id) return;

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

      if (!targetElement) return;

      centerTargetInContainer(targetElement);
      await waitForNextFrame();
      if (targetElement.isConnected) {
        centerTargetInContainer(targetElement);
      }

      if (!highlight) return;

      await waitForTargetVisible(targetElement);
      if (!targetElement.isConnected) return;

      applyJumpHighlight(targetElement);
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

  const handleSendSuccess = useCallback(async () => {
    forceScrollToBottomRef.current = true;
    await loadMessages();

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
  }, [loadMessages]);

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

  const handlePinMessage = async (msg: Message) => {
    if (!activeConversation?._id || !normalizedUserId || !msg.msg_id) return;

    const isPinAction = !Boolean(msg.is_pinned);

    if (isPinAction && pinnedMessages.length >= 3) {
      setPendingPinMessage(msg);
      setReplacePinModalOpen(true);
      return;
    }

    try {
      await MessageService.pinMessage(
        activeConversation._id,
        msg.msg_id,
        normalizedUserId,
        isPinAction,
      );
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

      // Fallback: pinnedMessages might be stale/not loaded yet.
      // If backend says limit reached, force-open replace modal.
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

      await MessageService.pinMessage(
        activeConversation._id,
        pendingPinMessage.msg_id,
        normalizedUserId,
        true,
      );

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
      if (action === "revoke") {
        await MessageService.revokeMessage(
          activeConversation._id,
          message.msg_id,
          normalizedUserId,
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
                type:
                  previousMessage.type === "system_add"
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

    // If there are still messages below current context, jump back to latest 20.
    if (hasMoreAfter && !loading) {
      await handleSendSuccess();
      return;
    }

    container.scrollTop = container.scrollHeight;
    await waitForNextFrame();
    container.scrollTop = container.scrollHeight;
    wasNearBottomRef.current = true;
    setShowScrollButton(false);
  }, [handleSendSuccess, hasMoreAfter, loading, waitForNextFrame]);

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
      }>;

      jumpToMessage(
        custom.detail?.conversationId,
        custom.detail?.messageId,
        custom.detail?.highlight ?? true,
      );

      // Open media viewer if requested (e.g., from pinned messages)
      if (custom.detail?.openMedia) {
        const msgId = custom.detail.messageId;
        handleOpenMedia(msgId, 0);
      }
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
        />

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
              className="shrink-0 full sticky top-0 -mx-4 px-2 w-[calc(100%+2.5rem)] z-50 "
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
                  <div className="absolute right-2 top-[calc(100%+8px)] z-40 w-[320px] rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
                    {pinnedMessages.slice(1).map((item) => (
                      <div
                        key={item._id || item.msg_id}
                        className="w-full rounded-md px-2.5 py-2 text-left text-slate-800 hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-2">
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
                            <div className="text-[13px] text-slate-800 pr-2 flex items-center gap-2 min-w-0">
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
          {!hasMore && messages.length > 0 && (
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
          ) : messages.length === 0 ? (
            <ChatEmpty />
          ) : (
            messages.map((msg, index) => {
              const isSystemMsg = msg.type?.startsWith("system_");
              const isMe = msg.sender_id === normalizedUserId;
              const prevMsg = messages[index - 1];
              const nextMsg = messages[index + 1];
              const prevIsSystem = prevMsg?.type?.startsWith("system_");
              const nextIsSystem = nextMsg?.type?.startsWith("system_");
              const firstUserMessageIndex = messages.findIndex(
                (item) => !item.type?.startsWith("system_"),
              );
              const isTopBoundary = index === firstUserMessageIndex;

              const showTime = shouldShowTimestamp(
                msg.createdAt || "",
                prevMsg?.createdAt,
              );
              const nextShowTime = nextMsg
                ? shouldShowTimestamp(nextMsg.createdAt || "", msg.createdAt)
                : false;

              const isFirstInSequence =
                !prevMsg ||
                prevIsSystem ||
                prevMsg.sender_id !== msg.sender_id ||
                showTime;
              const isLastInSequence =
                !nextMsg ||
                nextIsSystem ||
                nextMsg.sender_id !== msg.sender_id ||
                nextShowTime;

              // Nội dung hiển thị cho thông báo hệ thống
              const notificationContent = msg.content?.[0] + "";

              return (
                <React.Fragment key={msg._id || index}>
                  {showTime && (
                    <ChatTimeSeparator
                      time={formatChatTimestamp(msg.createdAt || "")}
                    />
                  )}

                  <div
                    id={`chat-msg-${msg.msg_id || msg._id}`}
                    data-message-id={String(msg.msg_id || msg._id)}
                  >
                    {isSystemMsg ? (
                      <ChatNotification
                        type={msg.type}
                        content={notificationContent}
                      />
                    ) : (
                      <ChatMessage
                        msg={msg}
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
                      />
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed right-6 bottom-32 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-40"
              title="Scroll to bottom"
            >
              <ChevronDown size={24} strokeWidth={2} />
            </button>
          )}
        </div>

        <ChatInput
          conversationId={activeConversation._id}
          senderId={normalizedUserId || ""}
          onSendSuccess={handleSendSuccess}
          replyToMessage={replyToMessage}
          onCancelReply={() => setReplyToMessage(null)}
        />
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
        confirmText={confirmModal.action === "revoke" ? "Thu Hồi" : "Xóa"}
        cancelText="Hủy"
        isDangerous={confirmModal.action === "delete"}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({
            isOpen: false,
            action: null,
            message: null,
          })
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
    </div>
  );
};

export default ChatArea;
