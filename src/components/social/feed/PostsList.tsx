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
  currentUser: PostUser;
  onShare?: (
    postId: string,
    caption: string | undefined,
    visibility: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  loading?: boolean;
  loadError?: string | null;
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

const FeedStateCard: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary-50 text-lg font-black text-primary-600">
      !
    </div>
    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
    <p className="mt-2 text-sm text-gray-500">{description}</p>
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
  loadError = null,
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
      : loadError ?
        <FeedStateCard
          title="Không tải được bài viết"
          description={loadError}
        />
      : visiblePosts.length === 0 ?
        <FeedStateCard
          title="Chưa có bài viết"
          description="Khi có bài viết mới, chúng sẽ xuất hiện ở đây."
        />
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
