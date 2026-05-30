import React from "react";
import type { Post, PostUser } from "./types";
import type { ReactionKey } from "./post/reactions";
import PostsList from "./feed/PostsList";

interface Props {
  posts: Post[];
  /** postId → reactionKey hiện tại của user (được lấy từ server khi mount) */
  userReactionMap: Record<string, string>;
  /** postId → { like: N, love: N, ... } - số lượng từng loại reaction (không phụ thuộc user) */
  postReactionCountsMap: Record<string, Record<string, number>>;
  onToggleLike: (id: string, key: ReactionKey | null) => void;
  onDelete: (id: string) => void;
  onEdit: (post: Post) => void;
  onShare?: (
    postId: string,
    caption?: string,
    visibility: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  currentUser: PostUser;
  loading?: boolean;
  loadError?: string | null;
}

const PostFeed: React.FC<Props> = ({
  posts,
  userReactionMap,
  postReactionCountsMap,
  onToggleLike,
  onDelete,
  onEdit,
  onShare,
  currentUser,
  loading = false,
  loadError = null,
}) => (
  <main className="w-full">
    <PostsList
      posts={posts}
      userReactionMap={userReactionMap}
      postReactionCountsMap={postReactionCountsMap}
      onToggleLike={onToggleLike}
      onDelete={onDelete}
      onEdit={onEdit}
      onShare={onShare}
      currentUser={currentUser}
      loading={loading}
      loadError={loadError}
    />
  </main>
);

export default PostFeed;
