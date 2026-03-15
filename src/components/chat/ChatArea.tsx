// src/components/Chat/ChatArea.tsx
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useConversations } from "../../contexts/ConversationsContext";
import { useChat } from "../../hooks/useChat";
import { ParticipantService } from "../../services";
import type { ChatAreaProps } from "../../interfaces";

// Components
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatEmpty } from "./ChatEmpty";
import { ChatMessage } from "./ChatMessage";
import { ChatNotification } from "./ChatNotification";
import { ChatTimeSeparator } from "./ChatTimeSeparator";

// Utils
import { shouldShowTimestamp, formatChatTimestamp } from "../../utils";
import { MediaViewer } from "./ChatMessage/MediaViewer";

const ChatArea: React.FC<ChatAreaProps> = ({ conversation }) => {
  const { currentUser } = useUser();
  const { updateParticipant } = useConversations();
  const { messages, loadMessages } = useChat(conversation?._id, currentUser?._id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMarkedRef = useRef<string>("0");

  // Reset khi chuyển conversation
  useEffect(() => {
    lastMarkedRef.current = "0";
  }, [conversation?._id]);

  // Đánh dấu đã đọc khi có tin nhắn mới hoặc khi messages được load xong
  // KHÔNG dùng conversation?._id làm dep để tránh chạy với messages cũ của conversation trước
  // (React effects chạy theo thứ tự đăng ký: useChat's setMessages([]) schedule re-render nhưng
  //  chưa apply ngay, nên nếu dep có conversation._id thì effect này chạy với messages stale)
  useEffect(() => {
    if (!messages.length || !currentUser?._id || !conversation?._id) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg.msg_id) return;
    if (lastMsg.msg_id === lastMarkedRef.current) return;

    // Optimistic update: cập nhật UI ngay lập tức, không chờ API
    lastMarkedRef.current = lastMsg.msg_id;
    updateParticipant(conversation._id, {
      last_read_message_id: lastMsg.msg_id,
    });

    // Lưu vào localStorage làm fallback (hoạt động ngay cả khi API lỗi)
    localStorage.setItem(`read_${conversation._id}_${currentUser._id}`, lastMsg.msg_id);

    // Gọi API để lưu xuống DB (fire-and-forget)
    ParticipantService.markAsRead(conversation._id, currentUser._id, lastMsg.msg_id)
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // --- 🔥 3. THÊM STATE QUẢN LÝ MEDIA VIEWER ---
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

  // --- 🔥 4. THÊM HÀM MỞ VIEWER ---
  const handleOpenMedia = (msgId: string) => {
    setSelectedMediaId(msgId);
    setViewerOpen(true);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-[#F2F4F7] h-full overflow-hidden">
      {/* Header */}
      <ChatHeader conversation={conversation} />

      {/* Danh sách tin nhắn */}
      <div className="flex-1 p-4 gap-2 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex-1 min-h-0" />

        {messages.length === 0 ? (
          <ChatEmpty />
        ) : (
          messages.map((msg, index) => {
            const isSystemMsg = msg.type?.startsWith("system_");
            const isMe = msg.sender_id === currentUser?._id;

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

            return (
              <React.Fragment key={msg._id}>
                {/* A. Dòng thời gian */}
                {showTime && (
                  <ChatTimeSeparator
                    time={formatChatTimestamp(msg.createdAt || "")}
                  />
                )}

                {/* B. Nội dung tin nhắn */}
                {isSystemMsg ? (
                  <ChatNotification
                    type={msg.type}
                    content={msg.content[0]}
                  />
                ) : (
                  <ChatMessage
                    msg={msg}
                    isMe={isMe}
                    isFirstInSequence={isFirstInSequence}
                    isLastInSequence={isLastInSequence}
                    // 🔥 5. TRUYỀN HÀM MỞ MODAL XUỐNG DƯỚI
                    onMediaClick={() => handleOpenMedia(msg._id)}
                  />
                )}
              </React.Fragment>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Ô nhập liệu */}
      <ChatInput
        conversationId={conversation._id}
        senderId={currentUser?._id || ""}
        onSendSuccess={loadMessages}
      />

      {/* 🔥 6. RENDER MEDIA VIEWER Ở CUỐI CÙNG */}
      {viewerOpen && (
        <MediaViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          initialMessageId={selectedMediaId}
          messages={messages}
        />
      )}
    </div>
  );
};

export default ChatArea;
