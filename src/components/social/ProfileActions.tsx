import React, { useEffect, useState, useCallback } from "react";
import {
  cancelRelationship,
  acceptFriendRequest,
  blockRelationship,
  fetchRelationshipOf,
  rejectFriendRequest,
  sendFriendRequest,
  unfriendRelationship,
  type RelationshipResponse,
} from "../../services/social.service";
import {
  relationshipSocketService,
  type RelationshipRealtimePayload,
} from "../../services/relationshipSocket.service";

interface ProfileActionsProps {
  isOwner: boolean;
  currentUserId: string;
  profileUserId?: string;
  onEditProfile: () => void;
}
interface ProfileActionProps {
  currentAction: string;
  actionFn: () => any;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  isOwner,
  currentUserId,
  profileUserId,
  onEditProfile,
}) => {
  const [relationship, setRelationship] = useState<RelationshipResponse | null>(
    null,
  );
  const [currentStatus, setCurrentStatus] = useState<string>("REMOVED");
  const [profileAction, setProfileAction] = useState<ProfileActionProps>({
    currentAction: "Kết bạn",
    actionFn: () => {},
  });

  const [isPopUpShown, setIsPopUpShown] = useState<boolean>(false);

  const updateFromPayload = useCallback(
    (payload: RelationshipRealtimePayload) => {
      if (!payload || !profileUserId) return;

      const involvesProfile =
        payload.requesterId === profileUserId ||
        payload.receiverId === profileUserId;

      if (!involvesProfile) return;

      if (payload.relationshipId || payload.requesterId || payload.receiverId) {
        setRelationship((prev) => {
          if (
            !prev &&
            payload.relationshipId &&
            payload.requesterId &&
            payload.receiverId
          ) {
            return {
              id: payload.relationshipId,
              requesterId: payload.requesterId,
              requesterUsername: "",
              requesterAvatarUrl: "",
              receiverId: payload.receiverId,
              receiverUsername: "",
              receiverAvatarUrl: "",
              status: "PENDING",
              type: "FRIEND",
              createAt: new Date(0),
              acceptedAt: new Date(0),
            } as RelationshipResponse;
          }

          if (!prev) return prev;

          return {
            ...prev,
            id: payload.relationshipId ?? prev.id,
            requesterId: payload.requesterId ?? prev.requesterId,
            receiverId: payload.receiverId ?? prev.receiverId,
          };
        });
      }

      if (payload.status) {
        setCurrentStatus(payload.status);
      } else {
        switch (payload.type) {
          case "REQUEST_SENT":
            setCurrentStatus("PENDING");
            break;
          case "REQUEST_ACCEPTED":
            setCurrentStatus("ACCEPTED");
            break;
          case "REQUEST_REJECTED":
          case "REQUEST_CANCELED":
          case "UNFRIENDED":
            setCurrentStatus("REMOVED");
            break;
          case "BLOCKED":
            setCurrentStatus("BLOCKED");
            break;
          default:
            break;
        }
      }
    },
    [profileUserId],
  );

  const handleAccept = async () => {
    if (!relationship?.id) return;
    const ok = await acceptFriendRequest(relationship.id);
    if (ok) {
      setCurrentStatus("ACCEPTED");
    }
    setIsPopUpShown(false);
  };

  const handleReject = async () => {
    if (!relationship?.id) return;
    const ok = await rejectFriendRequest(relationship.id);
    if (ok) {
      setCurrentStatus("REMOVED");
    }
    setIsPopUpShown(false);
  };

  const handleBlock = async () => {
    if (!relationship?.id) return;
    const ok = await blockRelationship(relationship.id, currentUserId);
    if (ok) {
      setCurrentStatus("BLOCKED");
    }
    setIsPopUpShown(false);
  };

  const handleUnfriend = async () => {
    if (!relationship?.id) return;
    const ok = await unfriendRelationship(relationship.id);
    if (ok) {
      setCurrentStatus("REMOVED");
    }
    setIsPopUpShown(false);
  };

  const refreshRelationship = useCallback(async () => {
    const res = await fetchRelationshipOf(currentUserId, profileUserId);
    setRelationship(res);
    setCurrentStatus(!res ? "REMOVED" : res.status);
  }, [currentUserId, profileUserId]);

  useEffect(() => {
    const getProfileAction = (status: string | null) => {
      if (status === "REMOVED" || status === "BLOCKED") {
        setProfileAction({
          currentAction: "Kết bạn",
          actionFn: async () => {
            await sendFriendRequest(currentUserId, profileUserId);
            setCurrentStatus("PENDING");
          },
        });
        return;
      }

      if (status === "PENDING") {
        console.log(relationship?.requesterId);
        if (relationship?.requesterId === currentUserId) {
          setProfileAction({
            currentAction: "Đã gửi lời mời kết bạn",
            actionFn: async () => {
              await cancelRelationship(relationship?.id || null);
              setCurrentStatus("REMOVED");
            },
          });
        } else {
          setProfileAction({
            currentAction: "Chấp nhận lời mời",
            actionFn: () => {
              setIsPopUpShown(true);
            },
          });
        }
      }

      if (status === "ACCEPTED") {
        setProfileAction({
          currentAction: "Bạn bè",
          actionFn: () => {
            setIsPopUpShown(true);
          },
        });
      }
    };

    refreshRelationship();

    getProfileAction(currentStatus);
  }, [
    currentUserId,
    profileUserId,
    currentStatus,
    relationship?.id,
    relationship?.requesterId,
    refreshRelationship,
  ]);

  useEffect(() => {
    if (!currentUserId || !profileUserId) return;

    const handleRelationshipUpdate = (payload: RelationshipRealtimePayload) => {
      if (!payload) return;

      const targetIds = payload.targetUserIds || [];
      const isTarget =
        targetIds.includes(currentUserId) ||
        payload.requesterId === currentUserId ||
        payload.receiverId === currentUserId;

      const involvesProfile =
        payload.requesterId === profileUserId ||
        payload.receiverId === profileUserId;

      if (!isTarget || !involvesProfile) return;

      updateFromPayload(payload);
    };

    relationshipSocketService.onRelationshipUpdate(handleRelationshipUpdate);
    return () =>
      relationshipSocketService.offRelationshipUpdate(handleRelationshipUpdate);
  }, [currentUserId, profileUserId, updateFromPayload]);

  useEffect(() => {
    if (!currentUserId || !profileUserId) return;

    const handleConnect = () => {
      refreshRelationship();
    };

    relationshipSocketService.onConnect(handleConnect);
    return () => relationshipSocketService.offConnect(handleConnect);
  }, [currentUserId, profileUserId, refreshRelationship]);

  return (
    <div className="flex gap-2 mb-4">
      {isOwner ?
        <button
          onClick={onEditProfile}
          className="bg-primary-100 text-primary-800 px-6 py-2 rounded-lg hover:bg-primary-200 transition font-medium text-sm">
          Chỉnh sửa trang cá nhân
        </button>
      : <>
          <div className="relative inline-block">
            <button
              onClick={profileAction.actionFn}
              disabled={currentStatus === "BLOCKED" || undefined}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-primary-200 disabled:text-primary-500 disabled:cursor-not-allowed transition font-medium text-sm shadow-sm">
              {profileAction.currentAction}
            </button>

            {/* Popup Menu */}
            {isPopUpShown && (
              <ul className="absolute left-0 mt-2 w-48 bg-white border border-primary-100 rounded-lg shadow-lg z-50 py-1">
                {currentStatus === "PENDING" &&
                  relationship?.requesterId !== currentUserId && (
                    <li
                      onClick={handleAccept}
                      className="px-4 py-2 text-sm text-primary-800 hover:bg-primary-50 cursor-pointer transition-colors">
                      Đồng ý
                    </li>
                  )}
                {currentStatus === "PENDING" && (
                  <li
                    onClick={handleReject}
                    className="px-4 py-2 text-sm text-primary-800 hover:bg-primary-50 cursor-pointer transition-colors">
                    Xóa lời mời kết bạn
                  </li>
                )}
                {currentStatus === "ACCEPTED" && (
                  <li
                    onClick={handleUnfriend}
                    className="px-4 py-2 text-sm text-primary-800 hover:bg-primary-50 cursor-pointer transition-colors">
                    Xóa kết bạn
                  </li>
                )}
                <li
                  onClick={handleBlock}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors">
                  Chặn
                </li>
              </ul>
            )}
          </div>

          <button className="bg-primary-50 text-primary-900 px-6 py-2 rounded-lg border border-primary-100 hover:bg-primary-100 transition font-medium text-sm">
            Nhắn tin
          </button>
        </>
      }
    </div>
  );
};

export default ProfileActions;
