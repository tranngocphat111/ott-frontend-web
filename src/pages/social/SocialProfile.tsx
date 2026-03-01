import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Camera,
  MapPin,
  Briefcase,
  Heart,
  Users,
  Image,
  Loader2,
} from "lucide-react";
import avatar from "../../assets/avatar.png";
import {
  fetchPostsByUser,
  toggleLike,
  deletePost,
} from "../../services/post.service";
import type { Post, PostUser } from "../../components/social/types";
import PostCard from "../../components/social/PostCard";
import { fetchUsers } from "../../services/social.service";

const AVATAR_COLORS = [
  "bg-primary-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-sky-500",
];

const SocialProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  const [profileUser, setProfileUser] = useState<{
    displayName: string;
    username: string;
    avatarUrl?: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<PostUser>({
    id: "",
    name: "Người dùng",
    color: "bg-primary-500",
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "posts" | "about" | "friends" | "photos"
  >("posts");

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      // Load current user (first user = "me") and profile user
      const users = await fetchUsers();
      const me = users[0];
      if (me) {
        setCurrentUser({
          id: me.id,
          name: me.displayName ?? me.username,
          avatar: me.avatarUrl ?? undefined,
          color: AVATAR_COLORS[0],
        });
      }
      const profile = users.find((u) => u.id === userId);
      if (profile)
        setProfileUser({
          displayName: profile.displayName,
          username: profile.username,
          avatarUrl: profile.avatarUrl ?? undefined,
        });

      // Load posts of this user
      const userPosts = await fetchPostsByUser(userId, me?.id);
      setPosts(userPosts);
      setLoading(false);
    })();
  }, [userId]);

  const handleToggleLike = async (id: string) => {
    if (!currentUser.id) return;
    const wasLiked = likedPosts.includes(id);
    setLikedPosts((prev) =>
      wasLiked ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ?
          { ...p, likes: wasLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }
        : p,
      ),
    );
    const result = await toggleLike(id, currentUser.id);
    if (result !== null) {
      setLikedPosts((prev) =>
        result.liked ?
          [...prev.filter((x) => x !== id), id]
        : prev.filter((x) => x !== id),
      );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, likes: result.totalReactions } : p,
        ),
      );
    }
  };

  const handleDeletePost = async (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await deletePost(id);
  };

  const tabs = [
    { key: "posts", label: "Bài viết" },
    { key: "about", label: "Giới thiệu" },
    { key: "friends", label: "Bạn bè" },
    { key: "photos", label: "Ảnh" },
  ] as const;

  const displayName =
    profileUser?.displayName ?? profileUser?.username ?? `User ${userId ?? ""}`;

  return (
    <div className="bg-primary-500 w-full min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Cover Photo */}
        <div className="relative bg-linear-to-r from-purple-400 via-pink-500 to-red-500 h-64 md:h-80 rounded-b-2xl">
          <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition">
            <Camera className="size-5" />
            <span className="hidden md:inline">Chỉnh sửa ảnh bìa</span>
          </button>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl mx-4 -mt-16 relative shadow-lg">
          <div className="p-6">
            {/* Avatar and Name */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
              <div className="relative -mt-20">
                <div className="size-32 md:size-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  {profileUser?.avatarUrl ?
                    <img
                      src={profileUser.avatarUrl}
                      alt={displayName}
                      className="size-full object-cover"
                    />
                  : <img
                      src={avatar}
                      alt="Profile"
                      className="size-full object-cover"
                    />
                  }
                </div>
                <button className="absolute bottom-2 right-2 bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition">
                  <Camera className="size-4" />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left mb-4">
                <h1 className="text-3xl font-bold text-gray-800">
                  {displayName}
                </h1>
                {profileUser?.username &&
                  profileUser.username !== profileUser.displayName && (
                    <p className="text-gray-400 text-sm mt-0.5">
                      @{profileUser.username}
                    </p>
                  )}
                <p className="text-gray-600 mt-1">
                  <Users className="inline size-4 mr-1" />
                  {posts.length} bài viết
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                {currentUser.id === userId ?
                  <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium">
                    Chỉnh sửa trang cá nhân
                  </button>
                : <>
                    <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition font-medium">
                      Kết bạn
                    </button>
                    <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium">
                      Nhắn tin
                    </button>
                  </>
                }
              </div>
            </div>

            {/* Profile Details */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Briefcase className="size-5 text-gray-500" />
                  <span>Làm việc tại Công ty ABC</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="size-5 text-gray-500" />
                  <span>Sống tại Hà Nội, Việt Nam</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Heart className="size-5 text-gray-500" />
                  <span>Độc thân</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <div className="flex gap-2 px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-4 font-medium whitespace-nowrap transition ${
                    activeTab === tab.key ?
                      "text-blue-500 border-b-2 border-blue-500"
                    : "text-gray-600 hover:bg-gray-100 rounded-t-lg"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 mt-4">
          {/* Left Column - Intro */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow">
              <h2 className="text-xl font-bold mb-4">Giới thiệu</h2>
              <div className="space-y-3">
                <p className="text-center text-gray-600 italic">
                  Thêm tiểu sử để mọi người biết về bạn
                </p>
                <button className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-medium">
                  Chỉnh sửa chi tiết
                </button>
              </div>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Ảnh</h2>
                <button className="text-blue-500 hover:underline">
                  Xem tất cả
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {posts
                  .flatMap((p) =>
                    p.media.filter((m) => m.type === "image").slice(0, 1),
                  )
                  .slice(0, 9)
                  .map((m, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden hover:opacity-80 cursor-pointer bg-gray-100">
                      <img
                        src={m.url}
                        alt=""
                        className="size-full object-cover"
                      />
                    </div>
                  ))}
                {Array.from({
                  length: Math.max(
                    0,
                    9 -
                      posts
                        .flatMap((p) =>
                          p.media.filter((m) => m.type === "image").slice(0, 1),
                        )
                        .slice(0, 9).length,
                  ),
                }).map((_, i) => (
                  <div
                    key={`placeholder-${i}`}
                    className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <Image className="size-8 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Friends */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bạn bè</h2>
                <button className="text-blue-500 hover:underline">
                  Xem tất cả
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="text-center">
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-2">
                      <img
                        src={avatar}
                        alt={`Friend ${i}`}
                        className="size-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium truncate">Bạn bè {i}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Posts */}
          <div className="md:col-span-2 space-y-4">
            {/* Posts List */}
            {loading ?
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-primary-400" />
              </div>
            : posts.length === 0 ?
              <div className="bg-white rounded-2xl p-6 shadow text-center py-12 text-gray-500">
                <p>Chưa có bài viết nào</p>
                <p className="text-sm mt-2">Hãy chia sẻ khoảnh khắc của bạn!</p>
              </div>
            : posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={likedPosts.includes(post.id)}
                  onToggleLike={() => handleToggleLike(post.id)}
                  onDelete={handleDeletePost}
                  currentUser={currentUser}
                />
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialProfile;
