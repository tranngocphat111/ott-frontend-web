// src/components/Chat/ChatArea.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

  const { messages, loadMessages } = useChat(
    activeConversation?._id,
    normalizedUserId,
  );

  const [isOpeningCall, setIsOpeningCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMarkedRef = useRef<string>("0");

  // State quản lý Media Viewer & Tin nhắn
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

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
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!messages.length || !normalizedUserId || !activeConversation?._id)
      return;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg.msg_id || lastMsg.msg_id === lastMarkedRef.current) return;

    lastMarkedRef.current = lastMsg.msg_id;

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
    ).catch(console.error);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

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

        <div className="flex-1 p-4 gap-2 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex-1 min-h-0" />

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
