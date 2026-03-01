import React from "react";
import type { Post, PostUser, StoryItem } from "./types";
import CreatePostCard from "./CreatePostCard";
import StoryReel from "./StoryReel";
import PostCard from "./PostCard";

interface Props {
  posts: Post[];
  likedPosts: string[];
  onToggleLike: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenModal: () => void;
  currentUser: PostUser;
  stories: StoryItem[];
  loading?: boolean;
}

/* ── Skeleton for a single post card while loading ─────── */
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

const PostFeed: React.FC<Props> = ({
  posts,
  likedPosts,
  onToggleLike,
  onDelete,
  onOpenModal,
  currentUser,
  stories,
  loading = false,
}) => (
  <main className="flex-1 min-w-0 max-w-150 mx-auto space-y-4">
    <CreatePostCard currentUser={currentUser} onOpenModal={onOpenModal} />

    <StoryReel stories={stories} currentUserAvatar={currentUser.avatar ?? ""} />

    {loading ?
      <>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </>
    : posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isLiked={likedPosts.includes(post.id)}
          onToggleLike={() => onToggleLike(post.id)}
          onDelete={onDelete}
          currentUser={currentUser}
        />
      ))
    }
  </main>
);

export default PostFeed;
