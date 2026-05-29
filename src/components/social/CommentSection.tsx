import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Send,
  Loader2,
  Trash2,
  CornerDownRight,
  ChevronDown,
} from "lucide-react";
import {
  fetchRootComments,
  fetchReplies,
  addComment,
  deleteComment,
  mapComment,
} from "../../services/post.service";
import type { Comment, ApiComment } from "../../services/post.service";
import { mediaSocketService, type PostActivityPayload } from "../../services/mediaSocket.service";
import type { PostUser } from "./types";

const ROOT_PAGE_SIZE = 20;
const REPLY_PAGE_SIZE = 10;

interface ReplyState {
  comments: Comment[];
  page: number;
  hasMore: boolean;
  loading: boolean;
}

const AVATAR_COLORS = [
  "bg-primary-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-sky-500",
];

interface Props {
  postId: string;
  currentUser: PostUser;
  onCountChange?: (delta: number) => void;
}

const CommentSection: React.FC<Props> = ({
  postId,
  currentUser,
  onCountChange,
}) => {
  // Keep track of processed comment IDs (realtime events + optimistic actions) to ensure idempotency
  const processedCommentIds = useRef<Set<string>>(new Set());

  /* ── Root comments ────────────────────────────────── */
  const [roots, setRoots] = useState<Comment[]>([]);
  const [rootPage, setRootPage] = useState(0);
  const [rootHasMore, setRootHasMore] = useState(false);
  const [rootLoadingMore, setRootLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  /* ── Replies: commentId → state ───────────────────── */
  const [repliesMap, setRepliesMap] = useState<Record<string, ReplyState>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );

  /* ── Input ────────────────────────────────────────── */
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  );

  /* ── Load page 0 on mount ─────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitialLoading(true);
      const result = await fetchRootComments(postId, 0, ROOT_PAGE_SIZE);
      if (!cancelled) {
        setRoots(result.comments);
        setRootPage(result.page);
        setRootHasMore(result.hasMore);
        setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  /* ── Socket Realtime Updates ──────────────────────── */
  useEffect(() => {
    const handleActivity = (payload: PostActivityPayload) => {
      if (payload.postId !== postId) return;
      if (payload.activityType !== "COMMENT") return;

      const data = payload.data;
      if (!data) return;

      // Skip current user because we already update optimistically
      if (data.accountId === currentUser.id) return;

      if (payload.action === "CREATE") {
        if (processedCommentIds.current.has(data.id)) return;
        processedCommentIds.current.add(data.id);

        const newComment = mapComment(data as ApiComment);
        if (newComment.parentId) {
          // If it's a reply
          setRepliesMap((prev) => {
            const existing = prev[newComment.parentId!];
            if (!existing) return prev; // If not expanded, ignore
            if (existing.comments.some((r) => r.id === newComment.id)) return prev;
            return {
              ...prev,
              [newComment.parentId!]: {
                ...existing,
                comments: [...existing.comments, newComment],
              },
            };
          });
          // Update totalReplies for parent in roots OR any nested repliesMap level
          setRoots((prev) =>
            prev.map((c) =>
              c.id === newComment.parentId ?
                { ...c, totalReplies: c.totalReplies + 1 }
              : c,
            ),
          );
          setRepliesMap((prev) => {
            const updated: Record<string, ReplyState> = {};
            for (const key of Object.keys(prev)) {
              updated[key] = {
                ...prev[key],
                comments: prev[key].comments.map((r) =>
                  r.id === newComment.parentId ?
                    { ...r, totalReplies: r.totalReplies + 1 }
                  : r,
                ),
              };
            }
            return updated;
          });
        } else {
          // If it's a root comment
          setRoots((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [newComment, ...prev];
          });
        }
      } else if (payload.action === "DELETE") {
        if (processedCommentIds.current.has(data.id)) return;
        processedCommentIds.current.add(data.id);

        const deletedCommentId = data.id;
        const parentId = data.parentCommentId; // Need parentId to update counts
        
        if (parentId) {
          setRepliesMap((prev) => {
            const s = prev[parentId];
            if (!s) return prev;
            return {
              ...prev,
              [parentId]: {
                ...s,
                comments: s.comments.filter((r) => r.id !== deletedCommentId),
              },
            };
          });
          setRoots((prev) =>
            prev.map((r) =>
              r.id === parentId ?
                { ...r, totalReplies: Math.max(0, r.totalReplies - 1) }
              : r,
            ),
          );
          setRepliesMap((prev) => {
            const updated: Record<string, ReplyState> = {};
            for (const key of Object.keys(prev)) {
              updated[key] = {
                ...prev[key],
                comments: prev[key].comments.map((r) =>
                  r.id === parentId ?
                    { ...r, totalReplies: Math.max(0, r.totalReplies - 1) }
                  : r,
                ),
              };
            }
            return updated;
          });
        } else {
          setRoots((prev) => prev.filter((r) => r.id !== deletedCommentId));
        }
      } else if (payload.action === "UPDATE") {
        const updatedComment = mapComment(data as ApiComment);
        const updateInList = (list: Comment[]) =>
          list.map(c => c.id === updatedComment.id ? updatedComment : c);
          
        if (updatedComment.parentId) {
          setRepliesMap(prev => {
             const s = prev[updatedComment.parentId!];
             if (!s) return prev;
             return {
                 ...prev,
                 [updatedComment.parentId!]: { ...s, comments: updateInList(s.comments) }
             };
          });
        } else {
          setRoots(prev => updateInList(prev));
        }
      }
    };

    mediaSocketService.onPostActivity(handleActivity);
    return () => mediaSocketService.offPostActivity(handleActivity);
  }, [postId, currentUser.id]);

  /* ── Load more root comments ──────────────────────── */
  const loadMoreRoots = useCallback(async () => {
    if (rootLoadingMore || !rootHasMore) return;
    setRootLoadingMore(true);
    const result = await fetchRootComments(
      postId,
      rootPage + 1,
      ROOT_PAGE_SIZE,
    );
    setRoots((prev) => [...prev, ...result.comments]);
    setRootPage(result.page);
    setRootHasMore(result.hasMore);
    setRootLoadingMore(false);
  }, [postId, rootPage, rootHasMore, rootLoadingMore]);

  /* ── Toggle / lazy-load replies ──────────────────── */
  const toggleReplies = useCallback(
    async (commentId: string) => {
      const wasExpanded = expandedReplies.has(commentId);
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        if (wasExpanded) {
          next.delete(commentId);
        } else {
          next.add(commentId);
        }
        return next;
      });
      // Only load if not yet fetched
      if (!wasExpanded && !repliesMap[commentId]) {
        setRepliesMap((prev) => ({
          ...prev,
          [commentId]: {
            comments: [],
            page: -1,
            hasMore: false,
            loading: true,
          },
        }));
        const result = await fetchReplies(commentId, 0, REPLY_PAGE_SIZE);
        setRepliesMap((prev) => ({
          ...prev,
          [commentId]: {
            comments: result.comments,
            page: result.page,
            hasMore: result.hasMore,
            loading: false,
          },
        }));
      }
    },
    [expandedReplies, repliesMap],
  );

  /* ── Load more replies ────────────────────────────── */
  const loadMoreReplies = useCallback(
    async (commentId: string) => {
      const s = repliesMap[commentId];
      if (!s || s.loading || !s.hasMore) return;
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: { ...s, loading: true },
      }));
      const result = await fetchReplies(commentId, s.page + 1, REPLY_PAGE_SIZE);
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: {
          comments: [...(prev[commentId]?.comments ?? []), ...result.comments],
          page: result.page,
          hasMore: result.hasMore,
          loading: false,
        },
      }));
    },
    [repliesMap],
  );

  /* ── Submit ───────────────────────────────────────── */
  const submitComment = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUser.id || submitting) return;
    setSubmitting(true);
    try {
      const created = await addComment(
        postId,
        currentUser.id,
        trimmed,
        replyTo?.id,
      );
      if (created) {
        processedCommentIds.current.add(created.id);
        if (replyTo) {
          setRepliesMap((prev) => {
            const existing = prev[replyTo.id];
            return {
              ...prev,
              [replyTo.id]:
                existing ?
                  { ...existing, comments: [...existing.comments, created] }
                : {
                    comments: [created],
                    page: 0,
                    hasMore: false,
                    loading: false,
                  },
            };
          });
          setExpandedReplies((prev) => new Set(prev).add(replyTo.id));
          // Update totalReplies for parent in roots OR any nested repliesMap level
          setRoots((prev) =>
            prev.map((c) =>
              c.id === replyTo.id ?
                { ...c, totalReplies: c.totalReplies + 1 }
              : c,
            ),
          );
          setRepliesMap((prev) => {
            const updated: Record<string, ReplyState> = {};
            for (const key of Object.keys(prev)) {
              updated[key] = {
                ...prev[key],
                comments: prev[key].comments.map((r) =>
                  r.id === replyTo.id ?
                    { ...r, totalReplies: r.totalReplies + 1 }
                  : r,
                ),
              };
            }
            return updated;
          });
        } else {
          setRoots((prev) => [created, ...prev]);
        }
        onCountChange?.(1);
        setText("");
        setReplyTo(null);
      }
    } finally {
      setSubmitting(false);
    }
  }, [currentUser.id, onCountChange, postId, replyTo, submitting, text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitComment();
  };

  /* ── Delete ───────────────────────────────────────── */
  const handleDelete = async (c: Comment) => {
    const ok = await deleteComment(postId, c.id);
    if (!ok) return;
    processedCommentIds.current.add(c.id);
    if (c.parentId) {
      setRepliesMap((prev) => {
        const s = prev[c.parentId!];
        if (!s) return prev;
        return {
          ...prev,
          [c.parentId!]: {
            ...s,
            comments: s.comments.filter((r) => r.id !== c.id),
          },
        };
      });
      // Decrement totalReplies for parent in roots OR any nested repliesMap level
      setRoots((prev) =>
        prev.map((r) =>
          r.id === c.parentId ?
            { ...r, totalReplies: Math.max(0, r.totalReplies - 1) }
          : r,
        ),
      );
      setRepliesMap((prev) => {
        const updated: Record<string, ReplyState> = {};
        for (const key of Object.keys(prev)) {
          updated[key] = {
            ...prev[key],
            comments: prev[key].comments.map((r) =>
              r.id === c.parentId ?
                { ...r, totalReplies: Math.max(0, r.totalReplies - 1) }
              : r,
            ),
          };
        }
        return updated;
      });
    } else {
      setRoots((prev) => prev.filter((r) => r.id !== c.id));
    }
    onCountChange?.(-1);
  };

  /* ── Avatar helper ────────────────────────────────── */
  const renderAvatar = (
    name: string,
    avatar: string | undefined,
    id: string,
  ) => {
    const colorIdx = id.charCodeAt(0) % AVATAR_COLORS.length;
    return (
      <div
        className={`size-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden ${avatar ? "" : AVATAR_COLORS[colorIdx]}`}>
        {avatar ?
          <img src={avatar} alt="" className="size-full object-cover" />
        : <span>{name.split(" ").pop()?.charAt(0)}</span>}
      </div>
    );
  };

  /* ── Render a comment bubble (recursive, depth-based) ─── */
  const renderComment = (c: Comment, depth = 0) => {
    const isOwn = c.authorId === currentUser.id;
    const rs = repliesMap[c.id];
    const isExpanded = expandedReplies.has(c.id);
    // Cap visual indentation at depth 3 to avoid overflow
    const indentClass = depth > 0 ? "ml-8" : "";

    if (c.isDeleted) {
      return (
        <div key={c.id} className={indentClass}>
          <div className="flex gap-2">
            <div className="size-8 rounded-full shrink-0 flex items-center justify-center bg-gray-100 text-gray-400 border border-gray-200">
              <Trash2 className="size-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-2xl px-3 py-2 inline-block max-w-full border border-gray-200 border-dashed">
                <p className="text-xs italic text-gray-400 select-none">
                  Bình luận này đã bị xóa.
                </p>
              </div>
            </div>
          </div>

          {/* Nested replies – available at every depth even if parent is deleted */}
          {(c.totalReplies > 0 || (rs && rs.comments.length > 0)) && (
            <div className="ml-9 mt-1">
              {!isExpanded ?
                <button
                  onClick={() => toggleReplies(c.id)}
                  className="flex items-center gap-1 text-[12px] text-primary-500 font-medium hover:underline">
                  <CornerDownRight className="size-3" />
                  Xem {c.totalReplies || rs?.comments.length} trả lời
                </button>
              : <>
                  <button
                    onClick={() => toggleReplies(c.id)}
                    className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-2">
                    <ChevronDown className="size-3 rotate-180" />
                    Ẩn trả lời
                  </button>
                  {rs?.loading && rs.comments.length === 0 ?
                    <div className="flex justify-center py-1">
                      <Loader2 className="size-3 animate-spin text-primary-400" />
                    </div>
                  : <div className="space-y-2">
                      {(rs?.comments ?? []).map((r) =>
                        renderComment(r, depth + 1),
                      )}
                      {rs?.hasMore && (
                        <button
                          onClick={() => loadMoreReplies(c.id)}
                          disabled={rs.loading}
                          className="flex items-center gap-1 text-[12px] text-primary-500 font-medium hover:underline disabled:opacity-50 ml-9">
                          {rs.loading ?
                            <Loader2 className="size-3 animate-spin" />
                          : <ChevronDown className="size-3" />}
                          Xem thêm trả lời
                        </button>
                      )}
                    </div>
                  }
                </>
              }
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={c.id} className={indentClass}>
        <div className="flex gap-2 group">
          {renderAvatar(c.authorName, c.authorAvatar, c.authorId)}
          <div className="flex-1 min-w-0">
            <div className="bg-primary-50 rounded-2xl px-3 py-2 inline-block max-w-full">
              <p className="text-xs font-semibold text-gray-800">
                {c.authorName}
              </p>
              <p className="text-sm text-gray-700 wrap-break-word">{c.text}</p>
            </div>
            <div className="flex items-center gap-3 mt-0.5 px-1 flex-wrap">
              <span className="text-[11px] text-gray-400">{c.time}</span>
              {c.isEdited && (
                <span className="text-[11px] text-gray-400">
                  · đã chỉnh sửa
                </span>
              )}
              <button
                onClick={() => setReplyTo({ id: c.id, name: c.authorName })}
                className="text-[11px] text-primary-500 hover:underline font-medium">
                Trả lời
              </button>
              {isOwn && (
                <button
                  onClick={() => handleDelete(c)}
                  className="text-[11px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nested replies – available at every depth */}
        {(c.totalReplies > 0 || (rs && rs.comments.length > 0)) && (
          <div className="ml-9 mt-1">
            {!isExpanded ?
              <button
                onClick={() => toggleReplies(c.id)}
                className="flex items-center gap-1 text-[12px] text-primary-500 font-medium hover:underline">
                <CornerDownRight className="size-3" />
                Xem {c.totalReplies || rs?.comments.length} trả lời
              </button>
            : <>
                <button
                  onClick={() => toggleReplies(c.id)}
                  className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-2">
                  <ChevronDown className="size-3 rotate-180" />
                  Ẩn trả lời
                </button>
                {rs?.loading && rs.comments.length === 0 ?
                  <div className="flex justify-center py-1">
                    <Loader2 className="size-3 animate-spin text-primary-400" />
                  </div>
                : <div className="space-y-2">
                    {(rs?.comments ?? []).map((r) =>
                      renderComment(r, depth + 1),
                    )}
                    {rs?.hasMore && (
                      <button
                        onClick={() => loadMoreReplies(c.id)}
                        disabled={rs.loading}
                        className="flex items-center gap-1 text-[12px] text-primary-500 font-medium hover:underline disabled:opacity-50 ml-9">
                        {rs.loading ?
                          <Loader2 className="size-3 animate-spin" />
                        : <ChevronDown className="size-3" />}
                        Xem thêm trả lời
                      </button>
                    )}
                  </div>
                }
              </>
            }
          </div>
        )}
      </div>
    );
  };

  /* ── Main render ──────────────────────────────────── */
  return (
    <div className="border-t border-primary-100 px-4 pt-3 pb-2 space-y-3">
      {initialLoading ?
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-4 animate-spin text-primary-400" />
        </div>
      : roots.length === 0 ?
        <p className="text-center text-sm text-gray-400 py-2">
          Hãy là người đầu tiên bình luận!
        </p>
      : <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {roots.map((c) => renderComment(c, 0))}
          {rootHasMore && (
            <button
              onClick={loadMoreRoots}
              disabled={rootLoadingMore}
              className="w-full text-sm text-primary-500 font-medium hover:underline py-1 flex items-center justify-center gap-1 disabled:opacity-50">
              {rootLoadingMore ?
                <Loader2 className="size-4 animate-spin" />
              : <ChevronDown className="size-4" />}
              Xem thêm bình luận
            </button>
          )}
        </div>
      }

      {replyTo && (
        <div className="flex items-center gap-2 text-xs text-primary-500 bg-primary-50 px-3 py-1.5 rounded-lg">
          <CornerDownRight className="size-3" />
          <span>
            Đang trả lời <strong>{replyTo.name}</strong>
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="ml-auto text-gray-400 hover:text-gray-600 text-base leading-none">
            ×
          </button>
        </div>
      )}

      {currentUser.id && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}>
          {renderAvatar(currentUser.name, currentUser.avatar, currentUser.id)}
          <div className="flex-1 flex items-center bg-primary-50 rounded-full overflow-hidden px-3 gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                void submitComment();
              }}
              placeholder={
                replyTo ? `Trả lời ${replyTo.name}...` : "Viết bình luận..."
              }
              className="flex-1 bg-transparent text-sm py-2 outline-none text-gray-800 placeholder-gray-400"
              disabled={submitting}
              maxLength={500}
            />
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={!text.trim() || submitting}
              className="text-primary-500 hover:text-primary-700 transition disabled:opacity-30 shrink-0">
              {submitting ?
                <Loader2 className="size-4 animate-spin" />
              : <Send className="size-4" />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommentSection;
