import React from "react";
import { Loader2 } from "lucide-react";
import PostCard from "../../components/social/PostCard";
import type { Post, PostUser } from "../../components/social/types";
import type { ReactionKey } from "../../components/social/post/reactions";

interface PostListProps {
  posts: Post[];
  userReactionMap: Record<string, string>;
  postReactionCountsMap: Record<string, Record<string, number>>;
  currentUser: PostUser;
  loading: boolean;
  onToggleLike: (postId: string, reactionKey: ReactionKey | null) => void;
  onDeletePost: (postId: string) => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  userReactionMap,
  postReactionCountsMap,
  currentUser,
  loading,
  onToggleLike,
  onDeletePost,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow text-center py-12 text-gray-500">
        <p>Chưa có bài viết nào</p>
        <p className="text-sm mt-2">Hãy chia sẻ khoảnh khắc của bạn!</p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          initialReaction={userReactionMap[post.id] as ReactionKey | undefined}
          initialReactionCounts={
            postReactionCountsMap[post.id] as
              | Partial<Record<ReactionKey, number>>
              | undefined
          }
          onToggleLike={(key) => onToggleLike(post.id, key)}
          onDelete={onDeletePost}
          currentUser={currentUser}
        />
      ))}
    </>
  );
};

export default PostList;
