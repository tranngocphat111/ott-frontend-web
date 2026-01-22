import React, { useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import { ChatHeader } from "./ChatHeader"; // <--- Import cái này
import type { ChatAreaProps } from "../../interfaces";
import { useChat } from "../../hooks/useChat";
import { ChatNotification } from "./ChatNotification";
import { MessageItem } from "./MessageItem";

const ChatArea: React.FC<ChatAreaProps> = ({ conversation }) => {
  const { currentUser } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sendMessage } = useChat(
    conversation?._id,
    currentUser?._id,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation?._id) return <div className="flex-1 bg-[#F2F4F7]" />;

  return (
    <div className="flex-1 flex flex-col bg-[#F2F4F7] h-full overflow-hidden">
      {/* Khôi phục Header bằng Component mới */}
      <ChatHeader conversation={conversation} />

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, index) => {
            const isSystemMsg = msg.type?.startsWith("system_");
            const isMe = msg.sender_id === currentUser?._id;

            if (isSystemMsg) {
              return (
                <ChatNotification
                  key={msg._id || index}
                  type={msg.type}
                  content={msg.content}
                />
              );
            }

            return <MessageItem key={msg._id || index} msg={msg} isMe={isMe} />;
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={sendMessage} />
    </div>
  );
};

export default ChatArea;
