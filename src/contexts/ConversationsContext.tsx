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
import { useAuth } from "./AuthContext";

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
  const dissolvedSessionIdsRef = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDoneRef = useRef<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Helper to apply dissolution logic to any incoming conversations array
  const applyDissolutionLogic = useCallback((
    newConversations: ConversationWithParticipant[],
    dissolvedIds: Set<string>
  ) => {
    return newConversations
      .filter((newItem) => {
        // If it was removed/dissolved by current user in this session, filter it out
        return !dissolvedIds.has(newItem.conversation._id);
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
  }, []);

  const setConversations = useCallback((value: ConversationWithParticipant[] | ((prev: ConversationWithParticipant[]) => ConversationWithParticipant[])) => {
    setRawConversations((prevRaw) => {
      const nextConversations = typeof value === 'function' ? value(prevRaw) : value;
      return applyDissolutionLogic(nextConversations, dissolvedSessionIdsRef.current);
    });
  }, [applyDissolutionLogic]);

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
    const rawUser = user as { id?: string; user_id?: string; _id?: string } | null;
    const currentUserId = String(rawUser?.id || rawUser?.user_id || rawUser?._id || "").trim();

    // Try to find participant info for current user within the conversation object if populated
    // Use 'as any' because the structure can vary between Participant and ConversationParticipant types
    const participantFromConv = Array.isArray(conversation.participants)
      ? conversation.participants.find((p: any) => String(p.user_id || p._id) === currentUserId)
      : null;

    const newItem: ConversationWithParticipant = {
      conversation,
      participant: {
        _id: (participantFromConv as any)?._id || "",
        user_id: currentUserId,
        conversation_id: conversation._id,
        settings: {
          is_pinned: (participantFromConv as any)?.settings?.is_pinned || false,
          notification_status: (participantFromConv as any)?.settings?.notification_status || "on"
        },
        last_delivered_message_id: (participantFromConv as any)?.last_delivered_message_id || "0",
        last_delivered_at: (participantFromConv as any)?.last_delivered_at || null,
        last_read_message_id: (participantFromConv as any)?.last_read_message_id || "0",
        last_read_at: (participantFromConv as any)?.last_read_at || new Date().toISOString(),
        deleted_msg_id: (participantFromConv as any)?.deleted_msg_id || "0",
        unread_count: (participantFromConv as any)?.unread_count || 0,
        joined_at: (participantFromConv as any)?.joined_at || new Date().toISOString(),
        roles: (participantFromConv as any)?.roles || (conversation.created_by === currentUserId ? "admin" : "user"),
        status: (participantFromConv as any)?.status || "joined",
      },
    };

    setConversations((prev) => {
      // Avoid duplicates
      if (prev.some(item => item.conversation._id === conversation._id)) {
        return prev.map(item => item.conversation._id === conversation._id ? newItem : item);
      }
      return [newItem, ...prev];
    });
  }, [user, setConversations]);

  const removeConversation = useCallback((conversationId: string) => {
    dissolvedSessionIdsRef.current.add(conversationId);
    setDissolvedSessionIds((prev) => {
      const next = new Set(prev);
      next.add(conversationId);
      return next;
    });
    setConversations((prev) =>
      prev.filter((item) => item.conversation._id !== conversationId),
    );
  }, [setConversations]);

  // Refresh Conversations with Optimistic Consistency
  const refreshConversations = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Refreshing conversations for user:', userId);
      const loadedConversations =
        await ConversationService.getUserConversations(userId);

      setRawConversations(() => {
        const baseFiltered = applyDissolutionLogic(loadedConversations, dissolvedSessionIds);
        const merged = [...baseFiltered];

        return merged.sort((a, b) => {
          // Re-sort by updatedAt to ensure new items are at top
          const timeA = new Date(a.conversation.updatedAt || a.conversation.createdAt).getTime();
          const timeB = new Date(b.conversation.updatedAt || b.conversation.createdAt).getTime();
          return timeB - timeA;
        });
      });
    } catch (error) {
      console.error("Failed to refresh conversations:", error);
    }
  }, [dissolvedSessionIds, applyDissolutionLogic]);

  // Socket: Xử lý tin nhắn mới real-time
  const handleIncomingMessage = useCallback((message: any) => {
    const convId = message.conversation_id?.toString();
    if (!convId) return;

    const rawUser = user as { id?: string; user_id?: string; _id?: string } | null;
    const currentUserId = String(rawUser?.id || rawUser?.user_id || rawUser?._id || "").trim();
    const msgId = String(message.msg_id || message._id || "").trim();

    if (
      currentUserId &&
      msgId &&
      String(message.sender_id || "") !== currentUserId
    ) {
      socketService.markMessageDelivered(convId, currentUserId, msgId);
    }

    setConversations((prev) => {
      const targetIndex = prev.findIndex(
        (item) => item.conversation._id === convId,
      );

      if (targetIndex === -1) {
        // If conversation not found, trigger a refresh to fetch it
        const currentId = rawUser?.id || rawUser?.user_id || rawUser?._id;
        if (currentId) {
          refreshConversations(currentId);
        }
        return prev;
      }

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
  }, [user, refreshConversations]);

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

  const handleMemberAdded = useCallback((payload: any) => {
    const convId = String(payload?.conversation_id || "");
    if (!convId) return;

    setConversations((prev) =>
      prev.map((item) => {
        if (item.conversation._id !== convId) return item;

        const alreadyExists = item.conversation.participants?.some(
          (p) => String(p.user_id) === String(payload.user_id)
        );

        if (alreadyExists) return item;

        return {
          ...item,
          conversation: {
            ...item.conversation,
            participants: [...(item.conversation.participants || []), payload],
          },
        };
      }),
    );

    window.dispatchEvent(
      new CustomEvent("chat:member-added", {
        detail: { conversationId: convId, participant: payload },
      }),
    );
  }, []);

  const handleGroupCallUpdated = useCallback((payload: any) => {
    const convId = String(payload?.conversationId || "");
    if (!convId) return;

    updateConversation(convId, {
      is_calling: payload.isCalling,
      call_participant_count: payload.participantCount,
    });
  }, [updateConversation]);

  const applyParticipantCursorPayload = useCallback((payload: any) => {
    const conversationId = String(payload?.conversationId || "");
    const userId = String(
      payload?.userId || payload?.changedUserId || payload?.participant?.user_id || "",
    );
    if (!conversationId || !userId) return;

    const participant = payload?.participant || {};
    const isSeenReceipt =
      payload?.receiptType === "seen" || payload?.status === "seen";
    const cursorUpdates = {
      last_delivered_message_id:
        participant.last_delivered_message_id || payload.last_delivered_message_id,
      last_delivered_at:
        participant.last_delivered_at || payload.last_delivered_at,
    };

    const readCursorUpdates = isSeenReceipt
      ? {
          last_read_message_id:
            participant.last_read_message_id || payload.last_read_message_id,
          last_read_at: participant.last_read_at || payload.last_read_at,
        }
      : {};

    const conversationParticipantUpdates = Object.fromEntries(
      Object.entries({ ...cursorUpdates, ...readCursorUpdates }).filter(
        ([, value]) => value !== undefined,
      ),
    ) as Partial<ConversationParticipant>;

    updateConversationParticipant(
      conversationId,
      userId,
      conversationParticipantUpdates,
    );

    const rawUser = user as { id?: string; user_id?: string; _id?: string } | null;
    const currentUserId = String(rawUser?.id || rawUser?.user_id || rawUser?._id || "").trim();

    if (currentUserId && userId === currentUserId) {
      const participantUpdates = {
        ...(conversationParticipantUpdates as Partial<Participant>),
      };

      if (isSeenReceipt) {
        participantUpdates.unread_count = 0;
      }

      updateParticipant(conversationId, participantUpdates);

    }
  }, [updateConversationParticipant, updateParticipant, user]);

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
    socketService.onGroupCallUpdated(handleGroupCallUpdated);
    socketService.onMessageStatusChanged(applyParticipantCursorPayload);
    socketService.onParticipantCursorChanged(applyParticipantCursorPayload);
    socketService.onConversationReadSynced(applyParticipantCursorPayload);

    return () => {
      socketService.offNewMessage(handleIncomingMessage);
      const cleanupSocket = socketService.getSocket();
      cleanupSocket?.off("tin_nhan_thu_hoi", handleRevokedMessage);
      cleanupSocket?.off("cap_nhat_phan_loai", handleCategoryUpdated);
      cleanupSocket?.off("them_nguoi_moi", handleMemberAdded);
      socketService.offGroupCallUpdated(handleGroupCallUpdated);
      socketService.offMessageStatusChanged(applyParticipantCursorPayload);
      socketService.offParticipantCursorChanged(applyParticipantCursorPayload);
      socketService.offConversationReadSynced(applyParticipantCursorPayload);
    };
  }, [
    applyParticipantCursorPayload,
    handleIncomingMessage,
    handleRevokedMessage,
    handleCategoryUpdated,
    handleGroupCallUpdated,
    handleMemberAdded,
    isAuthenticated,
  ]);

  const handleGroupDissolved = useCallback((payload: any) => {
    const conversationId = String(payload?.conversationId || "");
    if (!conversationId) return;

    const currentUserId = String(
      (user as { user_id?: string; _id?: string } | null)?.user_id ||
      (user as { user_id?: string; _id?: string } | null)?._id ||
      "",
    ).trim();

    // Determine if it should be removed (owner) or just marked as dissolved (member)
    // Preference: use deleteForOwner from socket payload if available
    const shouldRemoveCompletely = payload?.deleteForOwner === true;

    if (shouldRemoveCompletely) {
      dissolvedSessionIdsRef.current.add(conversationId);
      setDissolvedSessionIds((prev) => {
        const next = new Set(prev);
        next.add(conversationId);
        return next;
      });

      setConversations((prev) => prev.filter((c) => c.conversation._id !== conversationId));
    } else {
      // For members, we don't add to dissolvedSessionIdsRef (so it's not filtered)
      // but we update the conversation object to reflect dissolved status
      setConversations((prev) => {
        const existing = prev.find((c) => c.conversation._id === conversationId);
        if (!existing) return prev;

        // Double check if we are actually the owner just in case
        const ownerId = String(existing.conversation.created_by || "");
        const isOwner = ownerId === currentUserId ||
          (user as any)?._id === ownerId ||
          (user as any)?.user_id === ownerId;

        if (isOwner && !shouldRemoveCompletely) {
          // If we found out we are actually owner, remove it
          dissolvedSessionIdsRef.current.add(conversationId);
          setDissolvedSessionIds((prevSet) => {
            const next = new Set(prevSet);
            next.add(conversationId);
            return next;
          });
          return prev.filter((c) => c.conversation._id !== conversationId);
        }

        return prev.map((c) =>
          c.conversation._id === conversationId ?
            {
              ...c,
              conversation: {
                ...c.conversation,
                status: "dissolved",
                is_dissolved: true,
                // Update last message if payload provides it
                last_message: payload.message ? {
                  msg_id: c.conversation.last_message?.msg_id || "0",
                  sender_id: c.conversation.last_message?.sender_id || payload.dissolvedBy || "",
                  sender_name: c.conversation.last_message?.sender_name || payload.dissolvedByName || "Hệ thống",
                  content: payload.message,
                  type: "text",
                  createdAt: new Date().toISOString()
                } : c.conversation.last_message
              }
            }
            : c,
        );
      });
    }

    window.dispatchEvent(
      new CustomEvent("chat:conversation-dissolved", {
        detail: { conversationId },
      }),
    );
  }, [user]);

  const handleNewConversation = useCallback(async (newConv?: any) => {
    const rawUser = user as { id?: string; user_id?: string; _id?: string } | null;
    const currentUserId = (rawUser?.id || rawUser?.user_id || rawUser?._id || "").trim();

    if (!currentUserId) return;

    console.log("ConversationsContext: Received tao_phong_moi", newConv?._id);

    // Optimistically add to the list to ensure immediate visibility
    if (newConv) {
      // Clear from dissolved state if it was previously rejected/removed
      dissolvedSessionIdsRef.current.delete(newConv._id);
      setDissolvedSessionIds(prev => {
        const next = new Set(prev);
        next.delete(newConv._id);
        return next;
      });
      addConversation(newConv);
    }

    // Small delay before refresh to allow backend to finish DB transactions
    setTimeout(() => {
      refreshConversations(currentUserId);
    }, 500);
  }, [user, addConversation, refreshConversations]);

  const handleKickedFromGroup = useCallback((payload: { conversationId?: string }) => {
    const convId = String(payload?.conversationId || "");
    if (!convId) return;

    setConversations((prev) => prev.filter((item) => item.conversation._id !== convId));

    window.dispatchEvent(
      new CustomEvent("chat:kicked-from-group", {
        detail: { conversationId: convId },
      }),
    );
  }, []);

  const handleMemberRemoved = useCallback((payload: {
    conversationId?: string;
    userId?: string;
  }) => {
    const convId = String(payload?.conversationId || "");
    const removedUserId = String(payload?.userId || "");
    if (!convId || !removedUserId) return;

    const rawUser = user as { id?: string; user_id?: string; _id?: string } | null;
    const currentUserId = String(
      rawUser?.id || rawUser?.user_id || rawUser?._id || ""
    );

    if (removedUserId === currentUserId) {
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
  }, [user]);

  const handleBlockedFromGroup = useCallback((payload: { conversationId?: string }) => {
    const convId = String(payload?.conversationId || "");
    if (!convId) return;

    setConversations((prev) => prev.filter((item) => item.conversation._id !== convId));

    window.dispatchEvent(
      new CustomEvent("chat:kicked-from-group", {
        detail: { conversationId: convId },
      }),
    );
  }, []);

  const handleMemberBlocked = useCallback((payload: {
    conversationId?: string;
    userId?: string;
    blockedBy?: string;
  }) => {
    const convId = String(payload?.conversationId || "");
    const blockedUserId = String(payload?.userId || "");
    if (!convId || !blockedUserId) return;

    setConversations((prev) =>
      prev.map((item) => {
        if (item.conversation._id !== convId) return item;
        if (!item.conversation.participants) return item;

        const updatedParticipants = item.conversation.participants.filter(
          (p) => String(p.user_id) !== blockedUserId,
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
        detail: { conversationId: convId, userId: blockedUserId },
      }),
    );
  }, []);


  const handleMemberLeft = useCallback((payload: {
    conversationId?: string;
    userId?: string;
  }) => {
    const convId = String(payload?.conversationId || "");
    const leftUserId = String(payload?.userId || "");
    if (!convId || !leftUserId) return;

    const rawUser = user as { id?: string; user_id?: string; _id?: string } | null;
    const currentUserId = String(
      rawUser?.id || rawUser?.user_id || rawUser?._id || ""
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
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleRemoveConversation = (event: Event) => {
      const custom = event as CustomEvent<{ conversationId?: string }>;
      const convId = custom.detail?.conversationId;
      if (convId) {
        dissolvedSessionIdsRef.current.add(convId);
        setDissolvedSessionIds((prev) => {
          const next = new Set(prev);
          next.add(convId);
          return next;
        });
        setConversations((prev) => prev.filter((item) => item.conversation._id !== convId));
      }
    };

    socketService.onGroupDissolved(handleGroupDissolved);
    socketService.onKickedFromGroup(handleKickedFromGroup);
    socketService.onMemberKicked(handleMemberRemoved);
    socketService.onMemberLeft(handleMemberLeft);
    socketService.onMemberAdded(handleMemberAdded);
    socketService.onNewConversation(handleNewConversation);

    const socket = socketService.getSocket();
    socket?.on("bi_chan_khoi_nhom", handleBlockedFromGroup);
    socket?.on("thanh_vien_bi_chan", handleMemberBlocked);

    window.addEventListener("chat:remove-conversation", handleRemoveConversation);

    return () => {
      socketService.offGroupDissolved(handleGroupDissolved);
      socketService.offKickedFromGroup(handleKickedFromGroup);
      socketService.offMemberKicked(handleMemberRemoved);
      socketService.offMemberLeft(handleMemberLeft);
      socketService.offMemberAdded(handleMemberAdded);
      socketService.offNewConversation(handleNewConversation);
      
      const cleanupSocket = socketService.getSocket();
      cleanupSocket?.off("bi_chan_khoi_nhom", handleBlockedFromGroup);
      cleanupSocket?.off("thanh_vien_bi_chan", handleMemberBlocked);

      window.removeEventListener("chat:remove-conversation", handleRemoveConversation);
    };
  }, [
    handleGroupDissolved,
    handleNewConversation,
    handleKickedFromGroup,
    handleMemberRemoved,
    handleMemberLeft,
    handleMemberAdded,
    isAuthenticated,
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


  // Initial Load - Centralized source of truth
  useEffect(() => {
    const rawUser = user as { id?: string } | null;
    const currentUserId = (rawUser?.id || "").trim();

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
