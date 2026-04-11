import React, { useEffect, useState } from "react";
import {
  cancelRelationship,
  fetchRelationshipOf,
  sendFriendRequest,
  type RelationshipResponse,
} from "../../services/social.service";

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

  useEffect(() => {
    const getRelationship = async () => {
      const res = await fetchRelationshipOf(currentUserId, profileUserId);
      setRelationship(res);
      setCurrentStatus(!res ? "REMOVED" : res.status);
    };

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
              setCurrentStatus("REMOVED");
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

    getRelationship();

    getProfileAction(currentStatus);
  }, [
    currentUserId,
    profileUserId,
    currentStatus,
    relationship?.id,
    relationship?.requesterId,
  ]);

  return (
    <div className="flex gap-2 mb-4">
      {isOwner ?
        <button
          onClick={onEditProfile}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
          Chỉnh sửa trang cá nhân
        </button>
      : <>
          <div className="relative inline-block">
            <button
              onClick={profileAction.actionFn}
              disabled={currentStatus === "BLOCKED" || undefined}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition font-medium text-sm">
              {profileAction.currentAction}
            </button>

            {/* Popup Menu */}
            {isPopUpShown && (
              <ul className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1">
                <li className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
                  Xóa lời mời kết bạn
                </li>
                <li className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors">
                  Chặn
                </li>
              </ul>
            )}
          </div>

          <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
            Nhắn tin
          </button>
        </>
      }
    </div>
  );
};

export default ProfileActions;
