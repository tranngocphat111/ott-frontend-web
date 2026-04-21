// src/contexts/ConversationsContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type {
  Conversation,
  ConversationWithParticipant,
  Category,
  Participant,
  ConversationParticipant,
} from "../types";
import { ConversationService, CategoryService, socketService } from "../services";
import { useUser } from "./UserContext";

interface ConversationsContextType {
  // State
  conversations: ConversationWithParticipant[];
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Actions
  setConversations: (conversations: ConversationWithParticipant[]) => void;
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Update methods
  updateConversation: (
    conversationId: string,
    updates: Partial<Conversation>,
  ) => void;
  updateParticipant: (
    conversationId: string,
    updates: Partial<Participant>,
  ) => void;
  updateConversationParticipant: (
    conversationId: string,
    userId: string,
    updates: Partial<ConversationParticipant>,
  ) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;

  addCategory: (category: Category) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  removeCategory: (categoryId: string) => void;

  // Refresh from API
  refreshConversations: (userId: string) => Promise<void>;
}

const ConversationsContext = createContext<
  ConversationsContextType | undefined
>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export const ConversationsProvider: React.FC<ConversationsProviderProps> = ({
  children,
}) => {
  const [conversations, setRawConversations] = useState<
    ConversationWithParticipant[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Memory check for dissolved groups in current session to prevent F5 flicker/revert
  const [dissolvedSessionIds, setDissolvedSessionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDoneRef = useRef<string | null>(null);
  const { isAuthenticated, currentUser: user } = useUser();

  // Helper to apply dissolution logic to any incoming conversations array
  const applyDissolutionLogic = useCallback((
    newConversations: ConversationWithParticipant[],
    currentUserId: string,
    dissolvedIds: Set<string>
  ) => {
    return newConversations
      .filter((newItem) => {
        // If it was dissolved by current user in this session, filter it out for owner
        const ownerId = String(newItem.conversation.created_by || "");
        const isOwner = ownerId === currentUserId ||
          (user as any)?._id === ownerId ||
          (user as any)?.user_id === ownerId;
        return !(isOwner && dissolvedIds.has(newItem.conversation._id));
      })
      .map((newItem) => {
        const convId = newItem.conversation._id;
        const isCurrentlyDissolved = dissolvedIds.has(convId) ||
          newItem.conversation.status === "dissolved" ||
          newItem.conversation.is_dissolved;

        if (isCurrentlyDissolved) {
          return {
            ...newItem,
            conversation: {
              ...newItem.conversation,
              status: "dissolved",
              is_dissolved: true
            }
          };
        }
        return newItem;
      });
  }, [user]);

  const setConversations = useCallback((value: ConversationWithParticipant[] | ((prev: ConversationWithParticipant[]) => ConversationWithParticipant[])) => {
    setRawConversations((prevRaw) => {
      const currentUserId = String(
        (user as { user_id?: string; _id?: string } | null)?.user_id ||
        (user as { user_id?: string; _id?: string } | null)?._id ||
        "",
      ).trim();

      const nextConversations = typeof value === 'function' ? value(prevRaw) : value;
      return applyDissolutionLogic(nextConversations, currentUserId, dissolvedSessionIds);
    });
  }, [user, dissolvedSessionIds, applyDissolutionLogic]);

  // Update specific conversation
  const updateConversation = useCallback(
    (conversationId: string, updates: Partial<Conversation>) => {
      setConversations((prev) =>
        prev.map((item) =>
          item.conversation._id === conversationId ?
            { ...item, conversation: { ...item.conversation, ...updates } }
            : item,
        ),
      );
    },
    [],
  );

  // --- LOGIC UPDATE PARTICIPANT (Merged từ develop) ---
  const updateParticipant = useCallback(
    (conversationId: string, updates: Partial<Participant>) => {
      setConversations((prev) =>
        prev.map((item) => {
          if (item.conversation._id !== conversationId) return item;

          const mergedParticipant = { ...item.participant, ...updates };

          // Logic đồng bộ Unread Count dựa trên last_read_message_id
          if (
            updates.last_read_message_id !== undefined &&
            updates.unread_count === undefined
          ) {
            const lastMsgId = item.conversation.last_message?.msg_id || "0";
            const lastReadId = updates.last_read_message_id || "0";

            // Nếu tin nhắn cuối cùng mới hơn tin nhắn vừa đọc -> giữ badge hoặc set về 1, ngược lại về 0
            mergedParticipant.unread_count =
              lastMsgId !== "0" && BigInt(lastMsgId) > BigInt(lastReadId) ?
                mergedParticipant.unread_count || 1
                : 0;
          }

          return { ...item, participant: mergedParticipant };
        }),
      );
    },
    [],
  );

  // Add new conversation
  const updateConversationParticipant = useCallback(
    (
      conversationId: string,
      userId: string,
      updates: Partial<ConversationParticipant>,
    ) => {
      setConversations((prev) =>
        prev.map((item) => {
          if (item.conversation._id !== conversationId) return item;
          if (!item.conversation.participants) return item;

          const updatedParticipants = item.conversation.participants.map((p) =>
            String(p.user_id) === String(userId) ? { ...p, ...updates } : p,
          );

          return {
            ...item,
            conversation: {
              ...item.conversation,
              participants: updatedParticipants,
            },
          };
        }),
      );
    },
    [],
  );

  const addConversation = useCallback((conversation: Conversation) => {
    const newItem: ConversationWithParticipant = {
      conversation,
      participant: {
        _id: "",
        user_id: "",
        conversation_id: conversation._id,
        settings: { is_pinned: false, notification_status: "on" },
        last_read_message_id: "0",
        last_read_at: new Date().toISOString(),
        deleted_msg_id: "0",
        unread_count: 0,
        joined_at: new Date().toISOString(),
        roles: "user",
      },
    };
    setConversations((prev) => [newItem, ...prev]);
  }, []);

  const removeConversation = useCallback((conversationId: string) => {
    setDissolvedSessionIds((prev) => {
      const next = new Set(prev);
      next.add(conversationId);
      return next;
    });
    setConversations((prev) =>
      prev.filter((item) => item.conversation._id !== conversationId),
    );
  }, []);

  // Socket: Xử lý tin nhắn mới real-time
  const handleIncomingMessage = useCallback((message: any) => {
    const convId = message.conversation_id?.toString();
    if (!convId) return;

    setConversations((prev) => {
      const targetIndex = prev.findIndex(
        (item) => item.conversation._id === convId,
      );
      if (targetIndex === -1) return prev;

      const rawContent: string =
        Array.isArray(message.content) ?
          message.content[0] || ""
          : message.content || "";

      let displayContent = "";
      switch (message.type) {
        case "image":
          displayContent = "[Hình ảnh]";
          break;
        case "video":
          displayContent = "[Video]";
          break;
        case "audio":
          displayContent = "[Âm thanh]";
          break;
        case "file":
          displayContent = "[Tệp tin]";
          break;
        default:
          displayContent =
            rawContent.length > 50 ?
              rawContent.substring(0, 50) + "..."
              : rawContent;
      }

      const existing = prev[targetIndex];
      const isIncomingFromOther =
        String(message.sender_id || "") !==
        String(existing.participant.user_id || "");
      const nextUnread =
        isIncomingFromOther ?
          (Number(existing.participant.unread_count) || 0) + 1
          : Number(existing.participant.unread_count) || 0;

      const updated: ConversationWithParticipant = {
        ...existing,
        conversation: {
          ...existing.conversation,
          last_message: {
            msg_id: message.msg_id,
            sender_id: message.sender_id,
            sender_name: message.sender_name || "",
            content: displayContent,
            type: message.type,
            createdAt: message.createdAt || new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        },
        participant: { ...existing.participant, unread_count: nextUnread },
      };

      const newList = [...prev];
      newList.splice(targetIndex, 1);
      newList.unshift(updated);
      return newList;
    });
  }, []);

  const handleRevokedMessage = useCallback((payload: any) => {
    const convId = payload.conversation_id?.toString();
    if (!convId) return;

    const revokedMsgId = String(payload.msg_id || "");
    const revokedContent =
      Array.isArray(payload.content) ?
        String(payload.content[0] || "Tin nhắn đã được thu hồi")
        : String(payload.content || "Tin nhắn đã được thu hồi");

    setConversations((prev) =>
      prev.map((item) => {
        if (item.conversation._id !== convId) return item;

        const currentLast = item.conversation.last_message;
        if (
          !currentLast?.msg_id ||
          String(currentLast.msg_id) !== revokedMsgId
        ) {
          return item;
        }

        return {
          ...item,
          conversation: {
            ...item.conversation,
            last_message: {
              ...currentLast,
              content: revokedContent,
              type: "text",
              sender_name: payload.sender_name || currentLast.sender_name || "",
            },
          },
        };
      }),
    );
  }, []);

  const handleCategoryUpdated = useCallback((payload: any) => {
    const conversationId = String(payload?.conversationId || "");
    if (!conversationId) return;

    const nextCategoryId =
      payload?.categoryId ?? payload?.participant?.settings?.category_id ?? null;

    setConversations((prev) =>
      prev.map((item) =>
        item.conversation._id === conversationId ?
          {
            ...item,
            participant: {
              ...item.participant,
              settings: {
                ...item.participant.settings,
                category_id: nextCategoryId,
              },
            },
          }
          : item,
      ),
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      return;
    }

    socketService.connect();
    socketService.onNewMessage(handleIncomingMessage);

    const socket = socketService.getSocket();
    socket?.on("tin_nhan_thu_hoi", handleRevokedMessage);
    socket?.on("cap_nhat_phan_loai", handleCategoryUpdated);

    const handleGroupDissolved = (payload: { conversationId?: string }) => {
      const conversationId = String(payload?.conversationId || "");
      if (!conversationId) return;

      const currentUserId = String(
        (user as { user_id?: string; _id?: string } | null)?.user_id ||
        (user as { user_id?: string; _id?: string } | null)?._id ||
        "",
      ).trim();

      setDissolvedSessionIds((prev) => {
        const next = new Set(prev);
        next.add(conversationId);
        return next;
      });

      setConversations((prev) => {
        const item = prev.find((c) => c.conversation._id === conversationId);
        if (!item) return prev;

        const ownerId = String(item.conversation.created_by || "");
        const isOwner = ownerId === currentUserId ||
          (user as any)?._id === ownerId ||
          (user as any)?.user_id === ownerId;

        if (isOwner) {
          // Trưởng nhóm: Mất luôn giống mobile
          return prev.filter((c) => c.conversation._id !== conversationId);
        } else {
          // Thành viên: Vẫn còn nhưng bị block
          return prev.map((c) =>
            c.conversation._id === conversationId ?
              { ...c, conversation: { ...c.conversation, status: "dissolved", is_dissolved: true } }
              : c,
          );
        }
      });

      window.dispatchEvent(
        new CustomEvent("chat:conversation-dissolved", {
          detail: { conversationId },
        }),
      );
    };

    const handleNewConversation = async (newConv?: any) => {
      const currentUserId = (user as { user_id?: string; _id?: string; id?: string } | null);
      const normalizedUserId = (currentUserId?.user_id || currentUserId?._id || currentUserId?.id || "").trim();
      
      if (!normalizedUserId) return;

      if (newConv && newConv._id) {
        // Surgical update: Add new conversation to list if not exists
        setConversations((prev) => {
          if (prev.some(c => c.conversation._id === newConv._id)) return prev;
          
          const newItem: ConversationWithParticipant = {
            conversation: newConv,
            participant: {
              _id: "",
              user_id: normalizedUserId,
              conversation_id: newConv._id,
              settings: { is_pinned: false, notification_status: "on" },
              last_read_message_id: "0",
              last_read_at: new Date().toISOString(),
              deleted_msg_id: "0",
              unread_count: 0,
              joined_at: new Date().toISOString(),
              roles: "user"
            }
          };
          return [newItem, ...prev];
        });
        return;
      }

      // Fallback for empty payload: ONLY fetch if we have to, but try to avoid list reloads
      // In this app, tao_phong_moi usually sends the conversation object.
    };

    const handleRemoveConversation = (event: Event) => {
      const custom = event as CustomEvent<{ conversationId?: string }>;
      const convId = custom.detail?.conversationId;
      if (convId) {
        setDissolvedSessionIds((prev) => {
          const next = new Set(prev);
          next.add(convId);
          return next;
        });
        setConversations((prev) => prev.filter((item) => item.conversation._id !== convId));
      }
    };

    socketService.onGroupDissolved(handleGroupDissolved);

    window.addEventListener("chat:remove-conversation", handleRemoveConversation);

    const handleKickedFromGroup = (payload: { conversationId?: string }) => {
      const convId = String(payload?.conversationId || "");
      if (!convId) return;

      setConversations((prev) => prev.filter((item) => item.conversation._id !== convId));

      window.dispatchEvent(
        new CustomEvent("chat:kicked-from-group", {
          detail: { conversationId: convId },
        }),
      );
    };

    const handleMemberRemoved = (payload: {
      conversationId?: string;
      userId?: string;
    }) => {
      const convId = String(payload?.conversationId || "");
      const removedUserId = String(payload?.userId || "");
      if (!convId || !removedUserId) return;

      setConversations((prev) =>
        prev.map((item) => {
          if (item.conversation._id !== convId) return item;
          if (!item.conversation.participants) return item;

          const updatedParticipants = item.conversation.participants.filter(
            (p) => String(p.user_id) !== removedUserId,
          );

          return {
            ...item,
            conversation: {
              ...item.conversation,
              participants: updatedParticipants,
            },
          };
        }),
      );

      window.dispatchEvent(
        new CustomEvent("chat:member-removed", {
          detail: { conversationId: convId, userId: removedUserId },
        }),
      );
    };

    const handleMemberLeft = (payload: {
      conversationId?: string;
      userId?: string;
    }) => {
      const convId = String(payload?.conversationId || "");
      const leftUserId = String(payload?.userId || "");
      if (!convId || !leftUserId) return;

      const currentUserId = String(
        (user as { user_id?: string; _id?: string } | null)?.user_id ||
        (user as { _id?: string } | null)?._id ||
        "",
      );

      if (leftUserId === currentUserId) {
        setConversations((prev) =>
          prev.filter((item) => item.conversation._id !== convId),
        );

        window.dispatchEvent(
          new CustomEvent("chat:kicked-from-group", {
            detail: { conversationId: convId },
          }),
        );
        return;
      }

      setConversations((prev) =>
        prev.map((item) => {
          if (item.conversation._id !== convId) return item;
          if (!item.conversation.participants) return item;

          const updatedParticipants = item.conversation.participants.filter(
            (p) => String(p.user_id) !== leftUserId,
          );

          return {
            ...item,
            conversation: {
              ...item.conversation,
              participants: updatedParticipants,
            },
          };
        }),
      );

      window.dispatchEvent(
        new CustomEvent("chat:member-left", {
          detail: { conversationId: convId, userId: leftUserId },
        }),
      );
    };

    socketService.onKickedFromGroup(handleKickedFromGroup);
    socketService.onMemberKicked(handleMemberRemoved);
    socketService.onMemberLeft(handleMemberLeft);
    socketService.onNewConversation(handleNewConversation);

    return () => {
      socketService.offNewMessage(handleIncomingMessage);

      const cleanupSocket = socketService.getSocket();
      cleanupSocket?.off("tin_nhan_thu_hoi", handleRevokedMessage);
      cleanupSocket?.off("cap_nhat_phan_loai", handleCategoryUpdated);
      socketService.offGroupDissolved(handleGroupDissolved);
      socketService.offKickedFromGroup(handleKickedFromGroup);
      socketService.offMemberKicked(handleMemberRemoved);
      socketService.offMemberLeft(handleMemberLeft);
      socketService.offNewConversation(handleNewConversation);
    };
  }, [
    handleCategoryUpdated,
    handleIncomingMessage,
    handleRevokedMessage,
    isAuthenticated,
    user,
  ]);


  // Category Actions
  const addCategory = useCallback((category: Category) => {
    setCategories((prev) => [...prev, category]);
  }, []);

  const updateCategory = useCallback(
    (categoryId: string, updates: Partial<Category>) => {
      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === categoryId ? { ...cat, ...updates } : cat,
        ),
      );
    },
    [],
  );

  const removeCategory = useCallback((categoryId: string) => {
    setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
    setConversations((prev) =>
      prev.map((item) =>
        item.participant.settings.category_id === categoryId ?
          {
            ...item,
            participant: {
              ...item.participant,
              settings: { ...item.participant.settings, category_id: null },
            },
          }
          : item,
      ),
    );
  }, []);

  // Refresh Conversations with Optimistic Consistency
  const refreshConversations = useCallback(async (userId: string) => {
    try {
      const loadedConversations =
        await ConversationService.getUserConversations(userId);

      const currentUserId = userId;

      setRawConversations((prev) => {
        const baseFiltered = applyDissolutionLogic(loadedConversations, currentUserId, dissolvedSessionIds);

        return baseFiltered.map((newItem) => {
          const convId = newItem.conversation._id;
          const dbId = newItem.participant.last_read_message_id || "0";
          const existing = prev.find((p) => p.conversation._id === convId);
          const inMemId = existing?.participant.last_read_message_id || "0";
          const lsId = localStorage.getItem(`read_${convId}_${currentUserId}`) || "0";

          const candidates = [dbId, inMemId, lsId].filter((id) => id !== "0");

          if (candidates.length === 0) return newItem;

          const bestId = candidates.reduce(
            (max, id) => (BigInt(id) > BigInt(max) ? id : max),
            "0",
          );

          return BigInt(bestId) > BigInt(dbId) ?
            {
              ...newItem,
              participant: {
                ...newItem.participant,
                last_read_message_id: bestId,
              },
            }
            : newItem;
        });
      });
    } catch (error) {
      console.error("Failed to refresh conversations:", error);
    }
  }, [dissolvedSessionIds, applyDissolutionLogic]);

  // Initial Load - Centralized source of truth
  useEffect(() => {
    const rawUser = user as { user_id?: string; _id?: string; id?: string } | null;
    const currentUserId = (rawUser?.user_id || rawUser?._id || rawUser?.id || "").trim();

    if (isAuthenticated && currentUserId) {
      // Prevent redundant loads if already done for this user ID
      if (initialLoadDoneRef.current === currentUserId) return;
      
      setLoading(true);
      setError(null);

      const loadInitialData = async () => {
        try {
          // Categories
          const loadedCategories = await CategoryService.getUserCategories(currentUserId);
          setCategories(loadedCategories);

          // Conversations
          await refreshConversations(currentUserId);
          initialLoadDoneRef.current = currentUserId;
          console.log("Conversations loaded surgically for user:", currentUserId);
        } catch (err) {
          console.error("Failed to load initial data in context:", err);
          setError("Không thể tải dữ liệu hội thoại");
        } finally {
          setLoading(false);
        }
      };

      loadInitialData();
    }
  }, [isAuthenticated, user, refreshConversations]);

  const value = {
    conversations,
    categories,
    loading,
    error,
    setConversations,
    setCategories,
    setLoading,
    setError,
    updateConversation,
    updateParticipant,
    updateConversationParticipant,
    addConversation,
    removeConversation,
    addCategory,
    updateCategory,
    removeCategory,
    refreshConversations,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (!context)
    throw new Error(
      "useConversations must be used within ConversationsProvider",
    );
  return context;
};
