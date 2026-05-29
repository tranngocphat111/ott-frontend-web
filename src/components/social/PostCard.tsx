import React, { useState, useRef, useEffect } from "react";
import type { Post, PostUser } from "./types";
import RelationshipBadge from "./RelationshipBadge";
import PostBody from "./post/PostBody";
import PostReactionsSummary from "./post/PostReactionsSummary";
import PostActions from "./post/PostActions";
import PostDetailModal from "./PostDetailModal";
import PostReactionsListModal from "./post/PostReactionsListModal";
import { useNavigate } from "react-router-dom";
import {
  getReactionByKey,
  REACTIONS,
  type ReactionKey,
} from "./post/reactions";
import PostHeader from "./post/PostHeader";
import {
  mediaSocketService,
  type PostActivityPayload,
} from "../../services/mediaSocket.service";
import {
  fetchPostById,
  fetchPostReactionDetails,
  toggleLike,
  type ApiReaction,
} from "../../services/post.service";
import {
  checkIsSaved,
  toggleSaveContent,
  recordViewHistory,
} from "../../services/social.service";
import PostMediaGrid from "./PostMediaGrid";
import { SharePostModal } from "./post/SharePostModal";

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
  onShare?: (
    postId: string,
    caption?: string,
    visibility: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  currentUser: PostUser;
}

const isDeletedPost = (post: Post) =>
  String(post.status || "").toUpperCase() === "DELETED";

const emptyReactionCounts = (): Record<ReactionKey, number> =>
  Object.fromEntries(REACTIONS.map((reaction) => [reaction.key, 0])) as Record<
    ReactionKey,
    number
  >;

const toReactionKey = (value?: string | null): ReactionKey | null => {
  const key = String(value || "").toLowerCase();
  return REACTIONS.some((reaction) => reaction.key === key) ?
      (key as ReactionKey)
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
  onShare,
  currentUser,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [shareCount, setShareCount] = useState(post.shares);
  const [reaction, setReaction] = useState<ReactionKey | null>(
    initialReaction ?? null,
  );
  // Seed reaction counts từ server (breakdown thực tế), fallback vào bucket "like"
  const [reactionCounts, setReactionCounts] = useState<
    Record<ReactionKey, number>
  >(() => buildInitialReactionCounts(initialReactionCounts, post.likes));
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalShowComments, setModalShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isReactionsListModalOpen, setIsReactionsListModalOpen] =
    useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const hasRecordedView = useRef(false);
  const [sharedModalPost, setSharedModalPost] = useState<Post | null>(null);
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);
  const [sharedModalCommentCount, setSharedModalCommentCount] = useState(0);
  const [sharedModalReactionCounts, setSharedModalReactionCounts] = useState<
    Record<ReactionKey, number>
  >(emptyReactionCounts());
  const [sharedModalReaction, setSharedModalReaction] =
    useState<ReactionKey | null>(null);
  const [sharedModalShowComments, setSharedModalShowComments] = useState(false);
  const [sharedModalShowPicker, setSharedModalShowPicker] = useState(false);
  const [sharedModalShowMenu, setSharedModalShowMenu] = useState(false);
  const [isSharedLiking, setIsSharedLiking] = useState(false);
  const [isSharedReactionsListModalOpen, setIsSharedReactionsListModalOpen] =
    useState(false);
  const sharedMenuRef = useRef<HTMLDivElement>(null);
  const sharedHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleted = isDeletedPost(post);
  const hasVisibleSharedPost = Boolean(
    post.sharedPost && !isDeletedPost(post.sharedPost),
  );
  const shouldShowSharedFallback = Boolean(
    post.sharedPostDeleted ||
    post.sharedPostRestricted ||
    post.sharedPostCollapsed ||
    (post.sharedPost && isDeletedPost(post.sharedPost)),
  );

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
    setReactionCounts(
      buildInitialReactionCounts(initialReactionCounts, post.likes),
    );
  }, [post.id, initialReactionCounts]);

  useEffect(() => {
    setShareCount(post.shares);
  }, [post.id, post.shares]);

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
          const ownReaction = reactions.find(
            (item) => item.accountId === currentUser.id,
          );
          setReaction(toReactionKey(ownReaction?.reactionType));
        });
      } else if (payload.activityType === "COMMENT") {
        void fetchPostById(post.id, currentUser.id).then((freshPost) => {
          if (!active || !freshPost) return;
          setCommentCount(freshPost.comments);
        });
      } else if (payload.activityType === "SHARE") {
        void fetchPostById(post.id, currentUser.id).then((freshPost) => {
          if (!active || !freshPost) return;
          setShareCount(freshPost.shares);
        });
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

  const openSharedModal = async (target: Post) => {
    setIsModalOpen(false);
    setModalShowComments(false);
    const fresh = await fetchPostById(target.id, currentUser.id);
    const nextPost = fresh ?? target;

    setSharedModalPost(nextPost);
    setSharedModalCommentCount(nextPost.comments);
    setSharedModalReactionCounts(
      buildInitialReactionCounts(undefined, nextPost.likes),
    );
    setSharedModalReaction(null);
    setSharedModalShowComments(false);
    setSharedModalShowPicker(false);
    setSharedModalShowMenu(false);
    setIsSharedModalOpen(true);

    const reactions = await fetchPostReactionDetails(nextPost.id);
    setSharedModalReactionCounts(buildReactionCounts(reactions));
    const ownReaction = reactions.find(
      (item) => item.accountId === currentUser.id,
    );
    setSharedModalReaction(toReactionKey(ownReaction?.reactionType));
  };

  const closeSharedModal = () => {
    setIsSharedModalOpen(false);
    setSharedModalPost(null);
    setSharedModalShowComments(false);
    setSharedModalShowMenu(false);
    setSharedModalShowPicker(false);
    setIsSharedReactionsListModalOpen(false);
  };

  const sharedTotalReactionCount = Object.values(
    sharedModalReactionCounts,
  ).reduce((sum, count) => sum + count, 0);

  const handleSharedReactionClick = async (key: ReactionKey) => {
    if (!sharedModalPost || isSharedLiking) return;
    setIsSharedLiking(true);

    const prev = sharedModalReaction;
    const wasReacted = prev === key;
    const newReaction = wasReacted ? null : key;
    setSharedModalReaction(newReaction);
    setSharedModalShowPicker(false);
    if (sharedHoverTimer.current) clearTimeout(sharedHoverTimer.current);

    setSharedModalReactionCounts((c) => {
      const next = { ...c };
      if (prev) next[prev] = Math.max(0, next[prev] - 1);
      if (!wasReacted) next[key] = next[key] + 1;
      return next;
    });

    await toggleLike(
      sharedModalPost.id,
      currentUser.id,
      (newReaction ?? "LIKE").toUpperCase(),
    );

    const reactions = await fetchPostReactionDetails(sharedModalPost.id);
    setSharedModalReactionCounts(buildReactionCounts(reactions));
    const ownReaction = reactions.find(
      (item) => item.accountId === currentUser.id,
    );
    setSharedModalReaction(toReactionKey(ownReaction?.reactionType));

    setIsSharedLiking(false);
  };

  const handleSharedLikeButtonClick = async () => {
    if (isSharedLiking || !sharedModalPost) return;
    setIsSharedLiking(true);

    setSharedModalShowPicker(false);
    if (sharedHoverTimer.current) clearTimeout(sharedHoverTimer.current);

    const nextReaction = sharedModalReaction ? null : "like";
    if (sharedModalReaction) {
      setSharedModalReactionCounts((c) => ({
        ...c,
        [sharedModalReaction]: Math.max(0, c[sharedModalReaction] - 1),
      }));
    } else {
      setSharedModalReactionCounts((c) => ({ ...c, like: c.like + 1 }));
    }
    setSharedModalReaction(nextReaction);

    await toggleLike(
      sharedModalPost.id,
      currentUser.id,
      (nextReaction ?? "LIKE").toUpperCase(),
    );

    const reactions = await fetchPostReactionDetails(sharedModalPost.id);
    setSharedModalReactionCounts(buildReactionCounts(reactions));
    const ownReaction = reactions.find(
      (item) => item.accountId === currentUser.id,
    );
    setSharedModalReaction(toReactionKey(ownReaction?.reactionType));

    setIsSharedLiking(false);
  };

  const onSharedMouseEnterLike = () => {
    sharedHoverTimer.current = setTimeout(
      () => setSharedModalShowPicker(true),
      400,
    );
  };
  const onSharedMouseLeaveLike = () => {
    if (sharedHoverTimer.current) clearTimeout(sharedHoverTimer.current);
  };
  const onSharedMouseEnterPicker = () => {
    if (sharedHoverTimer.current) clearTimeout(sharedHoverTimer.current);
  };
  const onSharedMouseLeavePicker = () => {
    setSharedModalShowPicker(false);
  };

  const toggleModalComments = () => {
    setModalShowComments((prev) => !prev);
  };

  if (deleted) {
    return null;
  }

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

        {(hasVisibleSharedPost || shouldShowSharedFallback) && (
          <div
            className={`mx-4 mb-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl transition duration-200 ${hasVisibleSharedPost ? "hover:bg-gray-50 cursor-pointer" : ""}`}
            onClick={(e) => {
              if (!hasVisibleSharedPost || !post.sharedPost) return;
              e.stopPropagation();
              openSharedModal(post.sharedPost);
            }}>
            {hasVisibleSharedPost && post.sharedPost ?
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
                {post.sharedPost.media && post.sharedPost.media.length > 0 && (
                  <div className="rounded-lg overflow-hidden border border-gray-100 max-h-60">
                    <PostMediaGrid
                      media={post.sharedPost.media}
                      isInView={isInView}
                    />
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
            <div>
              <PostReactionsSummary
                reactionCounts={reactionCounts}
                commentCount={commentCount}
                shares={shareCount}
                onToggleComments={() => openModal(true)}
                onShowReactionsList={() => setIsReactionsListModalOpen(true)}
              />
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <PostActions
                reaction={reaction}
                reactionLabel={
                  currentReaction ? currentReaction.label : "Thích"
                }
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
                onShareClick={() => setIsShareModalOpen(true)}
              />
            </div>
          </>
        )}
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
        onOpenSharedPost={openSharedModal}
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
        isSaved={isSaved}
        onToggleSave={handleToggleSave}
        onShareClick={() => setIsShareModalOpen(true)}
      />

      {sharedModalPost && (
        <PostDetailModal
          isOpen={isSharedModalOpen}
          post={{ ...sharedModalPost, likes: sharedTotalReactionCount }}
          currentUser={currentUser}
          showMenu={sharedModalShowMenu}
          menuRef={sharedMenuRef}
          onToggleMenu={() => setSharedModalShowMenu((v) => !v)}
          onEdit={() => {
            setSharedModalShowMenu(false);
            closeSharedModal();
            onEdit?.(sharedModalPost);
          }}
          onDelete={() => {
            setSharedModalShowMenu(false);
            closeSharedModal();
            onDelete?.(sharedModalPost.id);
          }}
          onProfile={goToProfile}
          onOpenSharedPost={openSharedModal}
          commentCount={sharedModalCommentCount}
          reactionCounts={sharedModalReactionCounts}
          reaction={sharedModalReaction}
          currentReactionLabel={
            sharedModalReaction ?
              (getReactionByKey(sharedModalReaction)?.label ?? "Thích")
            : "Thích"
          }
          currentReactionEmoji={getReactionByKey(sharedModalReaction)?.emoji}
          currentReactionColor={
            getReactionByKey(sharedModalReaction)?.color ?? "text-gray-400"
          }
          showPicker={sharedModalShowPicker}
          showComments={sharedModalShowComments}
          onClose={closeSharedModal}
          onToggleComments={() => setSharedModalShowComments((prev) => !prev)}
          onLikeClick={handleSharedLikeButtonClick}
          onSelectReaction={handleSharedReactionClick}
          onLikeMouseEnter={onSharedMouseEnterLike}
          onLikeMouseLeave={onSharedMouseLeaveLike}
          onPickerMouseEnter={onSharedMouseEnterPicker}
          onPickerMouseLeave={onSharedMouseLeavePicker}
          onCountChange={(delta) =>
            setSharedModalCommentCount((prev) => prev + delta)
          }
          onShowReactionsList={() => setIsSharedReactionsListModalOpen(true)}
        />
      )}

      <PostReactionsListModal
        isOpen={isReactionsListModalOpen}
        onClose={() => setIsReactionsListModalOpen(false)}
        postId={post.id}
      />

      {sharedModalPost && (
        <PostReactionsListModal
          isOpen={isSharedReactionsListModalOpen}
          onClose={() => setIsSharedReactionsListModalOpen(false)}
          postId={sharedModalPost.id}
        />
      )}

      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
        currentUser={currentUser}
        onShare={async (caption, visibility) => {
          if (onShare) {
            const res = await onShare(post.id, caption, visibility);
            if (res.ok) {
              setShareCount((prev) => prev + 1);
            }
            return res;
          }
          return { ok: false, error: "Chức năng chia sẻ chưa sẵn sàng." };
        }}
      />
    </>
  );
};

export default PostCard;
