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
  currentUser: PostUser;
  loading?: boolean;
}

const PostFeed: React.FC<Props> = ({
  posts,
  userReactionMap,
  postReactionCountsMap,
  onToggleLike,
  onDelete,
  currentUser,
  loading = false,
}) => (
  <main className="w-full">
    <PostsList
      posts={posts}
      userReactionMap={userReactionMap}
      postReactionCountsMap={postReactionCountsMap}
      onToggleLike={onToggleLike}
      onDelete={onDelete}
      currentUser={currentUser}
      loading={loading}
    />
  </main>
);

export default PostFeed;
