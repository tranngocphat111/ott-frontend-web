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
  onLikeClick,
  onSelectReaction,
  onLikeMouseEnter,
  onLikeMouseLeave,
  onPickerMouseEnter,
  onPickerMouseLeave,
  onCountChange,
}) => {
  if (!isOpen) return null;

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
              canEdit={post.relationship === "self"}
              showMenu={showMenu}
              menuRef={menuRef}
              onToggleMenu={onToggleMenu}
              onEdit={onEdit}
              onDelete={onDelete}
              onProfile={onProfile}
            />

            <PostBody content={post.content} media={post.media} />

            <PostReactionsSummary
              reactionCounts={reactionCounts}
              commentCount={commentCount}
              shares={post.shares}
              onToggleComments={onToggleComments}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
