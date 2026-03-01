import React, { useState, useEffect } from "react";
import { Send, Loader2, Trash2, CornerDownRight } from "lucide-react";
import {
  fetchComments,
  addComment,
  deleteComment,
} from "../../services/post.service";
import type { Comment } from "../../services/post.service";
import type { PostUser } from "./types";

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
  /** Callback khi số lượng comment thay đổi */
  onCountChange?: (count: number) => void;
}

const CommentSection: React.FC<Props> = ({
  postId,
  currentUser,
  onCountChange,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  );

  /* ── Load comments ─────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await fetchComments(postId);
      if (!cancelled) {
        setComments(list);
        onCountChange?.(list.length);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  /* ── Submit comment ────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !currentUser.id) return;

    setSubmitting(true);
    const created = await addComment(
      postId,
      currentUser.id,
      trimmed,
      replyTo?.id,
    );
    if (created) {
      setComments((prev) => [...prev, created]);
      onCountChange?.(comments.length + 1);
    }
    setText("");
    setReplyTo(null);
    setSubmitting(false);
  };

  /* ── Delete comment ────────────────────────────────── */
  const handleDelete = async (commentId: string) => {
    const ok = await deleteComment(postId, commentId);
    if (ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCountChange?.(comments.length - 1);
    }
  };

  /* ── Render ────────────────────────────────────────── */
  const topLevel = comments.filter((c) => !c.parentId);
  const getReplies = (id: string) => comments.filter((c) => c.parentId === id);

  const renderComment = (c: Comment) => {
    const colorIdx = c.authorId.charCodeAt(0) % AVATAR_COLORS.length;
    const isOwn = c.authorId === currentUser.id;
    const replies = getReplies(c.id);

    return (
      <div key={c.id} className={c.depth > 0 ? "ml-8" : ""}>
        <div className="flex gap-2 group">
          {/* Avatar */}
          <div
            className={`size-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${
              c.authorAvatar ? "" : AVATAR_COLORS[colorIdx]
            }`}>
            {c.authorAvatar ?
              <img
                src={c.authorAvatar}
                alt=""
                className="size-full rounded-full object-cover"
              />
            : <span>{c.authorName.split(" ").pop()?.charAt(0)}</span>}
          </div>

          {/* Bubble */}
          <div className="flex-1">
            <div className="bg-primary-50 rounded-2xl px-3 py-2 inline-block max-w-full">
              <p className="text-xs font-semibold text-gray-800">
                {c.authorName}
              </p>
              <p className="text-sm text-gray-700 wrap-break-word">{c.text}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-0.5 px-1">
              <span className="text-[11px] text-gray-400">{c.time}</span>
              {c.isEdited && (
                <span className="text-[11px] text-gray-400">
                  • đã chỉnh sửa
                </span>
              )}
              {c.depth === 0 && (
                <button
                  onClick={() => setReplyTo({ id: c.id, name: c.authorName })}
                  className="text-[11px] text-primary-500 hover:underline font-medium">
                  Trả lời
                </button>
              )}
              {isOwn && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-[11px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-2 space-y-2 ml-10">
            {replies.map(renderComment)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border-t border-primary-100 px-4 pt-3 pb-2 space-y-3">
      {/* Comment list */}
      {loading ?
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-4 animate-spin text-primary-400" />
        </div>
      : topLevel.length === 0 ?
        <p className="text-center text-sm text-gray-400 py-2">
          Hãy là người đầu tiên bình luận!
        </p>
      : <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {topLevel.map(renderComment)}
        </div>
      }

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 text-xs text-primary-500 bg-primary-50 px-3 py-1.5 rounded-lg">
          <CornerDownRight className="size-3" />
          <span>
            Đang trả lời <strong>{replyTo.name}</strong>
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="ml-auto text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
      )}

      {/* Input */}
      {currentUser.id && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div
            className={`size-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${
              currentUser.avatar ? "" : currentUser.color
            }`}>
            {currentUser.avatar ?
              <img
                src={currentUser.avatar}
                alt=""
                className="size-full rounded-full object-cover"
              />
            : <span>{currentUser.name.split(" ").pop()?.charAt(0)}</span>}
          </div>
          <div className="flex-1 flex items-center bg-primary-50 rounded-full overflow-hidden px-3 gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                replyTo ? `Trả lời ${replyTo.name}...` : "Viết bình luận..."
              }
              className="flex-1 bg-transparent text-sm py-2 outline-none text-gray-800 placeholder-gray-400"
              disabled={submitting}
              maxLength={500}
            />
            <button
              type="submit"
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
