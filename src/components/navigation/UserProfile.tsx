import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    if (user?.id) {
      navigate(`/social/profile/${user.id}`);
    }
  };

  if (!user) return null;

  return (
    <div className="mb-8 relative group">
      <div
        className="relative cursor-pointer"
        onClick={handleAvatarClick}
        title="Xem trang cá nhân">
        <Avatar
          src={user.avatarUrl}
          name={user.fullName || "User"}
          size={40}
          className="ring-2 ring-primary-500 cursor-pointer hover:ring-4 transition-all"
        />
      </div>

      {/* Popup on hover */}
      <div className="absolute left-10 top-0 bg-white rounded-lg shadow-xl p-2 hidden group-hover:block z-50 min-w-40 border border-gray-200">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded">
              Đang dùng
            </span>
          </div>
          <p className="font-semibold text-gray-900">
            {user.fullName}
          </p>
          <p className="text-xs text-green-500">
            🟢 Trực tuyến
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
