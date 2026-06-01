import React, { useEffect, useState, useCallback } from "react";
import {
  acceptFriendRequest,
  fetchFriends,
  fetchPendingRequests,
  rejectFriendRequest,
  fetchBlockedUsers,
  unblockRelationship,
  type FriendOption,
  type FriendRequestOption,
} from "../../../services/social.service";
import {
  relationshipSocketService,
  type RelationshipRealtimePayload,
} from "../../../services/relationshipSocket.service";
import FriendRequestsPanel from "../rightSidebar/FriendRequestsPanel";
import FriendsPanel from "../rightSidebar/FriendsPanel";
import BlockedUsersPanel from "../rightSidebar/BlockedUsersPanel";
import { RelationshipListModal } from "../rightSidebar/RelationshipListModal";

interface Props {
  currentUserId: string;
}

const SocialRightContent: React.FC<Props> = ({ currentUserId }) => {
  const [requests, setRequests] = useState<FriendRequestOption[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"requests" | "friends">("friends");

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

  const loadBlocked = useCallback(async () => {
    if (!currentUserId) return;
    setBlockedLoading(true);
    const data = await fetchBlockedUsers(currentUserId);
    setBlockedUsers(data);
    setBlockedLoading(false);
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
        case "REQUEST_CANCELED":
        case "REQUEST_CANCELLED": {
          setRequests((prev) =>
            prev.filter((req) => req.id !== payload.relationshipId),
          );
          break;
        }
        case "UNFRIENDED":
        case "BLOCKED":
        case "USER_BLOCKED": {
          const otherUserId = getOtherUserId(payload);
          if (otherUserId) {
            setFriends((prev) => prev.filter((f) => f.id !== otherUserId));
          }
          loadBlocked();
          break;
        }
        default:
          break;
      }
    },
    [currentUserId, getOtherUserId, loadFriends, loadRequests, loadBlocked],
  );

  useEffect(() => {
    if (!currentUserId) {
      setRequests([]);
      setFriends([]);
      return;
    }

    loadRequests();
    loadFriends();
    loadBlocked();
  }, [currentUserId, updateFromPayload, loadFriends, loadRequests, loadBlocked]);

  useEffect(() => {
    if (!currentUserId) return;

    relationshipSocketService.connect();
    relationshipSocketService.joinUserRoom(currentUserId);

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

  const handleUnblock = async (relationshipId: string) => {
    setBusyRequestId(relationshipId);
    const ok = await unblockRelationship(relationshipId);
    if (ok) {
      setBlockedUsers((prev) => prev.filter((user) => user.id !== relationshipId));
    }
    setBusyRequestId(null);
  };

  return (
    <div className="space-y-5">
      <FriendRequestsPanel
        requests={requests}
        loading={requestsLoading}
        busyRequestId={busyRequestId}
        onAccept={handleAccept}
        onReject={handleReject}
        onViewAll={() => {
          setModalTab("requests");
          setModalOpen(true);
        }}
      />

      <FriendsPanel
        friends={friends}
        loading={friendsLoading}
        onViewAll={() => {
          setModalTab("friends");
          setModalOpen(true);
        }}
      />

      <BlockedUsersPanel
        blockedUsers={blockedUsers}
        loading={blockedLoading}
        busyId={busyRequestId}
        onUnblock={handleUnblock}
      />

      <RelationshipListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
        currentUserId={currentUserId}
        busyRequestId={busyRequestId}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </div>
  );
};

export default SocialRightContent;
