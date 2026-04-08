import { useState, useEffect } from "react";
import type { ConversationParticipant, User } from "../types";
import { UserService } from "../services";

const senderCache = new Map<string, User | null>();
const senderPendingRequests = new Map<string, Promise<User | null>>();

const hasUsefulSenderData = (sender?: Partial<User> | null) => {
  if (!sender) return false;
  const hasName = !!sender.name && sender.name.trim() !== "";
  const hasAvatar = !!sender.avatar && sender.avatar.trim() !== "";
  return hasName || hasAvatar;
};

export const primeMessageSenderCache = (
  participants?: ConversationParticipant[],
) => {
  if (!Array.isArray(participants) || participants.length === 0) return;

  participants.forEach((participant) => {
    const senderKey = String(participant.user_id || participant._id || "");
    if (!senderKey) return;

    const candidateName =
      participant.nickname || participant.display_name || participant.name || "";
    const candidateAvatar = participant.avatar || "";
    const hasUsefulData = !!candidateName || !!candidateAvatar;
    if (!hasUsefulData) return;

    const existing = senderCache.get(senderKey);
    const merged: User = {
      _id: existing?._id || participant._id || senderKey,
      user_id: existing?.user_id || participant.user_id || senderKey,
      name: existing?.name || candidateName,
      avatar: existing?.avatar || candidateAvatar,
      is_online: existing?.is_online ?? false,
      last_active_at: existing?.last_active_at || "",
    };

    senderCache.set(senderKey, merged);
  });
};

export const useMessageSender = (
  senderId: string | number | undefined,
  isMe: boolean,
  initialSender?: Partial<User> | null,
  shouldFetch: boolean = true,
) => {
  const senderKey = senderId ? String(senderId) : "";
  const [sender, setSender] = useState<User | null>(() => {
    if (!senderKey) return null;
    if (senderCache.has(senderKey)) {
      return senderCache.get(senderKey) ?? null;
    }

    if (hasUsefulSenderData(initialSender) && initialSender) {
      return {
        _id: initialSender._id,
        user_id: initialSender.user_id || senderKey,
        name: initialSender.name || "",
        avatar: initialSender.avatar || "",
        is_online: initialSender.is_online ?? false,
        last_active_at: initialSender.last_active_at || "",
      };
    }

    return null;
  });

  useEffect(() => {
    if (isMe || !senderKey || !shouldFetch) return;

    if (
      hasUsefulSenderData(initialSender) &&
      initialSender &&
      !senderCache.has(senderKey)
    ) {
      const preloadedSender: User = {
        _id: initialSender._id,
        user_id: initialSender.user_id || senderKey,
        name: initialSender.name || "",
        avatar: initialSender.avatar || "",
        is_online: initialSender.is_online ?? false,
        last_active_at: initialSender.last_active_at || "",
      };
      senderCache.set(senderKey, preloadedSender);
      setSender(preloadedSender);
    }

    const cachedSender = senderCache.get(senderKey);
    if (cachedSender !== undefined) {
      setSender(cachedSender);
      return;
    }

    let request = senderPendingRequests.get(senderKey);
    if (!request) {
      request = UserService.getUserById(senderKey)
        .then((userData) => {
          senderCache.set(senderKey, userData);
          return userData;
        })
        .catch((error) => {
          console.error("Lỗi lấy user:", error);
          return null;
        })
        .finally(() => {
          senderPendingRequests.delete(senderKey);
        });

      senderPendingRequests.set(senderKey, request);
    }

    request.then((userData) => {
      setSender(userData);
    });
  }, [senderKey, isMe, shouldFetch, initialSender]);

  return sender;
};
