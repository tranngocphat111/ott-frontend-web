import React, { useEffect, useMemo, useRef, useState } from "react";
import { Globe, Lock, Users } from "lucide-react";
import { fetchFriends, type FriendOption } from "../../services/social.service";
import {
  AddToPostToolbar,
  AuthorSection,
  CreatePostModalFooter,
  CreatePostModalHeader,
  CustomVisibilityPanel,
  DropZone,
  FeelingPicker,
  MediaPreviewGrid,
  type FeelingOption,
  type UploadedMedia,
  type VisibilityOption,
} from "./create-post";

/* ─── Types ──────────────────────────────────────────── */
interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (
    content: string,
    media: UploadedMedia[],
    visibility: string,
    accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[],
  ) => Promise<{ ok: boolean; error?: string }>;
  currentUser: {
    id: string;
    displayName: string;
    color: string;
    avatar?: string;
  };
  openWithFeeling?: boolean;
  initialPost?: {
    id: string;
    content: string;
    visibility?: string;
    media?: { url: string; type: "image" | "video"; caption?: string | null }[];
    accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[];
  };
  onUpdate?: (
    postId: string,
    content: string,
    media: UploadedMedia[],
    visibility: string,
    accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[],
  ) => Promise<{ ok: boolean; error?: string }>;
}

/* ─── Feelings ──────────────────────────────────────── */
const FEELINGS: FeelingOption[] = [
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
const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { value: "public", label: "Công khai", Icon: Globe },
  { value: "friends", label: "Bạn bè", Icon: Users },
  { value: "private", label: "Chỉ mình tôi", Icon: Lock },
  { value: "custom", label: "Tùy chỉnh", Icon: Users },
];

/* ════════════════════════════════════════════════════════ */
const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPost,
  currentUser,
  openWithFeeling = false,
  initialPost,
  onUpdate,
}) => {
  const [content, setContent] = useState(() => initialPost?.content ?? "");
  const [mediaFiles, setMediaFiles] = useState<UploadedMedia[]>(() =>
    (initialPost?.media ?? []).map((m, index) => ({
      id: `existing-${index}-${m.url}`,
      url: m.url,
      type: m.type,
      caption: m.caption ?? "",
      isExisting: true,
    })),
  );
  const [visibility, setVisibility] = useState(
    () => initialPost?.visibility?.toLowerCase() ?? "public",
  );
  const [showVisibility, setShowVisibility] = useState(false);
  const [showDropZone, setShowDropZone] = useState(
    () => (initialPost?.media?.length ?? 0) === 0,
  );
  const [feeling, setFeeling] = useState<FeelingOption | null>(null);
  const [showFeelingPicker, setShowFeelingPicker] = useState(
    () => openWithFeeling,
  );
  const [feelingSearch, setFeelingSearch] = useState("");
  const [customRuleType, setCustomRuleType] = useState<"INCLUDE" | "EXCLUDE">(
    () => initialPost?.accessControls?.[0]?.ruleType ?? "INCLUDE",
  );
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(
    () =>
      (initialPost?.visibility?.toLowerCase() === "custom" ?
        initialPost?.accessControls?.map((c) => c.accountId)
      : []) ?? [],
  );
  const [customError, setCustomError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(initialPost);

  useEffect(() => {
    if (!isOpen || visibility !== "custom" || !currentUser.id) return;
    if (friends.length > 0) return;

    const loadFriends = async () => {
      setFriendsLoading(true);
      const data = await fetchFriends(currentUser.id);
      setFriends(data);
      setFriendsLoading(false);
    };

    loadFriends();
  }, [currentUser.id, friends.length, isOpen, visibility]);

  /* ── Handlers ───────────────────────────────────────── */
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setSubmitError(null);
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
    if (typeof createImageBitmap === "function") {
      newItems.forEach((item) => {
        if (item.type !== "image" || !item.file) return;
        createImageBitmap(item.file).catch(() => undefined);
      });
    }
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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (isEditing && initialPost) {
      if (!content.trim() && mediaFiles.length === 0 && !feeling) return;
      if (visibility === "custom" && selectedFriendIds.length === 0) {
        setCustomError(
          "Vui lòng chọn ít nhất một người cho phạm vi tùy chỉnh.",
        );
        return;
      }
      setSubmitError(null);
      const feelingText =
        feeling ? ` — đang cảm thấy ${feeling.emoji} ${feeling.label}` : "";
      const accessControls =
        visibility === "custom" ?
          selectedFriendIds.map((id) => ({
            accountId: id,
            ruleType: customRuleType,
          }))
        : undefined;
      setIsSubmitting(true);
      const result = await onUpdate?.(
        initialPost.id,
        content + feelingText,
        mediaFiles,
        visibility,
        accessControls,
      );
      setIsSubmitting(false);
      if (!result?.ok) {
        setSubmitError(
          result?.error ?? "Cập nhật bài viết thất bại. Vui lòng thử lại.",
        );
        return;
      }
      onClose();
      return;
    }
    if (!content.trim() && mediaFiles.length === 0 && !feeling) return;
    if (visibility === "custom" && selectedFriendIds.length === 0) {
      setCustomError("Vui lòng chọn ít nhất một người cho phạm vi tùy chỉnh.");
      return;
    }
    setSubmitError(null);
    const feelingText =
      feeling ? ` — đang cảm thấy ${feeling.emoji} ${feeling.label}` : "";
    const accessControls =
      visibility === "custom" ?
        selectedFriendIds.map((id) => ({
          accountId: id,
          ruleType: customRuleType,
        }))
      : undefined;
    setIsSubmitting(true);
    const result = await onPost(
      content + feelingText,
      mediaFiles,
      visibility,
      accessControls,
    );
    setIsSubmitting(false);
    if (!result.ok) {
      setSubmitError(
        result.error ?? "Tạo bài viết thất bại. Vui lòng thử lại.",
      );
      return;
    }
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
  const filteredFriends = useMemo(() => {
    if (!friendSearch.trim()) return friends;
    return friends.filter((f) =>
      f.name.toLowerCase().includes(friendSearch.toLowerCase()),
    );
  }, [friendSearch, friends]);

  if (!isOpen) return null;

  /* ── JSX ────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <CreatePostModalHeader
          onClose={onClose}
          title={isEditing ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
        />

        {/* ── Scrollable body ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <AuthorSection
            currentUser={currentUser}
            feeling={feeling}
            onClearFeeling={() => setFeeling(null)}
            visibility={visibility}
            showVisibility={showVisibility}
            onToggleVisibility={() => setShowVisibility((value) => !value)}
            onSelectVisibility={(value) => {
              setVisibility(value);
              setShowVisibility(false);
              if (value !== "custom") {
                setSelectedFriendIds([]);
                setCustomError(null);
              }
            }}
            visibilityOptions={VISIBILITY_OPTIONS}
          />

          {visibility === "custom" && (
            <CustomVisibilityPanel
              customRuleType={customRuleType}
              onRuleTypeChange={setCustomRuleType}
              friendSearch={friendSearch}
              onFriendSearchChange={setFriendSearch}
              friendsLoading={friendsLoading}
              friends={filteredFriends}
              selectedFriendIds={selectedFriendIds}
              onToggleFriend={(friendId) => {
                setCustomError(null);
                setSelectedFriendIds((prev) =>
                  prev.includes(friendId) ?
                    prev.filter((id) => id !== friendId)
                  : [...prev, friendId],
                );
              }}
              customError={customError}
            />
          )}

          {/* Text area */}
          <div className="px-4 pb-2">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSubmitError(null);
              }}
              placeholder={`${currentUser.displayName.split(" ").pop()} ơi, bạn đang nghĩ gì vậy?`}
              className="w-full resize-none outline-none text-gray-800 placeholder-gray-400 text-lg leading-relaxed min-h-25"
              rows={4}
              autoFocus
            />
          </div>

          {/* Media preview */}
          {mediaFiles.length > 0 && (
            <div className="px-4 pb-3">
              <MediaPreviewGrid
                mediaFiles={mediaFiles}
                onUpdateCaption={updateCaption}
                onRemoveMedia={removeMedia}
              />
            </div>
          )}

          {/* Drop zone (when toolbar Image button clicked but no files yet) */}
          {showDropZone && mediaFiles.length === 0 && (
            <>
              <DropZone
                onDropFiles={handleFileSelect}
                onPickFiles={() => fileInputRef.current?.click()}
              />
            </>
          )}

          {/* Feeling picker panel */}
          {showFeelingPicker && (
            <FeelingPicker
              feelingSearch={feelingSearch}
              onFeelingSearchChange={setFeelingSearch}
              feelings={filteredFeelings}
              feeling={feeling}
              onSelectFeeling={(selectedFeeling) => {
                setFeeling(selectedFeeling);
                setShowFeelingPicker(false);
                setFeelingSearch("");
              }}
            />
          )}

          {/* Add-to-post toolbar */}
          <AddToPostToolbar
            onAddMedia={() => {
              setShowDropZone(true);
              fileInputRef.current?.click();
            }}
            onToggleFeeling={() => setShowFeelingPicker((value) => !value)}
            isFeelingActive={showFeelingPicker || feeling !== null}
          />
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        {submitError && (
          <p className="px-4 pb-2 text-xs text-red-600">{submitError}</p>
        )}

        <CreatePostModalFooter
          onSubmit={handleSubmit}
          canPost={canPost}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? "Lưu" : "Đăng"}
        />

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
