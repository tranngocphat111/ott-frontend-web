import React, { useState, useRef, useEffect } from "react";
import type { Post, PostUser } from "./types";
import RelationshipBadge from "./RelationshipBadge";
import PostBody from "./post/PostBody";
import PostReactionsSummary from "./post/PostReactionsSummary";
import PostActions from "./post/PostActions";
import PostDetailModal from "./PostDetailModal";
import PostReactionsListModal from "./post/PostReactionsListModal";
import { useNavigate } from "react-router-dom";
import { getReactionByKey, type ReactionKey } from "./post/reactions";
import PostHeader from "./post/PostHeader";
import { mediaSocketService, type PostActivityPayload } from "../../services/mediaSocket.service";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
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
  const [isLiking, setIsLiking] = useState(false);
  const [isReactionsListModalOpen, setIsReactionsListModalOpen] = useState(false);

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

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleActivity = (payload: PostActivityPayload) => {
      if (payload.postId !== post.id) return;

      if (payload.activityType === "REACTION") {
        const data = payload.data || {};
        // Bỏ qua action của chính user hiện tại để tránh duplicate
        if (data.accountId && data.accountId === currentUser.id) return;

        const reactionTypeStr = (data.reactionType?.toLowerCase() || "like") as ReactionKey;

        setReactionCounts((c) => {
          const next = { ...c };
          if (payload.action === "CREATE") {
            next[reactionTypeStr] = (next[reactionTypeStr] || 0) + 1;
          } else if (payload.action === "DELETE") {
            next[reactionTypeStr] = Math.max(0, (next[reactionTypeStr] || 0) - 1);
          }
          return next;
        });
      } else if (payload.activityType === "COMMENT") {
        const data = payload.data;
        if (!data) return;
        if (data.accountId === currentUser.id) return;

        if (payload.action === "CREATE") {
          setCommentCount((prev) => prev + 1);
        } else if (payload.action === "DELETE") {
          setCommentCount((prev) => Math.max(0, prev - 1));
        }
      } else if (payload.activityType === "SHARE") {
        // Tương lai nếu có share real-time
      }
    };

    mediaSocketService.onPostActivity(handleActivity);
    return () => mediaSocketService.offPostActivity(handleActivity);
  }, [post.id, currentUser.id]);

  const handleReactionClick = (key: ReactionKey) => {
    if (isLiking) return;
    setIsLiking(true);

    const prev = reaction;
    const wasReacted = prev === key;
    const newReaction = wasReacted ? null : key;
    setReaction(newReaction);
    setShowPicker(false);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);

    setReactionCounts((c) => {
      const next = { ...c };
      if (prev) next[prev] = Math.max(0, next[prev] - 1);
      if (!wasReacted) next[key] = next[key] + 1;
      return next;
    });
    onToggleLike(newReaction);

    // Khóa bấm trong 500ms để tránh spam API
    setTimeout(() => setIsLiking(false), 500);
  };

  const handleLikeButtonClick = () => {
    if (isLiking) return;
    setIsLiking(true);

    setShowPicker(false);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);

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

    // Khóa bấm trong 500ms để tránh spam API
    setTimeout(() => setIsLiking(false), 500);
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
        ref={cardRef}
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
            visibility={post.visibility}
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

        <PostBody
          content={post.content}
          media={post.media}
          totalLikes={post.likes}
          isInView={isInView}
        />

        <div>
          <PostReactionsSummary
            reactionCounts={reactionCounts}
            commentCount={commentCount}
            shares={post.shares}
            onToggleComments={() => openModal(true)}
            onShowReactionsList={() => setIsReactionsListModalOpen(true)}
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
        onShowReactionsList={() => setIsReactionsListModalOpen(true)}
      />

      <PostReactionsListModal
        isOpen={isReactionsListModalOpen}
        onClose={() => setIsReactionsListModalOpen(false)}
        postId={post.id}
      />
    </>
  );
};

export default PostCard;
