import React from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";

const UserProfile: React.FC = () => {
  const { currentUser, secondUser, switchToUser, logout, logoutAll } =
    useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (!secondUser) {
      navigate("/select-user", { replace: true });
    }
  };

  const handleLogoutAll = () => {
    logoutAll();
    navigate("/select-user", { replace: true });
  };

  const handleSwitchUser = () => {
    if (secondUser?._id) {
      switchToUser(secondUser._id);
      // Reload page để cập nhật conversations
      window.location.reload();
    }
  };

  const handleAvatarClick = () => {
    if (currentUser?.user_id) {
      navigate(`/social/profile/${currentUser.user_id}`);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="mb-8 relative group">
      <div
        className="relative cursor-pointer"
        onClick={handleAvatarClick}
        title="Xem trang cá nhân">
        <Avatar
          src={currentUser.avatar}
          name={currentUser.display_name || currentUser.name || "User"}
          size={40}
          className="ring-2 ring-primary-500 cursor-pointer hover:ring-4 transition-all"
        />
        {/* Badge hiển thị có user thứ 2 */}
        {secondUser && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs font-bold">2</span>
          </div>
        )}
      </div>

      {/* Popup on hover */}
      <div className="absolute left-10 top-0 bg-white rounded-lg shadow-xl p-2 hidden group-hover:block z-50 min-w-50 border border-gray-200">
        {/* Current User */}
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded">
              Đang dùng
            </span>
          </div>
          <p className="font-semibold text-gray-900">
            {currentUser.display_name || currentUser.name}
          </p>
          <p className="text-xs text-gray-500">
            {currentUser.status === "online" ?
              "🟢 Trực tuyến"
            : "⚫ Ngoại tuyến"}
          </p>
        </div>

        {/* Second User */}
        {secondUser && (
          <>
            <button
              onClick={handleSwitchUser}
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-primary-50 transition-colors text-sm border-b border-gray-200">
              <RefreshCw className="w-4 h-4 text-primary-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">Chuyển sang</p>
                <p className="text-xs text-gray-500">
                  {secondUser.display_name || secondUser.name}
                </p>
              </div>
            </button>
          </>
        )}

        {/* Logout current */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 transition-colors text-sm">
          <LogOut className="w-4 h-4" />
          Đăng xuất {secondUser ? "user này" : ""}
        </button>

        {/* Logout all */}
        {secondUser && (
          <button
            onClick={handleLogoutAll}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50  transition-colors text-sm border-t border-gray-200">
            <LogOut className="w-4 h-4" />
            Đăng xuất cả 2
          </button>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
