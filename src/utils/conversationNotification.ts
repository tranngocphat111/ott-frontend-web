type ParticipantLike = {
  unread_count?: number | string | null;
  settings?: {
    notification_status?: string | null;
    mute_until?: string | Date | null;
  } | null;
} | null | undefined;

export const isConversationMuted = (participant: ParticipantLike): boolean => {
  const settings = participant?.settings;
  const status = String(settings?.notification_status || "on").toLowerCase();

  if (status === "off") return true;
  if (status !== "mute") return false;

  const muteUntil = settings?.mute_until;
  if (!muteUntil) return true;

  const muteUntilTime = new Date(muteUntil).getTime();
  if (Number.isNaN(muteUntilTime)) return true;

  return muteUntilTime > Date.now();
};

export const getParticipantUnreadCount = (participant: ParticipantLike): number =>
  Math.max(0, Number(participant?.unread_count || 0));
