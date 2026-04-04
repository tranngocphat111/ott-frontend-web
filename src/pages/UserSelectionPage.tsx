import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, LogIn, Loader2 } from "lucide-react";
import Avatar from "../components/common/Avatar";
import { UserService } from "../services";
import { useUser } from "../contexts/UserContext";
import type { User } from "../types";

const UserSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser, setSecondUser, currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/chat", { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      setError("Không thể tải danh sách người dùng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    if (!user._id) return;

    setSelectedUserIds((prev) => {
      if (prev.includes(user._id!)) {
        // Deselect if already selected
        return prev.filter((id) => id !== user._id);
      } else if (prev.length < 2) {
        // Add if less than 2 selected
        return [...prev, user._id!];
      } else {
        // Replace first one if already 2 selected
        return [prev[1], user._id!];
      }
    });
  };

  const handleLogin = () => {
    if (selectedUserIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 người dùng");
      return;
    }

    const user1 = users.find((u) => u._id === selectedUserIds[0]);
    const user2 =
      selectedUserIds.length > 1
        ? users.find((u) => u._id === selectedUserIds[1])
        : null;

    if (user1) {
      setCurrentUser(user1);
      if (user2) {
        setSecondUser(user2);
      }
      navigate("/chat", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary-500 to-primary-400 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary-500 to-primary-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadUsers}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-500 to-primary-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chào mừng đến Chat App
          </h1>
          <p className="text-gray-600">
            Chọn 1 hoặc 2 tài khoản để test chat (tối đa 2)
          </p>
          {selectedUserIds.length > 0 && (
            <p className="text-primary-500 text-sm mt-2 font-medium">
              Đã chọn: {selectedUserIds.length}/2 người dùng
            </p>
          )}
        </div>

        {/* User List */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {users.map((user) => {
            const isSelected = selectedUserIds.includes(user._id || "");
            const selectionIndex = selectedUserIds.indexOf(user._id || "");

            return (
              <button
                key={user._id}
                onClick={() => handleSelectUser(user)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200
                  ${
                    isSelected
                      ? "bg-primary-500 shadow-lg scale-[1.02]"
                      : "bg-gray-50 hover:bg-gray-100 hover:shadow-md"
                  }
                `}
              >
                <Avatar
                  src={user.avatar}
                  name={user.display_name || user.name || "User"}
                  size={56}
                  className={`ring-2 ${
                    isSelected ? "ring-white" : "ring-gray-200"
                  }`}
                />
                <div className="flex-1 text-left">
                  <h3
                    className={`font-semibold text-lg ${
                      isSelected ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {user.display_name}
                  </h3>
                  <p
                    className={`text-sm ${
                      isSelected ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {user.status === "online"
                      ? "🟢 Trực tuyến"
                      : "⚫ Ngoại tuyến"}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-bold">
                      {selectionIndex === 0 ? "User 1" : "User 2"}
                    </span>
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={selectedUserIds.length === 0}
          className={`
            w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200
            flex items-center justify-center gap-2
            ${
              selectedUserIds.length > 0
                ? "bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          <LogIn className="w-5 h-5" />
          Đăng nhập {selectedUserIds.length > 1 ? "2 người" : ""}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          {selectedUserIds.length === 2
            ? "✅ Đã chọn 2 người - Có thể chuyển đổi giữa 2 tài khoản trong app"
            : selectedUserIds.length === 1
              ? "Chọn thêm 1 người nữa để test chat 2 chiều"
              : "Chọn 1-2 tài khoản để bắt đầu"}
        </p>
      </div>
    </div>
  );
};

export default UserSelectionPage;
