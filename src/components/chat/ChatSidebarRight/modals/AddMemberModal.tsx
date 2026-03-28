import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useUser } from "../../../../contexts/UserContext";
import { ConversationService, UserService } from "../../../../services";
import Avatar from "../../../common/Avatar";
import type { User } from "../../../../types";
import type { AddMemberModalProps } from "../../../../interfaces";

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  currentMembers,
  onMembersAdded,
}) => {
  const { currentUser } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const users = await UserService.getAllUsers();
      // Filter out current members
      const currentMemberIds = new Set(currentMembers.map((m) => m.user_id));
      const filtered = users.filter((user) => {
        const id = user._id || user.user_id;
        if (!id) return false;
        return !currentMemberIds.has(id);
      });
      setAvailableUsers(filtered);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const filteredUsers = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAddMembers = async () => {
    if (selectedUsers.size === 0) return;

    setLoading(true);
    try {
      const userIds = Array.from(selectedUsers);
      const result = await ConversationService.addMembers(
        conversationId,
        userIds,
        currentUser?._id || ""
      );

      onMembersAdded(result.members || []);
      onClose();
      setSelectedUsers(new Set());
      setSearchTerm("");
    } catch (error) {
      console.error("Error adding members:", error);
      alert(
        error instanceof Error ? error.message : "Không thể thêm thành viên"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedUsers(new Set());
    setSearchTerm("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Thêm thành viên
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm theo tên"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Gợi ý</h3>
          <div className="space-y-2">
            {filteredUsers.map((user) => {
              const userId = user._id || user.user_id;
              if (!userId) return null;

              return (
                <div
                  key={userId}
                  onClick={() => handleToggleUser(userId)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(userId)}
                      onChange={() => {}}
                      className="w-5 h-5 text-primary-500 rounded border-gray-300"
                    />
                  </div>
                  <Avatar src={user.avatar} name={user.name} size={40} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{user.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {selectedUsers.size > 0 && `${selectedUsers.size} người được chọn`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleAddMembers}
              disabled={selectedUsers.size === 0 || loading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Đang thêm..." : "Xác nhận"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;