import React, { useState, useRef, useEffect } from "react";
import type { Post, PostUser } from "./types";
import RelationshipBadge from "./RelationshipBadge";
import PostBody from "./post/PostBody";
import PostReactionsSummary from "./post/PostReactionsSummary";
import PostActions from "./post/PostActions";
import PostDetailModal from "./PostDetailModal";
import PostReactionsListModal from "./post/PostReactionsListModal";
import { useNavigate } from "react-router-dom";
import { getReactionByKey, REACTIONS, type ReactionKey } from "./post/reactions";
import PostHeader from "./post/PostHeader";
import { mediaSocketService, type PostActivityPayload } from "../../services/mediaSocket.service";
import { fetchPostById, fetchPostReactionDetails, type ApiReaction } from "../../services/post.service";
import { checkIsSaved, toggleSaveContent, recordViewHistory } from "../../services/social.service";

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

const emptyReactionCounts = (): Record<ReactionKey, number> =>
  Object.fromEntries(REACTIONS.map((reaction) => [reaction.key, 0])) as Record<
    ReactionKey,
    number
  >;

const toReactionKey = (value?: string | null): ReactionKey | null => {
  const key = String(value || "").toLowerCase();
  return REACTIONS.some((reaction) => reaction.key === key)
    ? (key as ReactionKey)
    : null;
};

const buildReactionCounts = (reactions: ApiReaction[]) => {
  const counts = emptyReactionCounts();
  reactions.forEach((item) => {
    const key = toReactionKey(item.reactionType);
    if (key) counts[key] += 1;
  });
  return counts;
};

const buildInitialReactionCounts = (
  initialCounts: Partial<Record<ReactionKey, number>> | undefined,
  fallbackLikes: number,
) =>
  initialCounts ?
    {
      like: initialCounts.like ?? 0,
      love: initialCounts.love ?? 0,
      haha: initialCounts.haha ?? 0,
      wow: initialCounts.wow ?? 0,
      sad: initialCounts.sad ?? 0,
      angry: initialCounts.angry ?? 0,
    }
  : { ...emptyReactionCounts(), like: fallbackLikes };

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
  >(() => buildInitialReactionCounts(initialReactionCounts, post.likes));
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalShowComments, setModalShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isReactionsListModalOpen, setIsReactionsListModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const hasRecordedView = useRef(false);

  useEffect(() => {
    checkIsSaved(post.id).then(setIsSaved);
  }, [post.id]);

  useEffect(() => {
    setCommentCount(post.comments);
  }, [post.id, post.comments]);

  useEffect(() => {
    setReaction(initialReaction ?? null);
  }, [post.id, initialReaction]);

  useEffect(() => {
    setReactionCounts(buildInitialReactionCounts(initialReactionCounts, post.likes));
  }, [post.id, initialReactionCounts]);

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
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && !hasRecordedView.current) {
          hasRecordedView.current = true;
          recordViewHistory(post.id);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [post.id]);

  useEffect(() => {
    let active = true;

    const handleActivity = (payload: PostActivityPayload) => {
      if (payload.postId !== post.id) return;

      if (payload.activityType === "REACTION") {
        void fetchPostReactionDetails(post.id).then((reactions) => {
          if (!active) return;
          setReactionCounts(buildReactionCounts(reactions));
          const ownReaction = reactions.find((item) => item.accountId === currentUser.id);
          setReaction(toReactionKey(ownReaction?.reactionType));
        });
      } else if (payload.activityType === "COMMENT") {
        void fetchPostById(post.id, currentUser.id).then((freshPost) => {
          if (!active || !freshPost) return;
          setCommentCount(freshPost.comments);
        });
      } else if (payload.activityType === "SHARE") {
        // Tương lai nếu có share real-time
      }
    };

    mediaSocketService.onPostActivity(handleActivity);
    return () => {
      active = false;
      mediaSocketService.offPostActivity(handleActivity);
    };
  }, [post.id, currentUser.id]);

  const totalReactionCount = Object.values(reactionCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

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

  const handleToggleSave = async () => {
    const newState = !isSaved;
    setIsSaved(newState);
    const success = await toggleSaveContent(post.id, newState);
    if (!success) {
      setIsSaved(!newState); // revert if failed
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
          totalLikes={totalReactionCount}
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
            isSaved={isSaved}
            onToggleSave={handleToggleSave}
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
        post={{ ...post, likes: totalReactionCount }}
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
