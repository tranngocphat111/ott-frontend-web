import type { Conversation, ConversationWithParticipant } from "../types";

export const VIRTUAL_CONV_PREFIX = "VIRTUAL_CONV_";
export const CHAT_OPEN_TARGET_STORAGE_KEY = "chat_open_target";

export type ChatOpenTarget = {
  conversationId: string;
  conversation?: Conversation;
  at?: number;
};

type BuildVirtualConversationParams = {
  currentUserId: string;
  targetUserId: string;
  targetName?: string | null;
  targetAvatar?: string | null;
};

const normalizeId = (value?: string | null) => String(value || "").trim();

export const isVirtualConversationId = (conversationId?: string | null) =>
  normalizeId(conversationId).startsWith(VIRTUAL_CONV_PREFIX);

export const buildVirtualPrivateConversationItem = ({
  currentUserId,
  targetUserId,
  targetName,
  targetAvatar,
}: BuildVirtualConversationParams): ConversationWithParticipant => {
  const now = new Date().toISOString();
  const safeCurrentUserId = normalizeId(currentUserId);
  const safeTargetUserId = normalizeId(targetUserId);
  const safeTargetName = String(targetName || "").trim() || "Người dùng";
  const safeTargetAvatar = String(targetAvatar || "").trim();
  const virtualId = `${VIRTUAL_CONV_PREFIX}${safeTargetUserId}`;

  return {
    conversation: {
      _id: virtualId,
      type: "private",
      name: safeTargetName,
      avatar: safeTargetAvatar,
      created_by: safeCurrentUserId,
      member_count: 2,
      is_deleted: false,
      background: "",
      createdAt: now,
      updatedAt: now,
      participants: [
        {
          _id: safeCurrentUserId,
          user_id: safeCurrentUserId,
          display_name: "Bạn",
          avatar: "",
        },
        {
          _id: safeTargetUserId,
          user_id: safeTargetUserId,
          display_name: safeTargetName,
          name: safeTargetName,
          avatar: safeTargetAvatar,
        },
      ],
    },
    participant: {
      _id: "",
      user_id: safeCurrentUserId,
      conversation_id: virtualId,
      roles: "user",
      settings: {
        is_pinned: false,
        notification_status: "on",
      },
      last_delivered_message_id: "0",
      last_delivered_at: null,
      last_read_message_id: "0",
      last_read_at: now,
      deleted_msg_id: "0",
      unread_count: 0,
      joined_at: now,
      status: "joined",
    },
  };
};

export const cacheVirtualConversation = (
  currentUserId: string | undefined,
  item: ConversationWithParticipant,
) => {
  if (typeof window === "undefined") return;

  const ownerId = normalizeId(currentUserId);
  const conversationId = normalizeId(item.conversation._id);
  if (!ownerId || !conversationId) return;

  try {
    const cacheKey = `virtual_conv_cache_${ownerId}`;
    const raw = window.localStorage.getItem(cacheKey);
    const cache = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        ...cache,
        [conversationId]: item,
      }),
    );
  } catch {
    // localStorage can be unavailable in private mode or SSR-like tests.
  }
};

export const persistPendingChatOpenTarget = (target: ChatOpenTarget) => {
  if (typeof window === "undefined") return;
  if (!normalizeId(target.conversationId)) return;

  try {
    window.sessionStorage.setItem(
      CHAT_OPEN_TARGET_STORAGE_KEY,
      JSON.stringify({
        ...target,
        at: target.at || Date.now(),
      }),
    );
  } catch {
    // Ignore storage failures; route state still carries the target.
  }
};

export const readPendingChatOpenTarget = (): ChatOpenTarget | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CHAT_OPEN_TARGET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatOpenTarget;
    return normalizeId(parsed.conversationId) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearPendingChatOpenTarget = () => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(CHAT_OPEN_TARGET_STORAGE_KEY);
  } catch {
    // ignore
  }
};
