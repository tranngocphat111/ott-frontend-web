import { useState, useEffect, useCallback } from "react";
import { MessageService, socketService } from "../services";
import type { Message } from "../interfaces";

export const useChat = (conversationId: string, userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const data = await MessageService.getMessages(conversationId, userId);
      setMessages(data);
    } catch (error) {
      console.error("Load tin nhắn thất bại:", error);
    }
  }, [conversationId, userId]);

  const handleNewMessage = (msg: any) => {
    const msgConvId = msg.conversation_id || msg.conversationId;

    if (msgConvId === conversationId) {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    }
  };

  useEffect(() => {
    loadMessages();

    socketService.joinConversation(conversationId);

    socketService.onNewMessage(handleNewMessage);

    return () => socketService.offNewMessage(handleNewMessage);
  }, [conversationId, loadMessages]);

  return { messages, loadMessages };
};
