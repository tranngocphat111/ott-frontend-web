import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import fallbackAvatar from "../../../assets/avatar.png";
import type { StorySuggestedUser } from "../types";
import {
  cancelRelationship,
  sendFriendRequest,
} from "../../../services/social.service";
import {
  relationshipSocketService,
  type RelationshipRealtimePayload,
} from "../../../services/relationshipSocket.service";

interface Props {
  users: StorySuggestedUser[];
  currentUserId: string;
}

const SuggestedFriendCards: React.FC<Props> = ({ users, currentUserId }) => {
  const [pendingMap, setPendingMap] = useState<Record<string, string>>({});
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const pendingMapRef = useRef<Record<string, string>>({});

  const handleSend = async (targetUserId: string) => {
    if (!currentUserId) return;
    const result = await sendFriendRequest(currentUserId, targetUserId);
    const relationshipId = result?.id as string | undefined;
    if (!relationshipId) return;
    setPendingMap((prev) => ({ ...prev, [targetUserId]: relationshipId }));
  };

  const handleCancel = async (targetUserId: string) => {
    const relationshipId = pendingMap[targetUserId];
    if (!relationshipId) return;
    const ok = await cancelRelationship(relationshipId);
    if (!ok) return;
    setPendingMap((prev) => {
      const next = { ...prev };
      delete next[targetUserId];
      return next;
    });
  };

  useEffect(() => {
    if (!users.length) return;
    setHiddenIds((prev) => {
      const allowed = new Set(users.map((user) => user.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
      }
      return next;
    });
  }, [users]);

  useEffect(() => {
    pendingMapRef.current = pendingMap;
  }, [pendingMap]);

  useEffect(() => {
    if (!currentUserId) return;

    setPendingMap({});
    pendingMapRef.current = {};
    relationshipSocketService.connect();

    const handleRelationshipUpdate = (payload: RelationshipRealtimePayload) => {
      if (!payload) return;

      const targetUserId =
        payload.requesterId === currentUserId ? payload.receiverId
        : payload.receiverId === currentUserId ? payload.requesterId
        : null;

      const resolveTargetFromRelationship = (): string | null => {
        if (!payload.relationshipId) return null;
        const entries = Object.entries(pendingMapRef.current);
        const match = entries.find(
          ([, relId]) => relId === payload.relationshipId,
        );
        return match ? match[0] : null;
      };

      const effectiveTarget = targetUserId ?? resolveTargetFromRelationship();
      if (!effectiveTarget) return;

      if (
        payload.type === "REQUEST_SENT" &&
        payload.requesterId === currentUserId
      ) {
        setPendingMap((prev) => ({
          ...prev,
          [effectiveTarget]: payload.relationshipId,
        }));
        return;
      }

      if (payload.type === "REQUEST_ACCEPTED") {
        setPendingMap((prev) => {
          if (!prev[effectiveTarget]) return prev;
          const next = { ...prev };
          delete next[effectiveTarget];
          return next;
        });
        setHiddenIds((prev) => {
          if (prev.has(effectiveTarget)) return prev;
          const next = new Set(prev);
          next.add(effectiveTarget);
          return next;
        });
        return;
      }

      if (
        payload.type === "REQUEST_REJECTED" ||
        payload.type === "REQUEST_CANCELED" ||
        payload.type === "REQUEST_CANCELLED" ||
        payload.type === "UNFRIENDED" ||
        payload.type === "BLOCKED" ||
        payload.type === "USER_BLOCKED"
      ) {
        setPendingMap((prev) => {
          if (!prev[effectiveTarget]) return prev;
          const next = { ...prev };
          delete next[effectiveTarget];
          return next;
        });
        setHiddenIds((prev) => {
          if (!prev.has(effectiveTarget)) return prev;
          const next = new Set(prev);
          next.delete(effectiveTarget);
          return next;
        });
      }
    };

    relationshipSocketService.onRelationshipUpdate(handleRelationshipUpdate);
    return () =>
      relationshipSocketService.offRelationshipUpdate(handleRelationshipUpdate);
  }, [currentUserId]);

  const goProfile = (userId: string) => {
    if (!userId) return;
    navigate(`/social/profile/${userId}`);
  };

  return (
    <>
      {users
        .filter((user) => !hiddenIds.has(user.id))
        .map((user) => {
          const isPending = Boolean(pendingMap[user.id]);
          return (
            <div
              key={`suggested-${user.id}`}
              onClick={() => goProfile(user.id)}
              className="shrink-0 w-27.5 h-48 rounded-xl overflow-hidden relative shadow border border-gray-200 bg-white">
              <div className="h-[72%] overflow-hidden bg-gray-100">
                <img
                  src={user.avatarUrl ?? fallbackAvatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-white px-2 pb-2 pt-1.5">
                <p className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-8">
                  {user.name}
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isPending) {
                      handleCancel(user.id);
                    } else {
                      handleSend(user.id);
                    }
                  }}
                  className="mt-1 w-full h-7 rounded-md bg-primary-50 text-primary-700 text-[11px] font-semibold hover:bg-primary-100 transition inline-flex items-center justify-center gap-1">
                  <UserPlus className="size-3" />
                  {isPending ? "Đã gửi" : "Kết bạn"}
                </button>
              </div>
            </div>
          );
        })}
    </>
  );
};

export default SuggestedFriendCards;
