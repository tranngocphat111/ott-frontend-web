import React, { useState, useEffect } from "react";
import { X, Search, Loader2, Copy, Check, Link2 } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { ConversationService, fetchFriends, MessageService } from "../../../../services";
import Avatar from "../../../common/Avatar";
import type { User } from "../../../../types";
import { UserService } from "../../../../services/user.service";
import type { AddMemberModalProps } from "../../../../interfaces";
import { getFullUrl } from "../../../../utils";
import { useToast } from "../../../../contexts/ToastContext";

type TabType = "friends" | "link";

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  currentMembers,
  onMembersAdded,
}) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneSearchUser, setPhoneSearchUser] = useState<User | null>(null);
  const [phoneSearching, setPhoneSearching] = useState(false);

  useEffect(() => {
    const loadFriends = async () => {
      if (!currentUser?.id) return;
      try {
        setLoading(true);
        const friends = await fetchFriends(currentUser.id);
        const currentMemberIds = new Set(currentMembers.map((m) => m.user_id));
        const mapped: User[] = (friends || [])
          .filter((f) => !currentMemberIds.has(f.id))
          .map((f) => ({
            user_id: f.id,
            _id: f.id,
            name: f.name,
            display_name: f.name,
            avatar: f.avatarUrl || "",
          } as User));
        setAvailableUsers(mapped);
      } catch (error) {
        console.error("AddMemberModal: Error loading friends:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && currentUser?.id) {
      loadFriends();
    }
  }, [isOpen, currentUser?.id, currentMembers]);

  useEffect(() => {
    const fetchInviteLink = async () => {
      if (!currentUser?.id || !conversationId) return;
      setLinkLoading(true);
      try {
        const link = await ConversationService.getInviteLink(conversationId, currentUser.id);
        setInviteLink(link);
      } catch {
        // Fallback demo link
        setInviteLink(`${window.location.origin}/join?group=${conversationId}`);
      } finally {
        setLinkLoading(false);
      }
    };

    if (isOpen && activeTab === "link" && !inviteLink) {
      fetchInviteLink();
    }
  }, [isOpen, activeTab, inviteLink, conversationId, currentUser?.id]);

  const filteredFriends = availableUsers.filter((user) => {
    const name = user.display_name || user.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
  });

  const handleSearchPhone = async () => {
    if (!searchTerm || searchTerm.length < 9) return;
    setPhoneSearching(true);
    setPhoneSearchUser(null);
    try {
      const user = await UserService.getUserByPhone(searchTerm);
      if (user && !currentMembers.some((m) => m.user_id === user.user_id)) {
        setPhoneSearchUser({
          ...user,
          user_id: user.user_id,
          _id: user.user_id,
          display_name: user.name,
        } as User);
      }
    } catch {
      // not found
    } finally {
      setPhoneSearching(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    const next = new Set(selectedUsers);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedUsers(next);
  };

  const handleAddFriends = async () => {
    if (selectedUsers.size === 0) return;
    setLoading(true);
    try {
      const allSelectedIds = Array.from(selectedUsers);
      const friendIds = allSelectedIds.filter(id => availableUsers.some(u => (u.user_id || u._id) === id));
      const strangerIds = allSelectedIds.filter(id => !availableUsers.some(u => (u.user_id || u._id) === id));

      if (friendIds.length > 0) {
        const result = await ConversationService.addMembers(conversationId, friendIds, currentUser?.id || "");
        onMembersAdded(result.members || []);
      }

      if (strangerIds.length > 0) {
        let currentLink = inviteLink;
        if (!currentLink) {
          currentLink = await ConversationService.getInviteLink(conversationId, currentUser?.id || "");
          setInviteLink(currentLink);
        }
        const linkToSend = currentLink || `${window.location.origin}/join?token=${conversationId}`;

        for (const strangerId of strangerIds) {
          const directConv = await ConversationService.getOrCreatePrivateConversation(currentUser!.id, strangerId);
          await MessageService.sendMessage(
            directConv.conversation._id,
            currentUser!.id,
            linkToSend,
            "link"
          );
        }
      }

      onClose();
      setSelectedUsers(new Set());
      setSearchTerm("");
      setPhoneSearchUser(null);
      if (strangerIds.length > 0 && friendIds.length === 0) {
        showToast(`Đã gửi link mời tham gia nhóm`, "success");
      } else {
        showToast(`Đã thêm thành viên thành công`, "success");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Có lỗi xảy ra", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast("Đã sao chép link tham gia nhóm!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast("Không thể sao chép link", "error");
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedUsers(new Set());
    setSearchTerm("");
    setPhoneSearchUser(null);
    setActiveTab("friends");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 flex flex-col max-h-[75vh] shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Thêm thành viên</h2>
          <button onClick={handleClose} className="cursor-pointer p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${activeTab === "friends"
              ? "text-primary-600 border-b-2 border-primary-500"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Từ danh sách bạn bè
          </button>
          <button
            onClick={() => setActiveTab("link")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors cursor-pointer ${activeTab === "link"
              ? "text-primary-600 border-b-2 border-primary-500"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Link2 size={14} />
            Gửi link mời
          </button>
        </div>

        {/* --- Tab: Bạn bè --- */}
        {activeTab === "friends" && (
          <>
            <div className="px-6 py-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm tên bạn bè..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-1">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-primary-500" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-400 mb-4">
                    {searchTerm ? "Không tìm thấy bạn bè phù hợp" : "Tất cả bạn bè đã là thành viên nhóm"}
                  </p>
                  {searchTerm && searchTerm.length >= 9 && (
                    <button
                      onClick={handleSearchPhone}
                      disabled={phoneSearching}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {phoneSearching ? "Đang tìm kiếm..." : `Tìm kiếm số ${searchTerm}`}
                    </button>
                  )}
                  {phoneSearchUser && (
                    <div
                      onClick={() => handleToggleUser(phoneSearchUser.user_id as string)}
                      className="flex items-center gap-3 p-3 mt-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-gray-100 text-left"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(phoneSearchUser.user_id as string)}
                        readOnly
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <Avatar src={getFullUrl(phoneSearchUser.avatar || "")} name={phoneSearchUser.name} size={38} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{phoneSearchUser.display_name || phoneSearchUser.name}</p>
                        <p className="text-xs text-gray-500">Người lạ</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredFriends.map((user) => {
                    const userId = user.user_id || user._id;
                    if (!userId) return null;
                    return (
                      <div
                        key={userId}
                        onClick={() => handleToggleUser(userId)}
                        className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(userId)}
                          readOnly
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <Avatar src={getFullUrl(user.avatar || "")} name={user.name} size={38} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{user.display_name || user.name}</p>
                        </div>
                      </div>
                    );
                  })}
                  {searchTerm && searchTerm.length >= 9 && !phoneSearchUser && (
                    <div className="pt-2 mt-2 border-t border-gray-100 text-center">
                      <button
                        onClick={handleSearchPhone}
                        disabled={phoneSearching}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {phoneSearching ? "Đang tìm kiếm..." : `Tìm kiếm số ${searchTerm}`}
                      </button>
                    </div>
                  )}
                  {phoneSearchUser && (
                    <div
                      onClick={() => handleToggleUser(phoneSearchUser.user_id as string)}
                      className="flex items-center gap-3 p-2.5 mt-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(phoneSearchUser.user_id as string)}
                        readOnly
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <Avatar src={getFullUrl(phoneSearchUser.avatar || "")} name={phoneSearchUser.name} size={38} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{phoneSearchUser.display_name || phoneSearchUser.name}</p>
                        <p className="text-xs text-gray-500">Người lạ</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <div className="text-sm font-medium text-primary-700">
                {selectedUsers.size > 0 ? `Đã chọn ${selectedUsers.size} người` : ""}
              </div>
              <div className="flex gap-2">
                <button onClick={handleClose} className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                  Hủy
                </button>
                <button
                  onClick={handleAddFriends}
                  disabled={selectedUsers.size === 0 || loading}
                  className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow-md shadow-primary-500/20 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Đang xử lý..." : (Array.from(selectedUsers).some(id => !availableUsers.some(u => (u.user_id || u._id) === id)) ? "Gửi link mời" : "Thêm vào nhóm")}
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- Tab: Link mời --- */}
        {activeTab === "link" && (
          <div className="flex-1 flex flex-col px-6 py-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Link2 size={22} className="text-primary-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Mời bằng link</p>
              <p className="text-xs text-gray-500">
                Sao chép và gửi link này cho người bạn muốn mời. Người lạ sẽ tham gia nhóm sau khi bấm vào link.
              </p>
            </div>

            {/* Link box */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3">
              {linkLoading ? (
                <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
              ) : (
                <span className="flex-1 text-sm text-primary-600 truncate font-mono break-all">
                  {inviteLink || "Đang tải link..."}
                </span>
              )}
            </div>

            <button
              onClick={handleCopyLink}
              disabled={linkLoading || !inviteLink}
              className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-500/20"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Đã sao chép!" : "Sao chép link mời"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              ⚠️ Bất kỳ ai có link đều có thể tham gia nhóm. Chỉ chia sẻ với người bạn tin tưởng.
            </p>

            <div className="flex-1" />

            <button onClick={handleClose} className="cursor-pointer w-full py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMemberModal;
