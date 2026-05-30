import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search } from "lucide-react";
import SocialFeedLayout from "../../components/social/layout/SocialFeedLayout";
import SocialLeftSidebar from "../../components/social/SocialLeftSidebar";
import SocialRightSidebar from "../../components/social/SocialRightSidebar";
import PostCard from "../../components/social/PostCard";
import { useAuth } from "../../contexts/AuthContext";
import { searchPosts, fetchUserReactions } from "../../services/post.service";
import { UserService } from "../../services/user.service";
import { sendFriendRequest, fetchRelationshipOf, acceptFriendRequest, rejectFriendRequest } from "../../services/social.service";
import { relationshipSocketService, type RelationshipRealtimePayload } from "../../services/relationshipSocket.service";
import { useSocialFeedActions } from "../../hooks/social/useSocialFeedActions";
import type { Post } from "../../components/social/types";
import type { User } from "../../types";
import Avatar from "../../components/common/Avatar";

const SocialSearch: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchMode, setSearchMode] = useState<"posts" | "users">(
    query.trim().startsWith("#") ? "posts" : "users"
  );
  const [userReactionMap, setUserReactionMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Convert current user to Social User format
  useEffect(() => {
    if (user?.id) {
      setCurrentUser({
        id: user.id,
        name: user.fullName || "User",
        displayName: user.fullName || "User",
        avatar: user.avatarUrl,
        initials: user.fullName ? user.fullName[0] : "U",
        color: "bg-primary-500",
      });
    }
  }, [user]);

  // Hook for handling likes, deletion, updating, and sharing
  const { toggleLikePost, handleDeletePost } = useSocialFeedActions({
    currentUser: currentUser || { id: "" },
    setPosts,
    setUserReactionMap,
  });

  // Fetch search results and user reactions
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !query.trim()) {
      setPosts([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    const trimmedQuery = query.trim();
    let currentMode = searchMode;
    if (trimmedQuery.startsWith("#") && searchMode !== "posts") {
      setSearchMode("posts");
      currentMode = "posts";
    }

    const loadSearchResults = async () => {
      setLoading(true);
      try {
        if (currentMode === "posts") {
          const results = await searchPosts(trimmedQuery, user.id, 0, 30);
          setPosts(results);

          // Load user reactions to highlight liked status
          const reactions = await fetchUserReactions(user.id);
          const map: Record<string, string> = {};
          for (const r of reactions) {
            if (r.targetType === "POST") {
              map[r.targetId] = r.reactionType.toLowerCase();
            }
          }
          setUserReactionMap(map);
        } else {
          const foundUsers = await UserService.searchUsers(query.trim());
          const filteredUsers = foundUsers.filter((u: any) => u.relationshipStatus !== 'BLOCKED' && u.relationshipStatus !== 'USER_BLOCKED');
          setUsers(filteredUsers);
        }
      } catch (err) {
        console.error("Failed to load search results", err);
      } finally {
        setLoading(false);
      }
    };

    loadSearchResults();
  }, [query, isAuthenticated, user, searchMode]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const handleRelationshipUpdate = (payload: RelationshipRealtimePayload) => {
      if (!payload) return;

      const targetIds = payload.targetUserIds || [];
      const isTarget = targetIds.includes(currentUser.id) || payload.requesterId === currentUser.id || payload.receiverId === currentUser.id;
      if (!isTarget) return;

      setUsers(prevUsers => prevUsers.map(u => {
        const uId = u._id || u.user_id;
        if (uId === payload.requesterId || uId === payload.receiverId) {
          let newStatus = (u as any).relationshipStatus;
          if (payload.type === "REQUEST_SENT") {
            newStatus = payload.requesterId === currentUser.id ? "PENDING_REQUEST_SENT" : "PENDING_REQUEST_RECEIVED";
          } else if (payload.type === "REQUEST_ACCEPTED") {
            newStatus = "FRIEND";
          } else if (["REQUEST_REJECTED", "REQUEST_CANCELED", "REQUEST_CANCELLED", "UNFRIENDED"].includes(payload.type)) {
            newStatus = "NONE";
          } else if (["BLOCKED", "USER_BLOCKED"].includes(payload.type)) {
            newStatus = "BLOCKED";
          }
          return { ...u, relationshipStatus: newStatus } as User;
        }
        return u;
      }));
    };

    relationshipSocketService.onRelationshipUpdate(handleRelationshipUpdate);
    return () => relationshipSocketService.offRelationshipUpdate(handleRelationshipUpdate);
  }, [currentUser?.id]);

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!currentUser?.id) return;
    try {
      const res = await sendFriendRequest(currentUser.id, receiverId);
      if (res) {
        setUsers(users.map(u => (u._id || u.user_id) === receiverId ? { ...u, relationshipStatus: "PENDING_REQUEST_SENT" } as User : u));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAcceptFriendRequest = async (targetId: string) => {
    if (!currentUser?.id) return;
    try {
      const rel = await fetchRelationshipOf(currentUser.id, targetId);
      if (rel?.id) {
        await acceptFriendRequest(rel.id);
        setUsers(users.map(u => (u._id || u.user_id) === targetId ? { ...u, relationshipStatus: "FRIEND" } as User : u));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectFriendRequest = async (targetId: string) => {
    if (!currentUser?.id) return;
    try {
      const rel = await fetchRelationshipOf(currentUser.id, targetId);
      if (rel?.id) {
        await rejectFriendRequest(rel.id);
        setUsers(users.map(u => (u._id || u.user_id) === targetId ? { ...u, relationshipStatus: "NONE" } as User : u));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <SocialFeedLayout
        center={
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 text-center max-w-md">
              <h2 className="text-lg font-semibold text-gray-900">Yêu cầu đăng nhập</h2>
              <p className="text-gray-500 mt-2">Vui lòng đăng nhập để sử dụng tính năng tìm kiếm bài viết.</p>
              <Link to="/login" className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition">
                Đăng nhập
              </Link>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <SocialFeedLayout
      currentUser={currentUser}
      left={<SocialLeftSidebar currentUser={currentUser} />}
      right={<SocialRightSidebar currentUserId={currentUser?.id} />}
      center={
        <div className="py-6">
          <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kết quả tìm kiếm</h1>
              {query && (
                <p className="text-gray-500 mt-1">
                  Tìm thấy {searchMode === "posts" ? posts.length : users.length} kết quả phù hợp cho từ khóa <span className="font-semibold text-primary-600">"{query}"</span>
                </p>
              )}
            </div>
            {query && (
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {searchMode === "posts" ? posts.length : users.length} kết quả
              </span>
            )}
          </div>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setSearchMode("users")}
              className={`px-4 py-2 font-medium rounded-full transition-colors ${
                searchMode === "users"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Người dùng
            </button>
            <button
              onClick={() => setSearchMode("posts")}
              className={`px-4 py-2 font-medium rounded-full transition-colors ${
                searchMode === "posts"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bài viết
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary-600 rounded-full mb-2" role="status">
                <span className="sr-only">Đang tải...</span>
              </div>
              <p>Đang tìm kiếm...</p>
            </div>
          ) : searchMode === "posts" && posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Không tìm thấy bài viết nào</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Không tìm thấy bài viết nào phù hợp với từ khóa của bạn.
              </p>
            </div>
          ) : searchMode === "users" && users.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Không tìm thấy người dùng nào</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Không tìm thấy người dùng nào phù hợp với từ khóa của bạn.
              </p>
            </div>
          ) : searchMode === "posts" ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onToggleLike={(reaction) => toggleLikePost(post.id, reaction)}
                  onDelete={() => handleDeletePost(post.id)}
                  userReaction={userReactionMap[post.id]}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {users.map((u) => {
                const targetId = u._id || u.user_id;
                const relationshipStatus = (u as any).relationshipStatus;
                
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
                
                const avatarUrl = u.avatar_url || u.avatar;

                return (
                  <div key={targetId} className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Link to={`/social/profile/${targetId}`} className="shrink-0">
                      <div
                        style={{ backgroundColor: stringToColor(u.name) }}
                        className="size-14 rounded-full overflow-hidden shadow flex items-center justify-center text-white font-bold text-lg"
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={u.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span>{getInitials(u.name)}</span>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/social/profile/${targetId}`} className="font-semibold text-gray-800 text-sm hover:underline block truncate text-left">
                        {u.name}
                      </Link>
                      {u.email && <div className="text-gray-500 text-xs truncate mt-0.5">{u.email}</div>}
                      {u.phone && <div className="text-gray-500 text-xs truncate">{u.phone}</div>}
                      {relationshipStatus === "PENDING_REQUEST_RECEIVED" && (
                        <div className="text-gray-400 text-xs mt-0.5">Vừa gửi lời mời</div>
                      )}
                      
                      {currentUser?.id !== targetId && (
                        <div className="flex gap-2 mt-2">
                          {relationshipStatus === "FRIEND" ? (
                            <button disabled className="w-full bg-gray-100 text-gray-600 py-1.5 rounded-lg text-sm font-medium">
                              Bạn bè
                            </button>
                          ) : relationshipStatus === "PENDING_REQUEST_SENT" ? (
                            <button disabled className="w-full bg-gray-100 text-gray-600 py-1.5 rounded-lg text-sm font-medium">
                              Đã gửi lời mời
                            </button>
                          ) : relationshipStatus === "PENDING_REQUEST_RECEIVED" ? (
                            <>
                              <button
                                onClick={() => handleAcceptFriendRequest(targetId)}
                                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-1.5 rounded-lg text-sm font-medium transition"
                              >
                                Xác nhận
                              </button>
                              <button
                                onClick={() => handleRejectFriendRequest(targetId)}
                                className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-800 py-1.5 rounded-lg text-sm font-medium transition"
                              >
                                Xóa
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(targetId)}
                              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-1.5 rounded-lg text-sm font-medium transition"
                            >
                              Thêm bạn bè
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      }
    />
  );
};

export default SocialSearch;
