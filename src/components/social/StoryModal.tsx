import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { createStory } from "../../services/story.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onCreated?: () => Promise<void> | void;
}

type StoryFormType = "TEXT_ITEM" | "IMAGE_ITEM" | "VIDEO_ITEM";

const BASE_STORY_ITEM = {
  isPrimary: true,
  zIndex: 1,
  positionX: 0.5,
  positionY: 0.5,
  rotation: 0,
  scale: 1,
  startTime: 0,
  endTime: 10000,
};

const StoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUserId,
  onCreated,
}) => {
  const [type, setType] = useState<StoryFormType>("TEXT_ITEM");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [isHighlight, setIsHighlight] = useState(false);
  const [highlightName, setHighlightName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!currentUserId || submitting) return false;
    if (type === "TEXT_ITEM") return textContent.trim().length > 0;
    return mediaUrl.trim().length > 0;
  }, [currentUserId, mediaUrl, submitting, textContent, type]);

  if (!isOpen) return null;

  const reset = () => {
    setType("TEXT_ITEM");
    setVisibility("PUBLIC");
    setIsHighlight(false);
    setHighlightName("");
    setTextContent("");
    setMediaUrl("");
    setSubmitting(false);
    setError(null);
  };

  const closeModal = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const storyItem =
        type === "TEXT_ITEM" ?
          {
            type: "TEXT_ITEM",
            textItem: {
              ...BASE_STORY_ITEM,
              content: textContent.trim(),
              font: "Inter",
              color: "#FFFFFF",
              backgroundColor: "#111827",
              alignment: "CENTER",
            },
          }
        : type === "IMAGE_ITEM" ?
          {
            type: "IMAGE_ITEM",
            imageItem: {
              ...BASE_STORY_ITEM,
              url: mediaUrl.trim(),
              width: 1080,
              height: 1920,
            },
          }
        : {
            type: "VIDEO_ITEM",
            videoItem: {
              ...BASE_STORY_ITEM,
              url: mediaUrl.trim(),
              thumbnailUrl: mediaUrl.trim(),
              duration: 15000,
              width: 720,
              height: 1280,
            },
          };

      const saved = await createStory({
        userId: currentUserId,
        visibility,
        isHighlight,
        highlightName: isHighlight ? highlightName.trim() || null : null,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        storyItems: [storyItem],
        musics: [],
      });

      if (!saved) {
        setError("Không thể tạo story. Vui lòng thử lại.");
        setSubmitting(false);
        return;
      }

      if (onCreated) await onCreated();
      closeModal();
    } catch {
      setError("Có lỗi xảy ra khi tạo story.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="w-8" />
            <h3 className="text-lg font-semibold text-gray-900">Tạo Story</h3>
            <button
              type="button"
              onClick={closeModal}
              className="size-8 bg-gray-100 hover:bg-gray-200 rounded-full inline-flex items-center justify-center transition">
              <X className="size-4 text-gray-700" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại story
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as StoryFormType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="TEXT_ITEM">Text</option>
                <option value="IMAGE_ITEM">Image URL</option>
                <option value="VIDEO_ITEM">Video URL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="PUBLIC">PUBLIC</option>
                <option value="FRIENDS">FRIENDS</option>
                <option value="PRIVATE">PRIVATE</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="story-highlight"
                type="checkbox"
                checked={isHighlight}
                onChange={(e) => setIsHighlight(e.target.checked)}
                className="size-4"
              />
              <label
                htmlFor="story-highlight"
                className="text-sm text-gray-700">
                Đánh dấu highlight
              </label>
            </div>

            {isHighlight && (
              <input
                value={highlightName}
                onChange={(e) => setHighlightName(e.target.value)}
                placeholder="Tên highlight"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            )}

            {type === "TEXT_ITEM" ?
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Nhập nội dung story..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
              />
            : <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={
                  type === "IMAGE_ITEM" ? "Nhập image URL" : "Nhập video URL"
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            }

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="px-4 py-3 flex justify-end gap-2 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition">
              Hủy
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canSubmit}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium disabled:opacity-60 hover:bg-primary-600 transition">
              {submitting ? "Đang tạo..." : "Đăng story"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryModal;
