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
}

const PostsTab: React.FC<PostsTabProps> = ({
  posts,
  userReactionMap,
  postReactionCountsMap,
  currentUser,
  loading,
  onToggleLike,
  onDeletePost,
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
    />
  );
};

export default PostsTab;
