import React, { useState } from "react";
import {
  Globe,
  MoreHorizontal,
  X,
  ThumbsUp,
  MessageCircle,
  Share2,
  Trash2,
} from "lucide-react";
import type { Post, PostUser } from "./types";
import UserAvatar from "./UserAvatar";
import PostMediaGrid from "./PostMediaGrid";
import RelationshipBadge from "./RelationshipBadge";
import CommentSection from "./CommentSection";

const fmtCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

interface Props {
  post: Post;
  isLiked: boolean;
  onToggleLike: () => void;
  onDelete?: (id: string) => void;
  currentUser: PostUser;
}

const PostCard: React.FC<Props> = ({
  post,
  isLiked,
  onToggleLike,
  onDelete,
  currentUser,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Relationship badge */}
      <RelationshipBadge
        relationship={post.relationship}
        label={post.relationshipLabel}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-primary-400 transition shrink-0">
            <UserAvatar user={post.author} size="size-10" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 hover:underline cursor-pointer leading-tight">
              {post.author.name}
            </p>
            <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
              <span>{post.time}</span>
              <span>·</span>
              <Globe className="size-3" />
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-primary-50 transition">
            <MoreHorizontal className="size-5 text-primary-400" />
          </button>
          {post.relationship === "self" && onDelete ?
            <button
              onClick={() => onDelete(post.id)}
              className="p-2 rounded-full hover:bg-red-50 transition"
              title="Xoá bài viết">
              <Trash2 className="size-5 text-red-400" />
            </button>
          : <button className="p-2 rounded-full hover:bg-primary-50 transition">
              <X className="size-5 text-primary-400" />
            </button>
          }
        </div>
      </div>

      {/* Body text */}
      {post.content && (
        <p className="px-4 pb-3 text-gray-800 leading-relaxed">
          {post.content}
        </p>
      )}

      {/* Media grid */}
      <PostMediaGrid media={post.media} />

      {/* Reaction counts */}
      {(post.likes > 0 || commentCount > 0 || post.shares > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-primary-400 text-sm border-t border-primary-100">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              <span className="size-4.5 bg-primary-500 rounded-full flex items-center justify-center text-[10px]">
                👍
              </span>
              <span className="size-4.5 bg-rose-400 rounded-full flex items-center justify-center text-[10px]">
                ❤️
              </span>
            </div>
            <span>{fmtCount(post.likes)}</span>
          </div>
          <div className="flex gap-3 text-xs">
            <button
              onClick={() => setShowComments((v) => !v)}
              className="hover:underline cursor-pointer">
              {commentCount} bình luận
            </button>
            <span className="hover:underline cursor-pointer">
              {post.shares} lượt chia sẻ
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-1 border-t border-primary-100 flex">
        <button
          onClick={onToggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-primary-50 transition font-medium text-sm ${
            isLiked ? "text-primary-500" : "text-primary-700"
          }`}>
          <ThumbsUp className={`size-5 ${isLiked ? "fill-primary-500" : ""}`} />
          Thích
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-primary-50 transition font-medium text-sm ${
            showComments ? "text-primary-500" : "text-primary-700"
          }`}>
          <MessageCircle
            className={`size-5 ${showComments ? "fill-primary-100" : ""}`}
          />
          Bình luận
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-primary-50 transition text-primary-700 font-medium text-sm">
          <Share2 className="size-5" />
          Chia sẻ
        </button>
      </div>

      {/* Comment section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          currentUser={currentUser}
          onCountChange={setCommentCount}
        />
      )}
    </div>
  );
};

export default PostCard;
