// src/components/Chat/ChatArea.tsx
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useConversations } from "../../contexts/ConversationsContext"; // Giữ từ bản 2
import { useChat } from "../../hooks/useChat";
import { ParticipantService } from "../../services"; // Giữ từ bản 2
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
  const { updateParticipant } = useConversations(); // Logic "Đã xem"
  const { messages, loadMessages } = useChat(
    conversation?._id,
    currentUser?._id
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMarkedRef = useRef<string>("0"); // Logic "Đã xem"

  // --- STATE QUẢN LÝ MEDIA VIEWER (Merge cả 2 bản) ---
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // Giữ từ bản 1

  // --- LOGIC ĐÁNH DẤU ĐÃ ĐỌC (Bản 2) ---
  useEffect(() => {
    lastMarkedRef.current = "0";
  }, [conversation?._id]);

  useEffect(() => {
    if (!messages.length || !currentUser?._id || !conversation?._id) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg.msg_id) return;
    if (lastMsg.msg_id === lastMarkedRef.current) return;

    // Optimistic update
    lastMarkedRef.current = lastMsg.msg_id;
    updateParticipant(conversation._id, {
      last_read_message_id: lastMsg.msg_id,
    });

    // Fallback localStorage
    localStorage.setItem(`read_${conversation._id}_${currentUser._id}`, lastMsg.msg_id);

    // Gọi API
    ParticipantService.markAsRead(conversation._id, currentUser._id, lastMsg.msg_id)
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // --- HÀM MỞ VIEWER (Merge: nhận msgId và index) ---
  const handleOpenMedia = (msgId: string, imageIndex: number = 0) => {
    setSelectedMediaId(msgId);
    setSelectedImageIndex(imageIndex);
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
                  <ChatNotification type={msg.type} content={msg.content[0]} />
                ) : (
                  <ChatMessage
                    msg={msg}
                    isMe={isMe}
                    isFirstInSequence={isFirstInSequence}
                    isLastInSequence={isLastInSequence}
                    onMediaClick={(imageIndex) =>
                      handleOpenMedia(msg._id, imageIndex)
                    }
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

      {/* Media Viewer - Giữ đầy đủ props từ cả 2 bản */}
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