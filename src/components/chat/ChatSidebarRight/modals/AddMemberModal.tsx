import React, { useState, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { ConversationService, UserService, fetchFriends } from "../../../../services";
import Avatar from "../../../common/Avatar";
import type { User } from "../../../../types";
import type { AddMemberModalProps } from "../../../../interfaces";
import { getFullUrl } from "../../../../utils";

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  currentMembers,
  onMembersAdded,
}) => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneSearchResult, setPhoneSearchResult] = useState<User | null>(null);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      loadUsers();
    }
  }, [isOpen, currentUser?.id, currentMembers]);

  // Phone search logic
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term || term.length < 10 || !/^[0-9]+$/.test(term)) {
      setPhoneSearchResult(null);
      setIsSearchingPhone(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPhone(true);
      try {
        const user = await UserService.getUserByPhone(term);
        if (user && user.user_id !== currentUser?.id) {
          // Check if already in currentMembers
          const isMember = currentMembers.some(m => m.user_id === user.user_id);
          if (!isMember) {
            setPhoneSearchResult(user);
          } else {
            setPhoneSearchResult(null);
          }
        } else {
          setPhoneSearchResult(null);
        }
      } catch (error) {
        console.error('Phone search failed', error);
        setPhoneSearchResult(null);
      } finally {
        setIsSearchingPhone(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, currentUser?.id, currentMembers]);

  const loadUsers = async () => {
    if (!currentUser?.id) {
      console.warn("AddMemberModal: No current user ID found.");
      return;
    }
    try {
      setLoading(true);
      console.log("AddMemberModal: Starting loadUsers. currentUser.id =", currentUser.id);

      const friends = await fetchFriends(currentUser.id);
      console.log("AddMemberModal: fetchFriends raw result =", friends);

      // Filter out current members
      console.log("AddMemberModal: currentMembers props =", currentMembers);
      const currentMemberIds = new Set(currentMembers.map((m) => m.user_id));
      console.log("AddMemberModal: currentMemberIds set =", Array.from(currentMemberIds));

      const mapped: User[] = (friends || [])
        .filter(f => {
          const isMember = currentMemberIds.has(f.id);
          console.log(`AddMemberModal: Friend ${f.name} (${f.id}) is member? ${isMember}`);
          return !isMember;
        })
        .map(f => ({
          user_id: f.id,
          _id: f.id,
          name: f.name,
          display_name: f.name,
          avatar: f.avatarUrl || ""
        } as any));

      console.log("AddMemberModal: Final mapped friends count =", mapped.length);
      console.log("AddMemberModal: Final mapped friends list =", mapped);
      setAvailableUsers(mapped);
    } catch (error) {
      console.error("AddMemberModal: Error in loadUsers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = availableUsers.filter((user) => {
    const nameToSearch = user.display_name || user.name || "";
    return nameToSearch.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        currentUser?.id || ""
      );

      // Backend should return the new members (possibly with 'invited' status)
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
    setPhoneSearchResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 flex flex-col max-h-[70vh] shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Thêm thành viên
          </h2>
          <button
            onClick={handleClose}
            className="cursor-pointer p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
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
              placeholder="Tìm tên hoặc số điện thoại"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2">
          {/* Phone search result section */}
          {searchTerm.trim().length >= 10 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">
                Kết quả tìm kiếm số điện thoại
              </h3>
              {isSearchingPhone ? (
                <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tìm...
                </div>
              ) : phoneSearchResult ? (
                <div
                  onClick={() => handleToggleUser(phoneSearchResult.user_id)}
                  className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-100 rounded-xl cursor-pointer hover:bg-primary-100/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(phoneSearchResult.user_id)}
                    readOnly
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <Avatar src={getFullUrl(phoneSearchResult.avatar || "")} name={phoneSearchResult.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{phoneSearchResult.name}</p>
                    <p className="text-xs text-primary-600">{phoneSearchResult.phone}</p>
                  </div>
                </div>
              ) : (
                <div className="p-2 text-sm text-gray-500 italic">
                  Không tìm thấy người dùng với số điện thoại này
                </div>
              )}
              <div className="h-px bg-gray-100 my-4" />
            </div>
          )}

          {/* <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Gợi ý từ danh sách bạn bè</h3>
          <div className="space-y-1">
            {filteredFriends.length > 0 ? (
              filteredFriends.map((user) => {
                const userId = user.user_id || user._id;
                if (!userId) return null;

                return (
                  <div
                    key={userId}
                    onClick={() => handleToggleUser(userId)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(userId)}
                      readOnly
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Avatar src={getFullUrl(user.avatar || "")} name={user.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user.display_name || user.name}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">Không tìm thấy bạn bè nào</p>
              </div>
            )}
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <div className="text-sm font-medium text-primary-700">
            {selectedUsers.size > 0 ? `Đã chọn ${selectedUsers.size} người` : ""}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleAddMembers}
              disabled={selectedUsers.size === 0 || loading}
              className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow-md shadow-primary-500/20 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Đang xử lý..." : "Thêm vào nhóm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AddMemberModal;
