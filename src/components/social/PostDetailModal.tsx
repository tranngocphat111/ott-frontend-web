import React from "react";
import { X } from "lucide-react";
import type { Post, PostUser } from "./types";
import type { ReactionKey } from "./post/reactions";
import RelationshipBadge from "./RelationshipBadge";
import PostHeader from "./post/PostHeader";
import PostBody from "./post/PostBody";
import PostReactionsSummary from "./post/PostReactionsSummary";
import PostActions from "./post/PostActions";
import PostCommentsSection from "./post/PostCommentsSection";

const isDeletedPost = (post: Post) =>
  String(post.status || "").toUpperCase() === "DELETED";

interface Props {
  isOpen: boolean;
  post: Post;
  currentUser: PostUser;
  showMenu: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggleMenu: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onProfile: (accountId: string) => void;
  onOpenSharedPost?: (post: Post) => void;
  commentCount: number;
  reactionCounts: Record<ReactionKey, number>;
  reaction: ReactionKey | null;
  currentReactionLabel: string;
  currentReactionEmoji?: string;
  currentReactionColor: string;
  showPicker: boolean;
  showComments: boolean;
  onClose: () => void;
  onToggleComments: () => void;
  onShowReactionsList: () => void;
  onLikeClick: () => void;
  onSelectReaction: (key: ReactionKey) => void;
  onLikeMouseEnter: () => void;
  onLikeMouseLeave: () => void;
  onPickerMouseEnter: () => void;
  onPickerMouseLeave: () => void;
  onCountChange: (delta: number) => void;
}

const PostDetailModal: React.FC<Props> = ({
  isOpen,
  post,
  currentUser,
  showMenu,
  menuRef,
  onToggleMenu,
  onEdit,
  onDelete,
  onProfile,
  onOpenSharedPost,
  commentCount,
  reactionCounts,
  reaction,
  currentReactionLabel,
  currentReactionEmoji,
  currentReactionColor,
  showPicker,
  showComments,
  onClose,
  onToggleComments,
  onShowReactionsList,
  onLikeClick,
  onSelectReaction,
  onLikeMouseEnter,
  onLikeMouseLeave,
  onPickerMouseEnter,
  onPickerMouseLeave,
  onCountChange,
}) => {
  if (!isOpen) return null;
  const deleted = isDeletedPost(post);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}>
        <div
          className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Bài viết</h3>
            <button
              onClick={onClose}
              className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 transition inline-flex items-center justify-center">
              <X className="size-4 text-gray-700" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <RelationshipBadge
              relationship={post.relationship}
              label={post.relationshipLabel}
            />
            <PostHeader
              author={post.author}
              time={post.time}
              visibility={post.visibility}
              canEdit={post.relationship === "self"}
              showMenu={showMenu}
              menuRef={menuRef}
              onToggleMenu={onToggleMenu}
              onEdit={onEdit}
              onDelete={onDelete}
              onProfile={onProfile}
            />

            {deleted ?
              <div className="mx-4 mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                <div className="text-sm font-semibold text-gray-800">
                  Bài viết đã bị xóa
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Nội dung này không còn khả dụng, nhưng vẫn hiển thị trong lịch
                  sử và danh sách đã lưu.
                </div>
              </div>
            : <PostBody
                content={post.content}
                media={post.media}
                totalLikes={post.likes}
                isInView
                variant="carousel"
              />
            }

            {(post.sharedPost ||
              post.sharedPostDeleted ||
              post.sharedPostRestricted ||
              post.sharedPostCollapsed) && (
              <div
                className={`mx-4 mb-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl transition duration-200 ${post.sharedPost ? "hover:bg-gray-50 cursor-pointer" : ""}`}
                onClick={(e) => {
                  if (!post.sharedPost) return;
                  e.stopPropagation();
                  if (onOpenSharedPost) {
                    onOpenSharedPost(post.sharedPost);
                    return;
                  }
                  onProfile(post.sharedPost.author.id);
                }}>
                {post.sharedPost ?
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center text-white text-xs font-semibold overflow-hidden ${post.sharedPost.author.avatar ? "" : post.sharedPost.author.color}`}>
                        {post.sharedPost.author.avatar ?
                          <img
                            src={post.sharedPost.author.avatar}
                            alt={post.sharedPost.author.displayName}
                            className="size-full object-cover"
                          />
                        : post.sharedPost.author.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800 hover:underline">
                          {post.sharedPost.author.displayName}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {post.sharedPost.time}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2 line-clamp-3">
                      {post.sharedPost.content}
                    </p>
                    {post.sharedPost.media &&
                      post.sharedPost.media.length > 0 && (
                        <div
                          className="rounded-lg overflow-hidden border border-gray-100 max-h-60"
                          onClick={(e) => e.stopPropagation()}>
                          <PostBody media={post.sharedPost.media} isInView />
                        </div>
                      )}
                  </>
                : <div className="text-sm text-gray-500">
                    <div className="font-semibold text-gray-700">
                      {post.sharedPostCollapsed ?
                        "Nội dung đã được thu gọn"
                      : "Nội dung không khả dụng"}
                    </div>
                    <div className="text-xs mt-1">
                      {post.sharedPostCollapsed ?
                        "Chuỗi chia sẻ quá dài. Mở bài gốc để xem đầy đủ."
                      : "Bài viết đã bị xóa hoặc bạn không có quyền xem."}
                    </div>
                  </div>
                }
              </div>
            )}

            {!deleted && (
              <>
                <PostReactionsSummary
                  reactionCounts={reactionCounts}
                  commentCount={commentCount}
                  shares={post.shares}
                  onToggleComments={onToggleComments}
                  onShowReactionsList={onShowReactionsList}
                />

                <PostActions
                  reaction={reaction}
                  reactionLabel={currentReactionLabel}
                  reactionEmoji={currentReactionEmoji}
                  reactionColor={currentReactionColor}
                  showComments={showComments}
                  showPicker={showPicker}
                  onLikeClick={onLikeClick}
                  onToggleComments={onToggleComments}
                  onSelectReaction={onSelectReaction}
                  onLikeMouseEnter={onLikeMouseEnter}
                  onLikeMouseLeave={onLikeMouseLeave}
                  onPickerMouseEnter={onPickerMouseEnter}
                  onPickerMouseLeave={onPickerMouseLeave}
                />

                {showComments && (
                  <div className="px-4 pb-4">
                    <PostCommentsSection
                      postId={post.id}
                      currentUser={currentUser}
                      onCountChange={onCountChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
