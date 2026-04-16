    import type { Conversation, ConversationParticipant } from "../types";

const normalizeId = (value?: string) => String(value || "").trim();

const resolveParticipantName = (participant?: ConversationParticipant): string => {
  if (!participant) return "Hội thoại";

  const nickname = String(participant.nickname || "").trim();
  if (nickname) return nickname;

  const displayName = String(participant.display_name || "").trim();
  if (displayName) return displayName;

  const fallbackName = String(participant.name || "").trim();
  if (fallbackName) return fallbackName;

  return "Hội thoại";
};

export const getOtherParticipant = (
  conversation: Conversation,
  currentUserId?: string,
): ConversationParticipant | undefined => {
  if (conversation.type !== "private") return undefined;

  const participants = Array.isArray(conversation.participants)
    ? conversation.participants
    : [];

  if (participants.length === 0) return undefined;

  const current = normalizeId(currentUserId);
  if (!current) return participants[0];

  return (
    participants.find((participant) => {
      const userId = normalizeId(participant.user_id);
      const participantId = normalizeId(participant._id);
      return userId !== current && participantId !== current;
    }) || participants[0]
  );
};

export const getConversationDisplayName = (
  conversation: Conversation,
  currentUserId?: string,
): string => {
  if (conversation.type === "private") {
    const explicitName = String(conversation.name || "").trim();
    if (conversation.is_self_conversation && explicitName) {
      return explicitName;
    }

    const other = getOtherParticipant(conversation, currentUserId);
    return resolveParticipantName(other);
  }

  const explicitName = String(conversation.name || "").trim();
  if (explicitName) return explicitName;

  return "Hội thoại";
};

export const getConversationDisplayAvatar = (
  conversation: Conversation,
  currentUserId?: string,
): string | undefined => {
  const explicitAvatar = String(conversation.avatar || "").trim();
  if (explicitAvatar) return explicitAvatar;

  if (conversation.type === "private") {
    const other = getOtherParticipant(conversation, currentUserId);
    return other?.avatar;
  }

  return undefined;
};
