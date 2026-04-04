import React, { useState, useRef } from "react";
import {
  X,
  Image,
  Smile,
  MapPin,
  Tag,
  ChevronDown,
  Globe,
  Users,
  Lock,
  Plus,
  Film,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────── */
export interface UploadedMedia {
  id: string;
  file: File;
  url: string;
  type: "image" | "video";
  caption?: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (content: string, media: UploadedMedia[], visibility: string) => void;
  currentUser: { displayName: string; color: string; avatar?: string };
  openWithFeeling?: boolean;
}

/* ─── Feelings ──────────────────────────────────────── */
const FEELINGS = [
  { emoji: "😊", label: "vui vẻ" },
  { emoji: "😍", label: "yêu đời" },
  { emoji: "🥰", label: "hạnh phúc" },
  { emoji: "😎", label: "tự tin" },
  { emoji: "🤩", label: "phấn khích" },
  { emoji: "😌", label: "bình yên" },
  { emoji: "🥳", label: "vui mừng" },
  { emoji: "😴", label: "buồn ngủ" },
  { emoji: "😢", label: "buồn" },
  { emoji: "😤", label: "tức giận" },
  { emoji: "😰", label: "lo lắng" },
  { emoji: "🤒", label: "không khỏe" },
  { emoji: "😇", label: "biết ơn" },
  { emoji: "💪", label: "đầy năng lượng" },
  { emoji: "🤔", label: "suy nghĩ" },
  { emoji: "😋", label: "đói bụng" },
  { emoji: "🥺", label: "xúc động" },
  { emoji: "😜", label: "tinh nghịch" },
  { emoji: "🤗", label: "ấm áp" },
  { emoji: "😑", label: "chán nản" },
];

/* ─── Visibility options ─────────────────────────────── */
const VISIBILITY_OPTIONS = [
  { value: "public", label: "Công khai", Icon: Globe },
  { value: "friends", label: "Bạn bè", Icon: Users },
  { value: "private", label: "Chỉ mình tôi", Icon: Lock },
];

/* ════════════════════════════════════════════════════════ */
const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPost,
  currentUser,
  openWithFeeling = false,
}) => {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<UploadedMedia[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [showVisibility, setShowVisibility] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feeling, setFeeling] = useState<{
    emoji: string;
    label: string;
  } | null>(null);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [feelingSearch, setFeelingSearch] = useState("");
  // Reset showFeelingPicker mỗi lần modal mở ra (setState-during-render)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setShowFeelingPicker(openWithFeeling);
    }
  }
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  /* ── Handlers ───────────────────────────────────────── */
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newItems: UploadedMedia[] = [];
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (isImage || isVideo) {
        newItems.push({
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          type: isImage ? "image" : "video",
          caption: "",
        });
      }
    });
    setMediaFiles((prev) => [...prev, ...newItems]);
    setShowDropZone(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateCaption = (id: string, caption: string) => {
    setMediaFiles((prev) =>
      prev.map((m) => (m.id === id ? { ...m, caption } : m)),
    );
  };

  const removeMedia = (id: string) => {
    setMediaFiles((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) URL.revokeObjectURL(item.url);
      const next = prev.filter((m) => m.id !== id);
      if (next.length === 0) setShowDropZone(false);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmit = () => {
    if (!content.trim() && mediaFiles.length === 0 && !feeling) return;
    const feelingText =
      feeling ? ` — đang cảm thấy ${feeling.emoji} ${feeling.label}` : "";
    onPost(content + feelingText, mediaFiles, visibility);
    setContent("");
    setMediaFiles([]);
    setShowDropZone(false);
    setFeeling(null);
    setFeelingSearch("");
    setShowFeelingPicker(false);
    onClose();
  };

  const canPost =
    content.trim().length > 0 || mediaFiles.length > 0 || feeling !== null;

  const filteredFeelings =
    feelingSearch.trim() ?
      FEELINGS.filter((f) =>
        f.label.toLowerCase().includes(feelingSearch.toLowerCase()),
      )
    : FEELINGS;
  const currentOpt = VISIBILITY_OPTIONS.find((v) => v.value === visibility)!;
  const VisIcon = currentOpt.Icon;

  /* ── Media preview grid ─────────────────────────────── */
  const renderGrid = () => {
    const count = mediaFiles.length;
    if (count === 0) return null;

    if (count === 1) {
      const m = mediaFiles[0];
      return (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          {/* Preview */}
          <div className="relative bg-gray-900">
            {m.type === "image" ?
              <img
                src={m.url}
                alt=""
                className="w-full max-h-72 object-contain"
              />
            : <video src={m.url} controls className="w-full max-h-72" />}
            <button
              onClick={() => removeMedia(m.id)}
              className="absolute top-2 right-2 size-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition">
              <X className="size-3.5" />
            </button>
          </div>
          {/* Caption input */}
          <div className="bg-white px-3 py-2">
            <input
              type="text"
              value={m.caption ?? ""}
              onChange={(e) => updateCaption(m.id, e.target.value)}
              placeholder="Thêm caption cho ảnh/video này..."
              maxLength={200}
              className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            />
          </div>
        </div>
      );
    }

    const gridCols =
      count === 2 ? "grid-cols-2"
      : count === 3 ? "grid-cols-3"
      : "grid-cols-2";

    return (
      <div className="space-y-2">
        {/* Grid preview */}
        <div className={`grid ${gridCols} gap-1 rounded-xl overflow-hidden`}>
          {mediaFiles.slice(0, 4).map((m, idx) => (
            <div
              key={m.id}
              className="relative aspect-square bg-gray-900 overflow-hidden">
              {m.type === "image" ?
                <img
                  src={m.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              : <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                  <Film className="size-10 text-white/60" />
                  <span className="text-white/70 text-xs mt-1">Video</span>
                </div>
              }
              {idx === 3 && count > 4 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{count - 4}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeMedia(m.id)}
                className="absolute top-1 right-1 size-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Per-item caption inputs */}
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {mediaFiles.map((m, idx) => (
            <div
              key={m.id}
              className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-gray-50 transition">
              {/* Thumbnail */}
              <div className="size-10 rounded-lg overflow-hidden bg-gray-900 shrink-0">
                {m.type === "image" ?
                  <img
                    src={m.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                : <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Film className="size-4 text-white/60" />
                  </div>
                }
              </div>
              {/* Caption input */}
              <input
                type="text"
                value={m.caption ?? ""}
                onChange={(e) => updateCaption(m.id, e.target.value)}
                placeholder={`Caption ${m.type === "image" ? "ảnh" : "video"} ${idx + 1}...`}
                maxLength={200}
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent min-w-0"
              />
              {/* Remove */}
              <button
                onClick={() => removeMedia(m.id)}
                className="size-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition shrink-0">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ── JSX ────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="w-8" />
          <h2 className="font-bold text-lg text-gray-900">Tạo bài viết</h2>
          <button
            onClick={onClose}
            className="size-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition">
            <X className="size-4 text-gray-700" />
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* Author + Visibility */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <div
              className={`size-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center ${
                !currentUser.avatar ? currentUser.color : ""
              }`}>
              {currentUser.avatar ?
                <img
                  src={currentUser.avatar}
                  alt=""
                  className="size-full object-cover"
                />
              : <span className="text-white font-bold text-sm">
                  {currentUser.displayName.split(" ").pop()?.charAt(0)}
                </span>
              }
            </div>
            <div>
              <div className="flex items-center gap-1 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">
                  {currentUser.displayName}
                </p>
                {feeling && (
                  <span className=" text-center text-sm text-gray-600">
                    đang cảm thấy {feeling.emoji}{" "}
                    <span className="font-medium text-gray-700">
                      {feeling.label}
                    </span>
                    <button
                      onClick={() => setFeeling(null)}
                      className="ml-1 text-gray-400 hover:text-gray-600 transition align-middle">
                      <X className="size-3 inline" />
                    </button>
                  </span>
                )}
              </div>
              {/* Visibility selector */}
              <div className="relative">
                <button
                  onClick={() => setShowVisibility((v) => !v)}
                  className="flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium text-gray-700 transition">
                  <VisIcon className="size-3" />
                  <span>{currentOpt.label}</span>
                  <ChevronDown className="size-3" />
                </button>
                {showVisibility && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-36 overflow-hidden">
                    {VISIBILITY_OPTIONS.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setVisibility(value);
                          setShowVisibility(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition ${
                          visibility === value ?
                            "text-primary-600 font-semibold"
                          : "text-gray-700"
                        }`}>
                        <Icon className="size-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text area */}
          <div className="px-4 pb-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${currentUser.displayName.split(" ").pop()} ơi, bạn đang nghĩ gì vậy?`}
              className="w-full resize-none outline-none text-gray-800 placeholder-gray-400 text-lg leading-relaxed min-h-25"
              rows={4}
              autoFocus
            />
          </div>

          {/* Media preview */}
          {mediaFiles.length > 0 && (
            <div className="px-4 pb-3">{renderGrid()}</div>
          )}

          {/* Drop zone (when toolbar Image button clicked but no files yet) */}
          {showDropZone && mediaFiles.length === 0 && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`mx-4 mb-3 h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition ${
                isDragging ?
                  "border-primary-500 bg-primary-50"
                : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
              }`}>
              <Plus className="size-8 text-gray-400 mb-1" />
              <p className="text-sm font-medium text-gray-600">
                Thêm ảnh / video
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                hoặc kéo và thả vào đây
              </p>
            </div>
          )}

          {/* Feeling picker panel */}
          {showFeelingPicker && (
            <div className="mx-4 mb-3 border border-yellow-200 rounded-xl overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-yellow-100">
                <Smile className="size-4 text-yellow-500 shrink-0" />
                <input
                  type="text"
                  value={feelingSearch}
                  onChange={(e) => setFeelingSearch(e.target.value)}
                  placeholder="Tìm cảm xúc..."
                  className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-4 gap-1 p-2 max-h-48 overflow-y-auto">
                {filteredFeelings.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => {
                      setFeeling(f);
                      setShowFeelingPicker(false);
                      setFeelingSearch("");
                    }}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-yellow-50 transition ${
                      feeling?.label === f.label ?
                        "bg-yellow-100 ring-1 ring-yellow-300"
                      : ""
                    }`}>
                    <span className="text-xl">{f.emoji}</span>
                    <span className="text-xs text-gray-600 leading-tight text-center">
                      {f.label}
                    </span>
                  </button>
                ))}
                {filteredFeelings.length === 0 && (
                  <p className="col-span-4 text-center text-sm text-gray-400 py-4">
                    Không tìm thấy cảm xúc
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Add-to-post toolbar */}
          <div className="mx-4 mb-3 border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Thêm vào bài viết
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  setShowDropZone(true);
                  fileInputRef.current?.click();
                }}
                title="Ảnh / Video"
                className="p-2 hover:bg-gray-100 rounded-full transition">
                <Image className="size-5 text-green-500" />
              </button>
              <button
                title="Cảm xúc / Hoạt động"
                onClick={() => setShowFeelingPicker((v) => !v)}
                className={`p-2 rounded-full transition ${
                  showFeelingPicker || feeling ?
                    "bg-yellow-100 text-yellow-500"
                  : "hover:bg-gray-100 text-yellow-500"
                }`}>
                <Smile className="size-5" />
              </button>
              <button
                title="Check in"
                className="p-2 hover:bg-gray-100 rounded-full transition">
                <MapPin className="size-5 text-red-500" />
              </button>
              <button
                title="Gắn thẻ bạn bè"
                className="p-2 hover:bg-gray-100 rounded-full transition">
                <Tag className="size-5 text-blue-500" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!canPost}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm">
            Đăng
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>
    </div>
  );
};

export default CreatePostModal;
