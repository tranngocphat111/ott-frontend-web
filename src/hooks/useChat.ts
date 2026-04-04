import { useState, useEffect, useCallback } from "react";
import { MessageService, socketService } from "../services";
import type { Message } from "../interfaces";

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "http://localhost:5000/api";

export const useChat = (conversationId: string, userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Reset messages khi đổi conversation, tránh dùng tin nhắn cũ
  useEffect(() => {
    setMessages([]);
    setHasMore(true);
  }, [conversationId]);

  /**
   * Load initial messages (last 20 from Redis cache)
   * Use new REST API with Redis caching
   */
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${CHAT_API_URL}/conversations/${conversationId}/messages`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log(
          `✓ Loaded ${data.messageCount} messages (source: ${data.source})`
        );
        setMessages(data.messages || []);
        // If loaded 20 messages, likely more exist
        setHasMore(data.messageCount === 20);
      } else {
        console.error("Error loading messages:", data.error);
      }
    } catch (error) {
      console.error("Load tin nhắn thất bại:", error);
      // Fallback to old method if new API fails
      try {
        const data = await MessageService.getMessages(conversationId, userId);
        setMessages(data);
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId]);

  /**
   * Load older messages (pagination - scroll up)
   */
  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || messages.length === 0 || !hasMore) return;

    // Get oldest message (by msg_id, since we use Snowflake)
    const oldestMessage = messages[0];
    const beforeMsgId = oldestMessage.msg_id; // Use msg_id instead of timestamp!

    try {
      console.log("📥 Loading older messages...");
      setLoading(true);

      const response = await fetch(
        `${CHAT_API_URL}/conversations/${conversationId}/messages/older?before=${beforeMsgId}&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log(`✓ Loaded ${data.messageCount} older messages`);
        // Prepend older messages
        setMessages((prev) => [...(data.messages || []), ...prev]);
        setHasMore(data.hasMore || false);
      } else {
        console.error("Error loading older messages:", data.error);
      }
    } catch (error) {
      console.error("Load older messages failed:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, messages, hasMore]);

  /**
   * Handle new message from Socket.IO
   */
  const handleNewMessage = useCallback(
    (msg: any) => {
      const msgConvId = msg.conversation_id?.toString() || msg.conversationId;
      if (msgConvId !== conversationId) return;

      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m: any) => m._id === msg._id || m.msg_id === msg.msg_id))
          return prev;
        return [...prev, msg];
      });
    },
    [conversationId]
  );

  /**
   * Handle message edited
   */
  const handleMessageEdited = useCallback(
    (payload: any) => {
      if (payload.conversationId !== conversationId) return;

      setMessages((prev) =>
        prev.map((message: any) => {
          if (message._id === payload.messageId) {
            return {
              ...message,
              text: payload.text,
              isEdited: payload.isEdited,
              editedAt: payload.editedAt,
            };
          }
          return message;
        })
      );
    },
    [conversationId]
  );

  /**
   * Handle message deleted
   */
  const handleMessageDeleted = useCallback(
    (payload: any) => {
      if (payload.conversationId !== conversationId) return;

      setMessages((prev) =>
        prev.filter((message: any) => message._id !== payload.messageId)
      );
    },
    [conversationId]
  );

  /**
   * Handle reaction update
   */
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
        })
      );
    },
    [conversationId]
  );

  useEffect(() => {
    loadMessages();
    socketService.joinConversation(conversationId);
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageReaction(handleReactionUpdate);

    // Add new event listeners for edit/delete
    if (socketService.socket) {
      socketService.socket.on("tin_nhan_da_chinh_sua", handleMessageEdited);
      socketService.socket.on("tin_nhan_da_xoa", handleMessageDeleted);
    }

    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offMessageReaction(handleReactionUpdate);

      if (socketService.socket) {
        socketService.socket.off("tin_nhan_da_chinh_sua", handleMessageEdited);
        socketService.socket.off("tin_nhan_da_xoa", handleMessageDeleted);
      }
    };
  }, [
    conversationId,
    loadMessages,
    handleNewMessage,
    handleReactionUpdate,
    handleMessageEdited,
    handleMessageDeleted,
  ]);

  return { messages, loadMessages, loadOlderMessages, loading, hasMore };
};
