import React, { useEffect, useState, useCallback } from "react";
import { Gift, Users } from "lucide-react";
import avatar from "../../assets/avatar.png";
import {
  acceptFriendRequest,
  fetchFriends,
  fetchPendingRequests,
  rejectFriendRequest,
  type FriendOption,
  type FriendRequestOption,
} from "../../services/social.service";
import {
  relationshipSocketService,
  type RelationshipRealtimePayload,
} from "../../services/relationshipSocket.service";

interface Props {
  currentUserId: string;
}

const SocialRightSidebar: React.FC<Props> = ({ currentUserId }) => {
  const [requests, setRequests] = useState<FriendRequestOption[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!currentUserId) return;
    setRequestsLoading(true);
    const data = await fetchPendingRequests(currentUserId);
    setRequests(data);
    setRequestsLoading(false);
  }, [currentUserId]);

  const loadFriends = useCallback(async () => {
    if (!currentUserId) return;
    setFriendsLoading(true);
    const data = await fetchFriends(currentUserId);
    setFriends(data);
    setFriendsLoading(false);
  }, [currentUserId]);

  const getOtherUserId = useCallback(
    (payload: RelationshipRealtimePayload) => {
      if (payload.requesterId === currentUserId) return payload.receiverId;
      if (payload.receiverId === currentUserId) return payload.requesterId;
      return null;
    },
    [currentUserId],
  );

  const updateFromPayload = useCallback(
    (payload: RelationshipRealtimePayload) => {
      if (!payload) return;

      switch (payload.type) {
        case "REQUEST_SENT": {
          if (payload.receiverId === currentUserId) {
            loadRequests();
          }
          break;
        }
        case "REQUEST_ACCEPTED": {
          setRequests((prev) =>
            prev.filter((req) => req.id !== payload.relationshipId),
          );
          loadFriends();
          break;
        }
        case "REQUEST_REJECTED":
        case "REQUEST_CANCELED": {
          setRequests((prev) =>
            prev.filter((req) => req.id !== payload.relationshipId),
          );
          break;
        }
        case "UNFRIENDED":
        case "BLOCKED": {
          const otherUserId = getOtherUserId(payload);
          if (otherUserId) {
            setFriends((prev) => prev.filter((f) => f.id !== otherUserId));
          }
          break;
        }
        default:
          break;
      }
    },
    [currentUserId, getOtherUserId, loadFriends, loadRequests],
  );

  useEffect(() => {
    if (!currentUserId) {
      setRequests([]);
      setFriends([]);
      return;
    }

    loadRequests();
    loadFriends();
  }, [currentUserId, updateFromPayload, loadFriends, loadRequests]);

  useEffect(() => {
    if (!currentUserId) return;

    const handleRelationshipUpdate = (payload: RelationshipRealtimePayload) => {
      if (!payload) return;

      const targetIds = payload.targetUserIds || [];
      const isTarget =
        targetIds.includes(currentUserId) ||
        payload.requesterId === currentUserId ||
        payload.receiverId === currentUserId;

      if (!isTarget) return;

      updateFromPayload(payload);
    };

    relationshipSocketService.onRelationshipUpdate(handleRelationshipUpdate);
    return () =>
      relationshipSocketService.offRelationshipUpdate(handleRelationshipUpdate);
  }, [currentUserId, loadRequests, loadFriends, updateFromPayload]);

  useEffect(() => {
    if (!currentUserId) return;

    const handleConnect = () => {
      loadRequests();
      loadFriends();
    };

    relationshipSocketService.onConnect(handleConnect);
    return () => relationshipSocketService.offConnect(handleConnect);
  }, [currentUserId, loadRequests, loadFriends]);

  const handleAccept = async (relationshipId: string) => {
    setBusyRequestId(relationshipId);
    const ok = await acceptFriendRequest(relationshipId);
    if (ok) {
      setRequests((prev) => prev.filter((req) => req.id !== relationshipId));
      const data = await fetchFriends(currentUserId);
      setFriends(data);
    }
    setBusyRequestId(null);
  };

  const handleReject = async (relationshipId: string) => {
    setBusyRequestId(relationshipId);
    const ok = await rejectFriendRequest(relationshipId);
    if (ok) {
      setRequests((prev) => prev.filter((req) => req.id !== relationshipId));
    }
    setBusyRequestId(null);
  };

  return (
    <aside className="w-80 shrink-0 hidden lg:block">
      <div className="sticky top-4 space-y-5">
        {/* ── Friend Requests ──────────────────────────── */}
        <div className="border-t border-primary-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-primary-800">Loi moi ket ban</h3>
            <button className="text-primary-500 font-medium text-sm hover:underline">
              Xem tat ca
            </button>
          </div>
          {requestsLoading && (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Users className="size-8 text-primary-200" />
              <p className="text-xs text-gray-400">Dang tai loi moi...</p>
            </div>
          )}
          {!requestsLoading && requests.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Users className="size-8 text-primary-200" />
              <p className="text-xs text-gray-400">
                Chua co loi moi ket ban nao
              </p>
            </div>
          )}
          {!requestsLoading && requests.length > 0 && (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="flex items-start gap-3">
                  <div className="size-14 rounded-full overflow-hidden shrink-0 shadow">
                    <img
                      src={req.avatarUrl ?? avatar}
                      alt={req.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {req.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Vua gui loi moi
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={busyRequestId === req.id}
                        className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-200 text-white py-1.5 rounded-lg text-sm font-medium transition">
                        Xac nhan
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={busyRequestId === req.id}
                        className="flex-1 bg-primary-100 hover:bg-primary-200 disabled:bg-primary-50 text-primary-800 py-1.5 rounded-lg text-sm font-medium transition">
                        Xoa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Friends ─────────────────────────────────── */}
        <div className="border-t border-primary-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-primary-800">Ban be</h3>
            <button className="text-primary-500 font-medium text-sm hover:underline">
              Xem tat ca
            </button>
          </div>
          {friendsLoading && (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Users className="size-8 text-primary-200" />
              <p className="text-xs text-gray-400">Dang tai ban be...</p>
            </div>
          )}
          {!friendsLoading && friends.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Users className="size-8 text-primary-200" />
              <p className="text-xs text-gray-400">Chua co ban be</p>
            </div>
          )}
          {!friendsLoading && friends.length > 0 && (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3">
                  <div className="size-10 rounded-full overflow-hidden shrink-0 shadow">
                    <img
                      src={friend.avatarUrl ?? avatar}
                      alt={friend.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {friend.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Ban be</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SocialRightSidebar;
