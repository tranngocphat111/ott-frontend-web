import { useState, useEffect, useCallback, useRef } from "react";
import { MessageService, socketService } from "../services";
import type { Message } from "../interfaces";

const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL || "http://localhost:5000/api";

const getRevokedReplyContent = () => ["Tin nhắn đã được thu hồi"];

export const useChat = (conversationId: string, userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreAfter, setHasMoreAfter] = useState(false);
  const messagesRef = useRef<Message[]>([]);

  const compareMessageIds = useCallback((left: string, right: string) => {
    try {
      const leftId = BigInt(left);
      const rightId = BigInt(right);
      if (leftId === rightId) return 0;
      return leftId > rightId ? 1 : -1;
    } catch {
      if (left === right) return 0;
      return left > right ? 1 : -1;
    }
  }, []);

  const getMessageStableId = useCallback((message: any) => {
    return String(message?.msg_id || message?._id || "").trim();
  }, []);

  const normalizeMessageOrder = useCallback(
    (list: any[]): Message[] => {
      if (!Array.isArray(list) || list.length === 0) return [];

      const byId = new Map<string, any>();
      const withoutId: any[] = [];

      list.forEach((item) => {
        const stableId = getMessageStableId(item);
        if (!stableId) {
          withoutId.push(item);
          return;
        }
        byId.set(stableId, item);
      });

      const withId = Array.from(byId.values()).sort((a, b) => {
        const leftId = getMessageStableId(a);
        const rightId = getMessageStableId(b);
        return compareMessageIds(leftId, rightId);
      });

      return [...withId, ...withoutId] as Message[];
    },
    [compareMessageIds, getMessageStableId],
  );

  const normalizeIncomingMessage = useCallback((payload: any) => {
    if (!payload) return null;

    if (typeof payload === "object") {
      if (payload.result && typeof payload.result === "object") {
        return payload.result;
      }

      if (payload.message && typeof payload.message === "object") {
        return payload.message;
      }
    }

    return payload;
  }, []);

  const appendMessage = useCallback(
    (payload: any) => {
      const normalized = normalizeIncomingMessage(payload) as
        | (Message & { _id?: string; msg_id?: string; conversationId?: string })
        | null;
      if (!normalized) return;

      const msgConvId = String(
        normalized.conversation_id || normalized.conversationId || "",
      );
      if (msgConvId && msgConvId !== String(conversationId || "")) return;

      setMessages((prev) => {
        const incomingMsgId = String(normalized.msg_id || normalized._id || "");
        if (
          incomingMsgId &&
          prev.some(
            (item: Message & { _id?: string; msg_id?: string }) =>
              String(item.msg_id || item._id || "") === incomingMsgId,
          )
        ) {
          return prev;
        }

        const nextMessages = [...prev, normalized as Message];

        messagesRef.current = nextMessages;
        return nextMessages;
      });
    },
    [conversationId, normalizeIncomingMessage],
  );

  // Reset messages khi đổi conversation, tránh dùng tin nhắn cũ
  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    setHasMoreAfter(false);
  }, [conversationId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Load initial messages (last 20 from Redis cache)
   * Use new REST API with Redis caching
   */
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const listUrl = userId
        ? `${CHAT_API_URL}/conversations/${conversationId}/messages?userId=${encodeURIComponent(userId)}`
        : `${CHAT_API_URL}/conversations/${conversationId}/messages`;

      const response = await fetch(listUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log(
          `✓ Loaded ${data.messageCount} messages (source: ${data.source})`,
        );
        const nextMessages = normalizeMessageOrder(data.messages || []);
        messagesRef.current = nextMessages;
        setMessages(nextMessages);
        // Do not hard-stop by visible count (it may be <20 due to deleted_for filtering).
        // Keep loading enabled while we still have any message anchor to request older pages.
        setHasMore(nextMessages.length > 0);
        setHasMoreAfter(false);
      } else {
        console.error("Error loading messages:", data.error);
      }
    } catch (error) {
      console.error("Load tin nhắn thất bại:", error);
      // Fallback to old method if new API fails
      try {
        const data = await MessageService.getMessages(conversationId, userId);
        const nextMessages = normalizeMessageOrder(data || []);
        messagesRef.current = nextMessages;
        setMessages(nextMessages);
        setHasMoreAfter(false);
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
  const loadOlderMessages = useCallback(
    async (force = false) => {
      const currentMessages = messagesRef.current;

      if (
        !conversationId ||
        currentMessages.length === 0 ||
        (!hasMore && !force)
      ) {
        return false;
      }

      // Get oldest message (by msg_id, since we use Snowflake)
      const oldestMessage = currentMessages[0];
      const beforeMsgId = oldestMessage.msg_id; // Use msg_id instead of timestamp!

      try {
        console.log("📥 Loading older messages...");
        setLoading(true);

        const response = await fetch(
          `${CHAT_API_URL}/conversations/${conversationId}/messages/older?before=${beforeMsgId}&limit=20${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (data.success) {
          console.log(`✓ Loaded ${data.messageCount} older messages`);
          // Prepend older messages
          setMessages((prev) => {
            const nextMessages = normalizeMessageOrder([
              ...(data.messages || []),
              ...prev,
            ]);
            messagesRef.current = nextMessages;
            return nextMessages;
          });
          setHasMore(data.hasMore || false);
          return (data.messages || []).length > 0;
        } else {
          console.error("Error loading older messages:", data.error);
        }
      } catch (error) {
        console.error("Load older messages failed:", error);
        return false;
      } finally {
        setLoading(false);
      }
      return false;
    },
    [conversationId, messages, hasMore, userId],
  );

  const loadMessageContext = useCallback(
    async (messageId: string, before = 20, after = 20) => {
      if (!conversationId || !messageId) return false;

      try {
        const data = await MessageService.getMessageContext(
          conversationId,
          messageId,
          userId,
          before,
          after,
        );

        if (!data?.success) return false;

        const nextMessages = normalizeMessageOrder(data.messages || []);
        messagesRef.current = nextMessages;
        setMessages(nextMessages);
        setHasMore(Boolean(data.hasMoreBefore ?? nextMessages.length > 0));
        setHasMoreAfter(Boolean(data.hasMoreAfter));
        return nextMessages.length > 0;
      } catch (error) {
        console.error("Load message context failed:", error);
        return false;
      }
    },
    [conversationId, userId],
  );

  const loadMessageContextAfterLast = useCallback(async () => {
    if (!conversationId) {
      return {
        appendedCount: 0,
        hasMoreAfter: false,
      };
    }

    const currentMessages = messagesRef.current;
    const lastMessage = currentMessages[currentMessages.length - 1] as
      | (Message & { _id?: string; msg_id?: string })
      | undefined;
    const anchorId = String(lastMessage?.msg_id || lastMessage?._id || "");

    if (!anchorId) {
      return {
        appendedCount: 0,
        hasMoreAfter: false,
      };
    }

    try {
      const data = await MessageService.getMessageContext(
        conversationId,
        anchorId,
        userId,
        0,
        20,
      );

      if (!data?.success) {
        return {
          appendedCount: 0,
          hasMoreAfter: false,
        };
      }

      const candidateMessages = (data.messages || []) as Array<
        Message & { _id?: string; msg_id?: string }
      >;

      const newerMessages = candidateMessages.filter((message) => {
        const messageId = String(message.msg_id || message._id || "");
        if (!messageId || messageId === anchorId) return false;
        return compareMessageIds(messageId, anchorId) > 0;
      });

      let appendedCount = 0;

      if (newerMessages.length > 0) {
        setMessages((prev) => {
          const existed = new Set(
            prev.map((item: Message & { _id?: string; msg_id?: string }) =>
              String(item.msg_id || item._id || ""),
            ),
          );

          const appendable = newerMessages.filter((item) => {
            const itemId = String(item.msg_id || item._id || "");
            if (!itemId || existed.has(itemId)) return false;
            existed.add(itemId);
            return true;
          });

          appendedCount = appendable.length;
          if (appendable.length === 0) return prev;

          const nextMessages = normalizeMessageOrder([...prev, ...appendable]);
          messagesRef.current = nextMessages;
          return nextMessages;
        });
      }

      const nextHasMoreAfter = Boolean(data.hasMoreAfter);
      setHasMoreAfter(nextHasMoreAfter);
      return {
        appendedCount,
        hasMoreAfter: nextHasMoreAfter,
      };
    } catch (error) {
      console.error("Load newer message context failed:", error);
      return {
        appendedCount: 0,
        hasMoreAfter: false,
      };
    }
  }, [compareMessageIds, conversationId, normalizeMessageOrder, userId]);

  /**
   * Handle new message from Socket.IO
   */
  const handleNewMessage = useCallback(
    (msg: any) => {
      appendMessage(msg);
    },
    [appendMessage],
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
        }),
      );
    },
    [conversationId],
  );

  /**
   * Handle message deleted
   */
  const handleMessageDeleted = useCallback(
    (payload: any) => {
      const payloadConvId =
        payload.conversation_id?.toString() || payload.conversationId;

      if (payloadConvId !== conversationId) return;

      setMessages((prev) =>
        prev
          .filter(
            (message: any) =>
              message._id !== payload.messageId &&
              message.msg_id !== payload.msg_id,
          )
          .map((message: any) => {
            const replyTargetId =
              message.reply_to_msg_id || message.reply_to?.msg_id;

            if (replyTargetId !== payload.msg_id) {
              return message;
            }

            return {
              ...message,
              reply_to: {
                ...(message.reply_to || {}),
                msg_id: payload.msg_id,
                is_deleted: true,
                is_revoked: false,
              },
            };
          }),
      );
    },
    [conversationId],
  );

  const handleMessageRevoked = useCallback(
    (payload: any) => {
      const payloadConvId =
        payload.conversation_id?.toString() || payload.conversationId;

      if (payloadConvId !== conversationId) return;

      setMessages((prev) =>
        prev.map((message: any) => {
          const replyTargetId =
            message.reply_to_msg_id || message.reply_to?.msg_id;

          if (
            message.msg_id !== payload.msg_id &&
            message._id !== payload._id &&
            replyTargetId !== payload.msg_id
          ) {
            return message;
          }

          if (replyTargetId === payload.msg_id) {
            return {
              ...message,
              reply_to: {
                ...(message.reply_to || {}),
                msg_id: payload.msg_id,
                is_revoked: true,
                is_deleted: false,
                content: getRevokedReplyContent()[0],
              },
            };
          }

          return {
            ...message,
            content: payload.content || ["Tin nhắn đã được thu hồi"],
            is_revoked: true,
            reactions: [],
          };
        }),
      );
    },
    [conversationId],
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
        }),
      );
    },
    [conversationId],
  );

  const handleMessagePin = useCallback(
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
            is_pinned: !!payload.is_pinned,
            pinned_at: payload.pinned_at || null,
            pinned_by: payload.pinned_by || null,
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

    // Add new event listeners for edit/delete/revoke
    const socket = socketService.getSocket();
    if (socket) {
      socket.on("tin_nhan_da_chinh_sua", handleMessageEdited);
      socket.on("tin_nhan_da_xoa", handleMessageDeleted);
      socket.on("tin_nhan_thu_hoi", handleMessageRevoked);
      socket.on("tin_nhan_pin", handleMessagePin);
    }

    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offMessageReaction(handleReactionUpdate);

      const socket = socketService.getSocket();
      if (socket) {
        socket.off("tin_nhan_da_chinh_sua", handleMessageEdited);
        socket.off("tin_nhan_da_xoa", handleMessageDeleted);
        socket.off("tin_nhan_thu_hoi", handleMessageRevoked);
        socket.off("tin_nhan_pin", handleMessagePin);
      }
    };
  }, [
    conversationId,
    loadMessages,
    handleNewMessage,
    handleReactionUpdate,
    handleMessageEdited,
    handleMessageDeleted,
    handleMessageRevoked,
    handleMessagePin,
  ]);

  return {
    messages,
    appendMessage,
    loadMessages,
    loadOlderMessages,
    loadMessageContext,
    loadMessageContextAfterLast,
    loading,
    hasMore,
    hasMoreAfter,
  };
};
