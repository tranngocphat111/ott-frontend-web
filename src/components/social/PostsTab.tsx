import React from "react";
import PostList from "./PostList";
import type { Post, PostUser } from "./types";
import type { ReactionKey } from "./post/reactions";

interface PostsTabProps {
  posts: Post[];
  userReactionMap: Record<string, string>;
  postReactionCountsMap: Record<string, Record<string, number>>;
  currentUser: PostUser;
  loading: boolean;
  onToggleLike: (postId: string, reactionKey: ReactionKey | null) => void;
  onDeletePost: (postId: string) => void;
  onEditPost: (post: Post) => void;
  onSharePost?: (postId: string, caption?: string, visibility: string) => Promise<{ ok: boolean; error?: string }>;
}

const PostsTab: React.FC<PostsTabProps> = ({
  posts,
  userReactionMap,
  postReactionCountsMap,
  currentUser,
  loading,
  onToggleLike,
  onDeletePost,
  onEditPost,
  onSharePost,
}) => {
  return (
    <PostList
      posts={posts}
      userReactionMap={userReactionMap}
      postReactionCountsMap={postReactionCountsMap}
      currentUser={currentUser}
      loading={loading}
      onToggleLike={onToggleLike}
      onDeletePost={onDeletePost}
      onEditPost={onEditPost}
      onSharePost={onSharePost}
    />
  );
};

export default PostsTab;
