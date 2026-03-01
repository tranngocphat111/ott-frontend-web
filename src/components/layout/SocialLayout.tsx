import React, { useState, useEffect } from "react";
import type { Post, PostUser, StoryItem } from "../social/types";
import type { UploadedMedia } from "../social/CreatePostModal";
import {
  fetchPosts,
  createPost,
  toggleLike,
  deletePost,
} from "../../services/post.service";
import { fetchUsers } from "../../services/social.service";
import SocialLeftSidebar from "../social/SocialLeftSidebar";
import PostFeed from "../social/PostFeed";
import SocialRightSidebar from "../social/SocialRightSidebar";
import CreatePostModal from "../social/CreatePostModal";

/* ─── Avatar colour palette (fallback cho avatar DB users) ──── */
const AVATAR_COLORS = [
  "bg-primary-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-sky-500",
];

/* ─── Placeholder khi chưa fetch được user từ backend ─── */
const DEFAULT_USER: PostUser = {
  id: "",
  name: "Người dùng",
  color: "bg-primary-500",
};

const SocialLayout: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<PostUser>(DEFAULT_USER);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDB, setLoadingDB] = useState(true);

  /* ── Load data từ backend khi mount ──────────────────── */
  useEffect(() => {
    (async () => {
      try {
        // 1. Lấy danh sách users → user[0] là "mình" (current session)
        const users = await fetchUsers();
        const me = users[0];
        const dbCurrentUser: PostUser | undefined =
          me ?
            {
              id: me.id,
              name: me.displayName ?? me.username,
              avatar: me.avatarUrl ?? undefined,
              color: AVATAR_COLORS[0],
            }
          : undefined;

        if (dbCurrentUser) setCurrentUser(dbCurrentUser);

        // 2. Các user còn lại → Stories (tối đa 5 người)
        const dbStories: StoryItem[] = users.slice(1, 6).map((u) => ({
          id: u.id,
          name: u.displayName ?? u.username,
          isBirthday: false,
        }));
        setStories(dbStories);

        // 3. Lấy posts từ DB
        const dbPosts = await fetchPosts(dbCurrentUser?.id ?? "");
        if (dbPosts && dbPosts.length > 0) {
          setPosts(dbPosts);
        }
        // DB trống hoặc backend không chạy → giữ state rỗng (không dùng mock)
      } catch {
        // backend không khả dụng → feed trống
      } finally {
        setLoadingDB(false);
      }
    })();
  }, []);

  const toggleLikePost = async (id: string) => {
    if (!currentUser.id) return;
    // Optimistic update
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

    // Call API
    const result = await toggleLike(id, currentUser.id);
    if (result !== null) {
      // Sync with actual server state
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
    // Optimistic update
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await deletePost(id);
  };

  const handleNewPost = async (
    content: string,
    media: UploadedMedia[],
    visibility: string,
  ) => {
    if (!currentUser.id) return; // guard: user not loaded yet
    // Optimistic update: hiển thị ngay lập tức
    const tempId = `temp-${Date.now()}`;
    const optimisticPost: Post = {
      id: tempId,
      author: currentUser,
      time: "Vừa xong",
      content,
      media: media.map((m) => ({ type: m.type, url: m.url })),
      likes: 0,
      comments: 0,
      shares: 0,
      visibility,
      relationship: "self",
    };
    setPosts((prev) => [optimisticPost, ...prev]);

    // Gọi API lưu vào DB + S3
    const files = media.map((m) => m.file);
    const saved = await createPost(currentUser.id, content, visibility, files);

    if (saved) {
      // Thay thế bài post tạm bằng bài post từ DB (có ID thực)
      setPosts((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
    }
    // Nếu lỗi → giữ nguyên optimistic post (không rollback để UX mượt)
  };

  return (
    <>
      <div className="bg-primary-50 w-full min-h-screen overflow-y-auto">
        <div className="max-w-350 mx-auto px-4 py-4">
          <div className="flex gap-4">
            <SocialLeftSidebar currentUser={currentUser} />
            <PostFeed
              posts={posts}
              likedPosts={likedPosts}
              onToggleLike={toggleLikePost}
              onDelete={handleDeletePost}
              onOpenModal={() => setIsModalOpen(true)}
              currentUser={currentUser}
              stories={stories}
              loading={loadingDB}
            />
            <SocialRightSidebar />
          </div>
        </div>
      </div>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPost={handleNewPost}
        currentUser={currentUser}
      />
    </>
  );
};

export default SocialLayout;
