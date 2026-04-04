// src/components/Chat/ChatArea.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { useConversations } from "../../contexts/ConversationsContext";
import { useChat } from "../../hooks/useChat";
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

// Utils
import { shouldShowTimestamp, formatChatTimestamp } from "../../utils";
import { getConversationDisplayName } from "../../utils";
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
  const { conversations, updateParticipant } = useConversations();

  // Ưu tiên lấy ID đồng nhất
  const normalizedUserId = currentUser?.user_id || currentUser?._id;

  // Logic từ bản develop: Luôn đồng bộ dữ liệu hội thoại mới nhất từ context
  const activeConversation = useMemo(() => {
    const matched = conversations.find(
      (item) => item.conversation._id === conversation?._id,
    )?.conversation;
    return matched || conversation;
  }, [conversations, conversation]);

  const { messages, loadMessages, loadOlderMessages, loading, hasMore } = useChat(
    activeConversation?._id,
    normalizedUserId,
  );

  const [isOpeningCall, setIsOpeningCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMarkedRef = useRef<string>("0");
  const isLoadingMoreRef = useRef(false);
  const scrollHeightRef = useRef(0);
  const isFirstLoadRef = useRef(true); // Track if this is first load for this conversation

  // State quản lý Media Viewer & Tin nhắn
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

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

    // Immediately clear unread when entering a conversation
    updateParticipant(activeConversation._id, { unread_count: 0 });
  }, [activeConversation?._id, updateParticipant]);

  useEffect(() => {
    if (!messages.length || !normalizedUserId || !activeConversation?._id)
      return;

    // Mark ALL visible messages as read (including our own)
    // This is correct because we're viewing them
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg.msg_id || lastMsg.msg_id === lastMarkedRef.current) return;

    lastMarkedRef.current = lastMsg.msg_id;

    console.log(`📖 Marking conversation as read up to msg_id: ${lastMsg.msg_id}`);

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
    ).then(updated => {
      console.log(`✓ Backend confirmed read status update:`, updated);
    }).catch(error => {
      console.error(`✗ Failed to mark as read:`, error);
    });
  }, [messages, normalizedUserId, activeConversation?._id, updateParticipant]);

  const handleOpenMedia = (msgId: string, imageIndex: number = 0) => {
    setSelectedMediaId(msgId);
    setSelectedImageIndex(imageIndex);
    setViewerOpen(true);
  };

  const handleReplyMessage = (msg: Message) => setReplyToMessage(msg);

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

  /**
   * Handle scroll to load older messages (infinite scroll)
   */
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if user scrolled to top (100px threshold)
    if (
      container.scrollTop < 100 &&
      hasMore &&
      !isLoadingMoreRef.current &&
      !loading
    ) {
      isLoadingMoreRef.current = true;
      console.log("📥 User scrolled to top - loading older messages");

      // Save scroll height BEFORE loading
      scrollHeightRef.current = container.scrollHeight;

      loadOlderMessages().finally(() => {
        isLoadingMoreRef.current = false;
      });
    }

    // Show/hide scroll button based on scroll position
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
    setShowScrollButton(false);
  };

  /**
   * Restore scroll position after loading older messages
   * Auto-scroll to bottom on first load for new conversation (BEFORE render visible)
   * Auto-scroll to bottom when new messages arrive
   * Use useLayoutEffect to scroll before browser paint
   */
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // First load of new conversation: scroll to bottom BEFORE render
    if (isFirstLoadRef.current && messages.length > 0 && !loading) {
      console.log("✓ First load: scrolling to bottom (before render)");

      // Use requestAnimationFrame to ensure DOM is fully calculated
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        isFirstLoadRef.current = false;
      });
      return;
    }

    // If we just loaded older messages, restore scroll position
    if (scrollHeightRef.current > 0 && !isLoadingMoreRef.current) {
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const heightDifference = newScrollHeight - scrollHeightRef.current;
        container.scrollTop = heightDifference;
        scrollHeightRef.current = 0;
        console.log("✓ Scroll position restored");
      });
      return;
    }

    // Auto-scroll to bottom when new messages arrive (always scroll)
    if (!isLoadingMoreRef.current && !loading) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        setShowScrollButton(false); // Hide button when scrolling to bottom
        console.log("✓ Auto-scrolled to bottom (new message)");
      });
    }
  }, [messages, loading]);

  useEffect(() => {
    const applySubtleHighlight = (container: HTMLElement) => {
      const highlightTarget =
        (container.firstElementChild as HTMLElement | null) || container;

      highlightTarget.classList.add(
        "rounded-2xl",
        "bg-primary-50/70",
        "shadow-sm",
        "transition-all",
        "duration-500",
      );

      window.setTimeout(() => {
        highlightTarget.classList.remove(
          "rounded-2xl",
          "bg-primary-50/70",
          "shadow-sm",
          "transition-all",
          "duration-500",
        );
      }, 1300);
    };

    const jumpToMessage = (conversationId: string, messageId: string) => {
      if (!conversationId || !messageId) return;
      if (conversationId !== activeConversation?._id) return;

      const targetElement = document.getElementById(`chat-msg-${messageId}`);
      if (!targetElement) return;

      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      applySubtleHighlight(targetElement);
    };

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{
        conversationId: string;
        messageId: string;
      }>;

      jumpToMessage(custom.detail?.conversationId, custom.detail?.messageId);
    };

    window.addEventListener("chat:jump", handler as EventListener);
    return () => {
      window.removeEventListener("chat:jump", handler as EventListener);
    };
  }, [activeConversation?._id]);

  useEffect(() => {
    const applySubtleHighlight = (container: HTMLElement) => {
      const highlightTarget =
        (container.firstElementChild as HTMLElement | null) || container;

      highlightTarget.classList.add(
        "rounded-2xl",
        "bg-primary-50/70",
        "shadow-sm",
        "transition-all",
        "duration-500",
      );

      window.setTimeout(() => {
        highlightTarget.classList.remove(
          "rounded-2xl",
          "bg-primary-50/70",
          "shadow-sm",
          "transition-all",
          "duration-500",
        );
      }, 1300);
    };

    const rawTarget = sessionStorage.getItem("chat_jump_target");
    if (!rawTarget) return;

    try {
      const target = JSON.parse(rawTarget) as {
        conversationId?: string;
        messageId?: string;
      };

      if (target.conversationId !== activeConversation?._id || !target.messageId) {
        return;
      }

      const timer = window.setTimeout(() => {
        const element = document.getElementById(`chat-msg-${target.messageId}`);
        if (!element) return;

        element.scrollIntoView({ behavior: "smooth", block: "center" });
        applySubtleHighlight(element);
        sessionStorage.removeItem("chat_jump_target");
      }, 120);

      return () => window.clearTimeout(timer);
    } catch {
      sessionStorage.removeItem("chat_jump_target");
    }
  }, [messages, activeConversation?._id]);

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
          className="flex-1 p-4 gap-2 overflow-y-auto custom-scrollbar flex flex-col relative"
          onScroll={handleScroll}
        >
          <div className="flex-1 min-h-0" />

          {/* Loading indicator for older messages */}
          {loading && <div className="text-center text-sm text-gray-500">Đang tải tin nhắn cũ...</div>}

          {/* No more messages indicator */}
          {!hasMore && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <div className="text-sm text-gray-400">
                Đây là tin nhắn đầu tiên của cuộc trò chuyện
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <ChatEmpty />
          ) : (
            messages.map((msg, index) => {
              const isSystemMsg = msg.type?.startsWith("system_");
              const isMe = msg.sender_id === normalizedUserId;
              const prevMsg = messages[index - 1];
              const nextMsg = messages[index + 1];

              const showTime = shouldShowTimestamp(
                msg.createdAt || "",
                prevMsg?.createdAt,
              );
              const nextShowTime = nextMsg
                ? shouldShowTimestamp(nextMsg.createdAt || "", msg.createdAt)
                : false;

              const isFirstInSequence =
                !prevMsg || prevMsg.sender_id !== msg.sender_id || showTime;
              const isLastInSequence =
                !nextMsg || nextMsg.sender_id !== msg.sender_id || nextShowTime;

              // Nội dung hiển thị cho thông báo hệ thống
              const notificationContent = msg.content?.[0] + "";

              return (
                <React.Fragment key={msg._id || index}>
                  {showTime && (
                    <ChatTimeSeparator
                      time={formatChatTimestamp(msg.createdAt || "")}
                    />
                  )}

                  <div id={`chat-msg-${msg._id}`}>
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
                        onMediaClick={(imageIndex) =>
                          handleOpenMedia(msg._id, imageIndex)
                        }
                        onReply={handleReplyMessage}
                        onReact={handleReactMessage}
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
          onSendSuccess={loadMessages}
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
          initialMessageId={selectedMediaId}
          initialImageIndex={selectedImageIndex}
          messages={messages}
        />
      )}
    </div>
  );
};

export default ChatArea;
