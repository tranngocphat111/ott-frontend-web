import React, { useState } from "react";
import { X, Globe, Users, Lock, Loader2 } from "lucide-react";
import type { Post, User } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  currentUser: User;
  onShare: (
    caption?: string,
    visibility: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Công khai", Icon: Globe },
  { value: "FRIEND", label: "Bạn bè", Icon: Users },
  { value: "PRIVATE", label: "Chỉ mình tôi", Icon: Lock },
];

const resolveRootPost = (input: Post): Post => {
  const seen = new Set<string>();
  let current = input;
  while (current.sharedPost && !seen.has(current.id)) {
    seen.add(current.id);
    current = current.sharedPost;
  }
  return current;
};

export const SharePostModal: React.FC<Props> = ({
  isOpen,
  onClose,
  post,
  currentUser,
  onShare,
}) => {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentVisibility =
    VISIBILITY_OPTIONS.find((o) => o.value === visibility) ||
    VISIBILITY_OPTIONS[0];
  const previewPost = post.sharedPost ? resolveRootPost(post.sharedPost) : post;
  const previewUnavailable = Boolean(
    post.sharedPostDeleted ||
    post.sharedPostRestricted ||
    post.sharedPostCollapsed,
  );

  const handleShareClick = async () => {
    setError(null);
    setIsSubmitting(true);
    const res = await onShare(caption.trim() || undefined, visibility);
    setIsSubmitting(false);
    if (res.ok) {
      onClose();
    } else {
      setError(res.error || "Chia sẻ bài viết thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mx-auto">
            Chia sẻ bài viết
          </h3>
          <button
            onClick={onClose}
            className="absolute right-4 top-3 size-8 rounded-full bg-gray-100 hover:bg-gray-200 transition inline-flex items-center justify-center"
            disabled={isSubmitting}>
            <X className="size-4 text-gray-700" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Author metadata & visibility */}
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-full flex items-center justify-center text-white font-semibold ${currentUser.avatar ? "" : currentUser.color}`}>
              {currentUser.avatar ?
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="size-full rounded-full object-cover"
                />
              : currentUser.displayName.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {currentUser.displayName}
              </div>
              {/* Visibility dropdown */}
              <div className="relative mt-1">
                <button
                  type="button"
                  onClick={() => setShowVisibilityMenu((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  disabled={isSubmitting}>
                  <currentVisibility.Icon className="size-3.5" />
                  <span>{currentVisibility.label}</span>
                </button>

                {showVisibilityMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowVisibilityMenu(false)}
                    />
                    <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setVisibility(opt.value);
                            setShowVisibilityMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition ${
                            visibility === opt.value ?
                              "text-primary-600 font-semibold"
                            : "text-gray-700"
                          }`}>
                          <opt.Icon className="size-4" />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Caption textarea */}
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Hãy viết gì đó về bài viết này..."
              className="w-full resize-none outline-none text-gray-800 placeholder-gray-400 text-base leading-relaxed min-h-[80px]"
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Preview of Original Post */}
          <div className="p-3 bg-gray-50/70 border border-gray-200 rounded-xl pointer-events-none">
            {previewUnavailable ?
              <div className="text-sm text-gray-500">
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
            : <>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`size-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold ${previewPost.author.avatar ? "" : previewPost.author.color}`}>
                    {previewPost.author.avatar ?
                      <img
                        src={previewPost.author.avatar}
                        alt={previewPost.author.displayName}
                        className="size-full rounded-full object-cover"
                      />
                    : previewPost.author.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800">
                      {previewPost.author.displayName}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {previewPost.time}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-3">
                  {previewPost.content}
                </p>
                {previewPost.media && previewPost.media.length > 0 && (
                  <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden border border-gray-100 max-h-20 bg-gray-100">
                    {previewPost.media.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video bg-gray-200">
                        {item.type === "video" ?
                          <video
                            src={item.url}
                            className="size-full object-cover animate-none"
                            muted
                          />
                        : <img
                            src={item.url}
                            alt=""
                            className="size-full object-cover"
                          />
                        }
                      </div>
                    ))}
                  </div>
                )}
              </>
            }
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
          {error && (
            <div className="text-xs text-red-600 text-center">{error}</div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              disabled={isSubmitting}>
              Hủy
            </button>
            <button
              onClick={handleShareClick}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition flex items-center gap-1.5 min-w-[100px] justify-center"
              disabled={isSubmitting}>
              {isSubmitting ?
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Đang chia sẻ...</span>
                </>
              : <span>Chia sẻ ngay</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
