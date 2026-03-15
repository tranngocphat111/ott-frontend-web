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

  const handleNewMessage = useCallback((msg: any) => {
    const msgConvId = msg.conversation_id?.toString() || msg.conversationId;
    if (msgConvId !== conversationId) return;

    setMessages(prev => {
      if (prev.some((m: any) => m._id === msg._id || m.msg_id === msg.msg_id)) return prev;
      return [...prev, msg];
    });
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
    socketService.joinConversation(conversationId);
    socketService.onNewMessage(handleNewMessage);
    return () => socketService.offNewMessage(handleNewMessage);
  }, [conversationId, loadMessages, handleNewMessage]);

  return { messages, loadMessages };
};
