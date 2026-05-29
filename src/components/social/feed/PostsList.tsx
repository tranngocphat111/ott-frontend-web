import React from "react";
import type { Post, PostUser } from "../types";
import PostCard from "../PostCard";
import type { ReactionKey } from "../post/reactions";

interface Props {
  posts: Post[];
  userReactionMap: Record<string, string>;
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
}

const PostSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-full bg-primary-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-primary-100 rounded w-32" />
        <div className="h-2.5 bg-primary-100 rounded w-20" />
      </div>
    </div>
    <div className="h-3 bg-primary-100 rounded w-full" />
    <div className="h-3 bg-primary-100 rounded w-3/4" />
    <div className="h-48 bg-primary-100 rounded-xl" />
  </div>
);

const PostsList: React.FC<Props> = ({
  posts,
  userReactionMap,
  postReactionCountsMap,
  onToggleLike,
  onDelete,
  onEdit,
  onShare,
  currentUser,
  loading = false,
}) => {
  const visiblePosts = posts.filter(
    (post) => String(post.status || "").toUpperCase() !== "DELETED",
  );

  return (
    <>
      {loading ?
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      : visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            initialReaction={
              userReactionMap[post.id] as ReactionKey | undefined
            }
            initialReactionCounts={
              postReactionCountsMap[post.id] as
                | Partial<Record<ReactionKey, number>>
                | undefined
            }
            onToggleLike={(key) => onToggleLike(post.id, key)}
            onDelete={onDelete}
            onEdit={onEdit}
            onShare={onShare}
            currentUser={currentUser}
          />
        ))
      }
    </>
  );
};

export default PostsList;
