import React, { useState, useMemo, useEffect } from "react";
import { X, Search, Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import avatar from "../../../assets/avatar.png";
import { 
  fetchFriends, 
  fetchPendingRequests,
  type FriendOption, 
  type FriendRequestOption 
} from "../../../services/social.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab: "requests" | "friends";
  currentUserId: string;
  busyRequestId: string | null;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const stringToColor = (str: string) => {
  if (!str) return "#ccc";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const PAGE_SIZE = 10;

export const RelationshipListModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialTab,
  currentUserId,
  busyRequestId,
  onAccept,
  onReject,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"requests" | "friends">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Paginated states
  const [friendsList, setFriendsList] = useState<FriendOption[]>([]);
  const [requestsList, setRequestsList] = useState<FriendRequestOption[]>([]);
  const [friendsPage, setFriendsPage] = useState(0);
  const [requestsPage, setRequestsPage] = useState(0);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [hasMoreFriends, setHasMoreFriends] = useState(true);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);

  // Load friends from backend
  const loadMoreFriends = async (reset = false) => {
    if (!currentUserId || friendsLoading || (!reset && !hasMoreFriends)) return;
    setFriendsLoading(true);
    const nextPage = reset ? 0 : friendsPage;
    
    try {
      const data = await fetchFriends(currentUserId, nextPage, PAGE_SIZE);
      if (reset) {
        setFriendsList(data);
        setFriendsPage(1);
        setHasMoreFriends(data.length === PAGE_SIZE);
      } else {
        setFriendsList(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(f => f.id));
          const uniques = data.filter(f => !existingIds.has(f.id));
          return [...prev, ...uniques];
        });
        setFriendsPage(prev => prev + 1);
        setHasMoreFriends(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFriendsLoading(false);
    }
  };

  // Load pending requests from backend
  const loadMoreRequests = async (reset = false) => {
    if (!currentUserId || requestsLoading || (!reset && !hasMoreRequests)) return;
    setRequestsLoading(true);
    const nextPage = reset ? 0 : requestsPage;

    try {
      const data = await fetchPendingRequests(currentUserId, nextPage, PAGE_SIZE);
      if (reset) {
        setRequestsList(data);
        setRequestsPage(1);
        setHasMoreRequests(data.length === PAGE_SIZE);
      } else {
        setRequestsList(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(r => r.id));
          const uniques = data.filter(r => !existingIds.has(r.id));
          return [...prev, ...uniques];
        });
        setRequestsPage(prev => prev + 1);
        setHasMoreRequests(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Trigger loads
  useEffect(() => {
    if (isOpen && currentUserId) {
      setActiveTab(initialTab);
      setSearchQuery("");
      if (initialTab === "friends") {
        loadMoreFriends(true);
      } else {
        loadMoreRequests(true);
      }
    }
  }, [isOpen, initialTab, currentUserId]);

  // Trigger load when activeTab changes
  useEffect(() => {
    if (isOpen && currentUserId) {
      setSearchQuery("");
      if (activeTab === "friends") {
        loadMoreFriends(true);
      } else {
        loadMoreRequests(true);
      }
    }
  }, [activeTab]);

  const goProfile = (userId: string) => {
    onClose();
    navigate(`/social/profile/${userId}`);
  };

  // Local actions to update state instantly
  const handleAcceptRequest = async (relationshipId: string) => {
    await onAccept(relationshipId);
    setRequestsList(prev => prev.filter(r => r.id !== relationshipId));
    // Reload friends list to sync the newly accepted friend
    loadMoreFriends(true);
  };

  const handleRejectRequest = async (relationshipId: string) => {
    await onReject(relationshipId);
    setRequestsList(prev => prev.filter(r => r.id !== relationshipId));
  };

  // Filtered lists (client-side filter on current loaded pages for speed)
  const filteredFriends = useMemo(() => {
    return friendsList.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friendsList, searchQuery]);

  const filteredRequests = useMemo(() => {
    return requestsList.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requestsList, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Danh sách liên kết</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => {
              setActiveTab("friends");
            }}
            className={`flex-1 py-3 text-sm font-semibold transition text-center border-b-2 ${
              activeTab === "friends"
                ? "text-primary-600 border-primary-500 bg-white"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Bạn bè
          </button>
          <button
            onClick={() => {
              setActiveTab("requests");
            }}
            className={`flex-1 py-3 text-sm font-semibold transition text-center border-b-2 ${
              activeTab === "requests"
                ? "text-primary-600 border-primary-500 bg-white"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Lời mời kết bạn
          </button>
        </div>

        {/* Search filter */}
        <div className="p-4 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Tìm kiếm nhanh trong trang hiện tại...`}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50/50"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "friends" ? (
            <>
              {friendsLoading && friendsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="size-8 animate-spin text-primary-400" />
                  <p className="text-sm text-gray-400 mt-2">Đang tải danh sách...</p>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Users className="size-12 text-gray-200" />
                  <p className="text-sm text-gray-400 mt-2">Không tìm thấy bạn bè nào</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => goProfile(friend.id)}
                          style={{ backgroundColor: stringToColor(friend.name) }}
                          className="size-11 rounded-full overflow-hidden shrink-0 shadow flex items-center justify-center text-white font-bold text-sm"
                        >
                          {friend.avatarUrl ? (
                            <img
                              src={friend.avatarUrl === "/avatar/avatar.png" ? avatar : friend.avatarUrl}
                              alt={friend.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span>{getInitials(friend.name)}</span>
                          )}
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => goProfile(friend.id)}
                            className="font-semibold text-gray-800 text-sm hover:underline block text-left truncate"
                          >
                            {friend.name}
                          </button>
                          <p className="text-xs text-gray-400 mt-0.5">Bạn bè</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => goProfile(friend.id)}
                        className="px-3 py-1.5 border border-primary-200 text-primary-600 rounded-lg text-xs font-semibold hover:bg-primary-50 transition"
                      >
                        Trang cá nhân
                      </button>
                    </div>
                  ))}
                  
                  {hasMoreFriends && (
                    <button
                      onClick={() => loadMoreFriends(false)}
                      disabled={friendsLoading}
                      className="w-full py-2 text-sm text-primary-500 font-semibold hover:bg-primary-50 disabled:text-gray-400 rounded-xl transition mt-2 border border-dashed border-primary-200 flex items-center justify-center gap-2"
                    >
                      {friendsLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Đang tải thêm...
                        </>
                      ) : (
                        "Xem thêm bạn bè (tải thêm 10 người)"
                      )}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {requestsLoading && requestsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="size-8 animate-spin text-primary-400" />
                  <p className="text-sm text-gray-400 mt-2">Đang tải lời mời...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Users className="size-12 text-gray-200" />
                  <p className="text-sm text-gray-400 mt-2">Chưa có lời mời nào</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredRequests.map((req) => (
                    <div key={req.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                      <button
                        type="button"
                        onClick={() => goProfile(req.userId)}
                        style={{ backgroundColor: stringToColor(req.name) }}
                        className="size-11 rounded-full overflow-hidden shrink-0 shadow flex items-center justify-center text-white font-bold text-sm"
                      >
                        {req.avatarUrl ? (
                          <img
                            src={req.avatarUrl}
                            alt={req.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span>{getInitials(req.name)}</span>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => goProfile(req.userId)}
                          className="font-semibold text-gray-800 text-sm hover:underline block text-left truncate"
                        >
                          {req.name}
                        </button>
                        <p className="text-xs text-gray-400 mt-0.5">Muốn kết bạn</p>
                        
                        <div className="flex gap-2 mt-2.5">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            disabled={busyRequestId === req.id}
                            className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-200 text-white py-1 rounded-lg text-xs font-semibold transition"
                          >
                            Xác nhận
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={busyRequestId === req.id}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {hasMoreRequests && (
                    <button
                      onClick={() => loadMoreRequests(false)}
                      disabled={requestsLoading}
                      className="w-full py-2 text-sm text-primary-500 font-semibold hover:bg-primary-50 disabled:text-gray-400 rounded-xl transition mt-2 border border-dashed border-primary-200 flex items-center justify-center gap-2"
                    >
                      {requestsLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Đang tải thêm...
                        </>
                      ) : (
                        "Xem thêm lời mời (tải thêm 10 người)"
                      )}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
