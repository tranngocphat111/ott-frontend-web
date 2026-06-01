import React, { useEffect, useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  cancelRelationship,
  acceptFriendRequest,
  blockRelationship,
  blockUserDirectly,
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
import { ConversationService } from "../../services/conversation.service";
import { useConversations } from "../../contexts/ConversationsContext";
import {
  buildVirtualPrivateConversationItem,
  cacheVirtualConversation,
  persistPendingChatOpenTarget,
} from "../../utils/chatConversation";

interface ProfileActionsProps {
  isOwner: boolean;
  currentUserId: string;
  profileUserId?: string;
  profileDisplayName?: string;
  profileAvatarUrl?: string;
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
  profileDisplayName,
  profileAvatarUrl,
  onEditProfile,
}) => {
  const navigate = useNavigate();
  const { conversations, addConversation } = useConversations();
  const [relationship, setRelationship] = useState<RelationshipResponse | null>(
    null,
  );
  const [currentStatus, setCurrentStatus] = useState<string>("REMOVED");
  const [profileAction, setProfileAction] = useState<ProfileActionProps>({
    currentAction: "Kết bạn",
    actionFn: () => {},
  });

  const [isPopUpShown, setIsPopUpShown] = useState<boolean>(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  const handleOpenChat = useCallback(async () => {
    if (!currentUserId || !profileUserId || currentUserId === profileUserId) {
      return;
    }

    try {
      setIsOpeningChat(true);

      const existingLocal = conversations.find((item) => {
        if (item.conversation.type !== "private") return false;
        return item.conversation.participants?.some(
          (participant) =>
            String(participant.user_id || participant._id || "") ===
            String(profileUserId),
        );
      });

      let targetConversation = existingLocal?.conversation;

      if (!targetConversation) {
        try {
          const existingRemote =
            await ConversationService.findPrivateConversation(
              currentUserId,
              profileUserId,
            );
          if (existingRemote?._id) {
            targetConversation = existingRemote;
            addConversation(existingRemote);
          }
        } catch (error) {
          console.warn("Không thể kiểm tra hội thoại riêng hiện có:", error);
        }
      }

      if (!targetConversation) {
        const virtualItem = buildVirtualPrivateConversationItem({
          currentUserId,
          targetUserId: profileUserId,
          targetName: profileDisplayName,
          targetAvatar: profileAvatarUrl,
        });
        targetConversation = virtualItem.conversation;
        cacheVirtualConversation(currentUserId, virtualItem);
      }

      const openTarget = {
        conversationId: targetConversation._id,
        conversation: targetConversation,
        at: Date.now(),
      };

      persistPendingChatOpenTarget(openTarget);
      navigate("/chat", {
        state: {
          openConversation: openTarget,
        },
      });
    } finally {
      setIsOpeningChat(false);
    }
  }, [
    addConversation,
    conversations,
    currentUserId,
    navigate,
    profileAvatarUrl,
    profileDisplayName,
    profileUserId,
  ]);

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
          case "REQUEST_CANCELLED":
          case "UNFRIENDED":
            setCurrentStatus("REMOVED");
            break;
          case "BLOCKED":
          case "USER_BLOCKED":
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
    let ok = false;
    if (relationship?.id) {
      ok = await blockRelationship(relationship.id, currentUserId);
    } else {
      ok = await blockUserDirectly(currentUserId, profileUserId);
    }
    
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
    refreshRelationship();
  }, [refreshRelationship]);

  useEffect(() => {
    const getProfileAction = (status: string | null) => {
      if (status === "REMOVED" || status === "BLOCKED") {
        setProfileAction({
          currentAction: "Kết bạn",
          actionFn: async () => {
            await sendFriendRequest(currentUserId, profileUserId);
            setCurrentStatus("PENDING");
            setRelationship((prev) => prev ? { ...prev, requesterId: currentUserId } : { requesterId: currentUserId, receiverId: profileUserId, id: "", status: "PENDING", type: "FRIEND", createAt: new Date(), acceptedAt: new Date(), requesterUsername: "", requesterAvatarUrl: "", receiverUsername: "", receiverAvatarUrl: "" });
          },
        });
        return;
      }

      if (status === "PENDING") {
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

    getProfileAction(currentStatus);
  }, [
    currentUserId,
    profileUserId,
    currentStatus,
    relationship?.id,
    relationship?.requesterId,
  ]);

  useEffect(() => {
    if (!currentUserId || !profileUserId) return;

    relationshipSocketService.connect();
    relationshipSocketService.joinUserRoom(currentUserId);

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
    <div className="mb-4 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-center md:justify-end">
      {isOwner ?
        <button
          onClick={onEditProfile}
          className="w-full rounded-lg bg-primary-100 px-6 py-2 text-sm font-medium text-primary-800 transition hover:bg-primary-200 sm:w-auto">
          Chỉnh sửa trang cá nhân
        </button>
      : <>
          <div className="relative inline-block">
            <button
              onClick={profileAction.actionFn}
              disabled={currentStatus === "BLOCKED" || undefined}
              className="w-full rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-200 disabled:text-primary-500 sm:w-auto">
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

          <button
            onClick={handleOpenChat}
            disabled={isOpeningChat || currentStatus === "BLOCKED"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-100 bg-primary-50 px-6 py-2 text-sm font-medium text-primary-900 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:bg-primary-50 disabled:text-primary-300 sm:w-auto"
          >
            <MessageCircle className="size-4" />
            {isOpeningChat ? "Đang mở..." : "Nhắn tin"}
          </button>
        </>
      }
    </div>
  );
};

export default ProfileActions;
