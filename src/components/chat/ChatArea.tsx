// src/components/Chat/ChatArea.tsx
import React, { useEffect, useRef, useState } from "react"; // 1. Thêm useState
import { useUser } from "../../contexts/UserContext";
import { useChat } from "../../hooks/useChat";
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
  const { messages, loadMessages } = useChat(conversation?._id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
