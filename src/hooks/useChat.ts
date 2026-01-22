import { useState, useEffect, useCallback } from "react";
import { MessageService, socketService } from "../services";
import type { Message } from "../interfaces";

export const useChat = (conversationId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Hàm load tin nhắn
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await MessageService.getMessages(conversationId);
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (error) {
      console.error("❌ Load messages failed:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    loadMessages();

    // Join room ngay khi vào chat
    socketService.joinConversation(conversationId);

    // Handler xử lý tin nhắn mới
    const handleNewMessage = (newMessage: any) => {
      console.log("📨 Socket nhận tin mới:", newMessage);

      const msgConvId = newMessage.conversation_id || newMessage.conversationId;

      // Kiểm tra trùng ID hội thoại
      if (msgConvId === conversationId) {
        setMessages((prev) => {
          const isExisted = prev.some((m) => m._id === newMessage._id);
          if (isExisted) return prev;
          return [...prev, newMessage];
        });
      }
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.offNewMessage(handleNewMessage);
    };
  }, [conversationId, loadMessages]);

  return { messages, loading, loadMessages };
};
