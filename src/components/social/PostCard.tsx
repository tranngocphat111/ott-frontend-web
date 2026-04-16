import React, { useState, useRef, useEffect } from "react";
import type { Post, PostUser } from "./types";
import RelationshipBadge from "./RelationshipBadge";
import PostBody from "./post/PostBody";
import PostReactionsSummary from "./post/PostReactionsSummary";
import PostActions from "./post/PostActions";
import PostDetailModal from "./PostDetailModal";
import { useNavigate } from "react-router-dom";
import { getReactionByKey, type ReactionKey } from "./post/reactions";
import PostHeader from "./post/PostHeader";

interface Props {
  post: Post;
  /** Reaction hiện tại của user (khôi phục từ server khi mount). */
  initialReaction?: ReactionKey;
  /**
   * Số lượng từng loại reaction của bài post (không phụ thuộc user).
   * Nếu không truyền thì toàn bộ post.likes sẽ gán vào bucket "like".
   */
  initialReactionCounts?: Partial<Record<ReactionKey, number>>;
  /** Được gọi khi user toggle: key = loại reaction mới, null = bỏ reaction. */
  onToggleLike: (key: ReactionKey | null) => void;
  onDelete?: (id: string) => void;
  onEdit?: (post: Post) => void;
  currentUser: PostUser;
}

const PostCard: React.FC<Props> = ({
  post,
  initialReaction,
  initialReactionCounts,
  onToggleLike,
  onDelete,
  onEdit,
  currentUser,
}) => {
  const [commentCount, setCommentCount] = useState(post.comments);
  const [reaction, setReaction] = useState<ReactionKey | null>(
    initialReaction ?? null,
  );
  // Seed reaction counts từ server (breakdown thực tế), fallback vào bucket "like"
  const [reactionCounts, setReactionCounts] = useState<
    Record<ReactionKey, number>
  >(() =>
    initialReactionCounts ?
      {
        like: initialReactionCounts.like ?? 0,
        love: initialReactionCounts.love ?? 0,
        haha: initialReactionCounts.haha ?? 0,
        wow: initialReactionCounts.wow ?? 0,
        sad: initialReactionCounts.sad ?? 0,
        angry: initialReactionCounts.angry ?? 0,
      }
    : { like: post.likes, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
  );
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalShowComments, setModalShowComments] = useState(false);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const currentReaction = getReactionByKey(reaction);

  const handleReactionClick = (key: ReactionKey) => {
    const prev = reaction;
    const wasReacted = prev === key;
    const newReaction = wasReacted ? null : key;
    setReaction(newReaction);
    setShowPicker(false);
    setReactionCounts((c) => {
      const next = { ...c };
      if (prev) next[prev] = Math.max(0, next[prev] - 1);
      if (!wasReacted) next[key] = next[key] + 1;
      return next;
    });
    onToggleLike(newReaction);
  };

  const handleLikeButtonClick = () => {
    if (reaction) {
      setReactionCounts((c) => ({
        ...c,
        [reaction]: Math.max(0, c[reaction] - 1),
      }));
      setReaction(null);
      onToggleLike(null);
    } else {
      setReactionCounts((c) => ({ ...c, like: c.like + 1 }));
      setReaction("like");
      onToggleLike("like");
    }
  };

  const onMouseEnterLike = () => {
    hoverTimer.current = setTimeout(() => setShowPicker(true), 400);
  };
  const onMouseLeaveLike = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };
  const onMouseEnterPicker = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };
  const onMouseLeavePicker = () => {
    setShowPicker(false);
  };

  const navigate = useNavigate();

  const goToProfile = (acccountId: string) => {
    navigate(`/social/profile/${acccountId}`);
  };

  const openModal = (showComments = false) => {
    setShowMenu(false);
    setModalShowComments(showComments);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const toggleModalComments = () => {
    setModalShowComments((prev) => !prev);
  };

  return (
    <>
      <div
        className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4"
        onClick={() => openModal(false)}>
        {/* Relationship badge */}
        <RelationshipBadge
          relationship={post.relationship}
          label={post.relationshipLabel}
        />
        <div>
          <PostHeader
            author={post.author}
            time={post.time}
            canEdit={post.relationship === "self"}
            showMenu={showMenu}
            menuRef={menuRef}
            onToggleMenu={() => setShowMenu((v) => !v)}
            onEdit={() => {
              setShowMenu(false);
              onEdit?.(post);
            }}
            onDelete={() => {
              setShowMenu(false);
              onDelete?.(post.id);
            }}
            onProfile={goToProfile}
          />
        </div>

        <PostBody content={post.content} media={post.media} />

        <div>
          <PostReactionsSummary
            reactionCounts={reactionCounts}
            commentCount={commentCount}
            shares={post.shares}
            onToggleComments={() => openModal(true)}
          />
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <PostActions
            reaction={reaction}
            reactionLabel={currentReaction ? currentReaction.label : "Thích"}
            reactionEmoji={currentReaction?.emoji}
            reactionColor={
              currentReaction ? currentReaction.color : "text-gray-400"
            }
            showComments={false}
            showPicker={showPicker}
            onLikeClick={handleLikeButtonClick}
            onToggleComments={() => openModal(true)}
            onSelectReaction={handleReactionClick}
            onLikeMouseEnter={onMouseEnterLike}
            onLikeMouseLeave={onMouseLeaveLike}
            onPickerMouseEnter={onMouseEnterPicker}
            onPickerMouseLeave={onMouseLeavePicker}
          />
        </div>
      </div>

      <PostDetailModal
        isOpen={isModalOpen}
        post={post}
        currentUser={currentUser}
        showMenu={showMenu}
        menuRef={menuRef}
        onToggleMenu={() => setShowMenu((v) => !v)}
        onEdit={() => {
          setShowMenu(false);
          closeModal();
          onEdit?.(post);
        }}
        onDelete={() => {
          setShowMenu(false);
          closeModal();
          onDelete?.(post.id);
        }}
        onProfile={goToProfile}
        commentCount={commentCount}
        reactionCounts={reactionCounts}
        reaction={reaction}
        currentReactionLabel={currentReaction ? currentReaction.label : "Thích"}
        currentReactionEmoji={currentReaction?.emoji}
        currentReactionColor={
          currentReaction ? currentReaction.color : "text-gray-400"
        }
        showPicker={showPicker}
        showComments={modalShowComments}
        onClose={closeModal}
        onToggleComments={toggleModalComments}
        onLikeClick={handleLikeButtonClick}
        onSelectReaction={handleReactionClick}
        onLikeMouseEnter={onMouseEnterLike}
        onLikeMouseLeave={onMouseLeaveLike}
        onPickerMouseEnter={onMouseEnterPicker}
        onPickerMouseLeave={onMouseLeavePicker}
        onCountChange={(delta) => setCommentCount((prev) => prev + delta)}
      />
    </>
  );
};

export default PostCard;
