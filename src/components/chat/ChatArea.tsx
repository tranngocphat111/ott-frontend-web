import React, { useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { ChatInput } from "./ChatInput";
import { ChatEmpty } from "./ChatEmpty";
import { ChatHeader } from "./ChatHeader";
import type { ChatAreaProps } from "../../interfaces";
import { useChat } from "../../hooks/useChat";
import { ChatNotification } from "./ChatNotification";
import { ChatMessage } from "./ChatMessage";

const ChatArea: React.FC<ChatAreaProps> = ({ conversation }) => {
  const { currentUser } = useUser();
  const { messages, loadMessages } = useChat(conversation?._id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-[#F2F4F7] h-full overflow-hidden">
      <ChatHeader conversation={conversation} />

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

            const isFirstInSequence =
              !prevMsg ||
              prevMsg.sender_id !== msg.sender_id ||
              prevMsg.type?.startsWith("system_");

            const isLastInSequence =
              !nextMsg ||
              nextMsg.sender_id !== msg.sender_id ||
              nextMsg.type?.startsWith("system_");

            if (isSystemMsg) {
              return (
                <ChatNotification
                  key={msg._id}
                  type={msg.type}
                  content={msg.content[0]}
                />
              );
            }

            return (
              <ChatMessage
                key={msg._id}
                msg={msg}
                isMe={isMe}
                isFirstInSequence={isFirstInSequence}
                isLastInSequence={isLastInSequence}
              />
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        conversationId={conversation._id}
        senderId={currentUser?._id || ""}
        onSendSuccess={loadMessages}
      />
    </div>
  );
};

export default ChatArea;
