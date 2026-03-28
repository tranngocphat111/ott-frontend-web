import React from "react";

interface ProfileActionsProps {
  isOwner: boolean;
  onEditProfile: () => void;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  isOwner,
  onEditProfile,
}) => {
  return (
    <div className="flex gap-2 mb-4">
      {isOwner ?
        <button
          onClick={onEditProfile}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
          Chỉnh sửa trang cá nhân
        </button>
      : <>
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition font-medium text-sm">
            Kết bạn
          </button>
          <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
            Nhắn tin
          </button>
        </>
      }
    </div>
  );
};

export default ProfileActions;
