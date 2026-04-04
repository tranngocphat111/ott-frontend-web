import { useState, useEffect, useCallback } from "react";
import { MessageService, socketService } from "../services";
import type { Message } from "../interfaces";

export const useChat = (conversationId: string, userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

  // Reset messages khi đổi conversation, tránh dùng tin nhắn cũ
  useEffect(() => {
    setMessages([]);
  }, [conversationId]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const data = await MessageService.getMessages(conversationId, userId);
      setMessages(data);
    } catch (error) {
      console.error("Load tin nhắn thất bại:", error);
    }
  }, [conversationId, userId]);

  const handleNewMessage = useCallback(
    (msg: any) => {
      const msgConvId = msg.conversation_id?.toString() || msg.conversationId;
      if (msgConvId !== conversationId) return;

      setMessages((prev) => {
        if (prev.some((m: any) => m._id === msg._id || m.msg_id === msg.msg_id))
          return prev;
        return [...prev, msg];
      });
    },
    [conversationId],
  );

  const handleReactionUpdate = useCallback(
    (payload: any) => {
      const payloadConvId =
        payload.conversation_id?.toString() || payload.conversationId;

      if (payloadConvId !== conversationId) return;

      setMessages((prev) =>
        prev.map((message: any) => {
          if (
            message.msg_id !== payload.msg_id &&
            message._id !== payload._id
          ) {
            return message;
          }

          return {
            ...message,
            reactions: payload.reactions || [],
          };
        }),
      );
    },
    [conversationId],
  );

  useEffect(() => {
    loadMessages();
    socketService.joinConversation(conversationId);
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageReaction(handleReactionUpdate);
    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offMessageReaction(handleReactionUpdate);
    };
  }, [conversationId, loadMessages, handleNewMessage, handleReactionUpdate]);

  return { messages, loadMessages };
};
