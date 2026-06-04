import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Film,
  Image as ImageIcon,
  Music2,
  RotateCw,
  Settings,
  Smile,
  Type,
  X,
  Trash2,
  Globe,
  Users,
  Lock
} from "lucide-react";
import { createStory, updateStory, uploadStoryMedia } from "../../../services/story.service";
import { fetchFriends, type FriendOption } from "../../../services/social.service";
import { CustomVisibilityPanel } from "../create-post";
import type { StoryContentItem, StoryItem } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  onCreated?: (story?: any) => Promise<void> | void;
  editingStory?: StoryItem | null;
}

type Step = "picker" | "text" | "image";
type MediaType = "image" | "video" | null;

const TEXT_BACKGROUNDS = [
  "bg-gradient-to-br from-blue-500 to-indigo-600",
  "bg-gradient-to-br from-pink-500 to-rose-500",
  "bg-gradient-to-br from-cyan-400 to-blue-500",
  "bg-gradient-to-br from-red-400 to-pink-500",
  "bg-gradient-to-br from-indigo-600 to-violet-700",
  "bg-black",
  "bg-gradient-to-br from-fuchsia-500 to-blue-500",
  "bg-gradient-to-br from-orange-500 to-red-500",
  "bg-gradient-to-br from-yellow-500 to-orange-400",
  "bg-gradient-to-br from-pink-300 to-cyan-300",
  "bg-gradient-to-br from-lime-300 to-yellow-300",
  "bg-gradient-to-br from-gray-500 to-slate-700",
  "bg-gradient-to-br from-violet-700 to-indigo-900",
  "bg-gradient-to-br from-teal-300 to-pink-300",
  "bg-gradient-to-br from-rose-300 to-yellow-300",
  "bg-gradient-to-br from-indigo-500 to-orange-500",
];

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

const CreateStoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onCreated,
  editingStory,
}) => {
  const [step, setStep] = useState<Step>("picker");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MOBILE_TOOLS = [
    { id: 'music', icon: Music2, label: 'Nhạc', onClick: () => { } },
    {
      id: 'text', icon: Type, label: 'Văn bản', onClick: () => {
        const text = prompt("Nhập nội dung text:");
        if (text) handleAddItem("TEXT", text);
      }
    },
    { id: 'media', icon: ImageIcon, label: 'Phương tiện', onClick: () => fileInputRef.current?.click() },
  ];

  const [textContent, setTextContent] = useState("");
  const [textStyle, setTextStyle] = useState("Clean");
  const [selectedBg, setSelectedBg] = useState(0);
  const [visibility, setVisibility] = useState("FRIENDS");
  const [showVisibility, setShowVisibility] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [uploadedImageKey, setUploadedImageKey] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [videoDuration, setVideoDuration] = useState(15000);
  const [imageWidth, setImageWidth] = useState(1080);
  const [imageHeight, setImageHeight] = useState(1920);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [overlayText, setOverlayText] = useState("");
  const [alternativeText, setAlternativeText] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [items, setItems] = useState<StoryContentItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showMobileEditModal, setShowMobileEditModal] = useState(false);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  // Visibility Custom States
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [customRuleType, setCustomRuleType] = useState<"INCLUDE" | "EXCLUDE">("INCLUDE");
  const [customError, setCustomError] = useState<string | null>(null);
  const [showCustomPanel, setShowCustomPanel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen || visibility !== "CUSTOM" || !currentUserId) return;
    if (friends.length > 0) return;

    const loadFriends = async () => {
      setFriendsLoading(true);
      const data = await fetchFriends(currentUserId);
      setFriends(data);
      setFriendsLoading(false);
    };

    loadFriends();
  }, [currentUserId, friends.length, isOpen, visibility]);

  const filteredFriends = useMemo(() => {
    if (!friendSearch.trim()) return friends;
    return friends.filter((f) =>
      f.name.toLowerCase().includes(friendSearch.toLowerCase()),
    );
  }, [friendSearch, friends]);

  const canShare = useMemo(() => {
    if (submitting || !currentUserId) return false;
    if (step === "text") return textContent.trim().length > 0;
    if (step === "image") return (items.length > 0 || Boolean(uploadedImageKey)) && !uploadingImage;
    return false;
  }, [
    submitting,
    currentUserId,
    step,
    textContent,
    uploadedImageKey,
    uploadingImage,
    items,
  ]);

  const resetState = () => {
    setStep("picker");
    setSubmitting(false);
    setError(null);
    setTextContent("");
    setTextStyle("Clean");
    setSelectedBg(0);
    setVisibility("FRIENDS");
    setImagePreviewUrl("");
    setUploadedImageKey("");
    setUploadingImage(false);
    setMediaType(null);
    setVideoDuration(15000);
    setImageWidth(1080);
    setImageHeight(1920);
    setImageScale(1);
    setImageRotation(0);
    setOverlayText("");
    setAlternativeText("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleChooseText = () => {
    setStep("text");
    setError(null);
    // If not already has items, maybe add one?
    if (items.length === 0) {
      // Just keep textContent for now or convert to item
    }
  };

  const handleAddItem = (type: "TEXT" | "IMAGE" | "VIDEO", content?: string) => {
    const newItem: StoryContentItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      textContent: content,
      positionX: 0.5,
      positionY: 0.5,
      scale: 1,
      rotation: 0,
      zIndex: items.length + 1,
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id || null);
    setStep("image"); // Switch to canvas view
  };

  const handleItemMove = (id: string, deltaX: number, deltaY: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? {
        ...item,
        positionX: item.positionX + deltaX,
        positionY: item.positionY + deltaY
      } : item
    ));
  };

  const handleItemTransform = (id: string, scaleDelta: number, rotateDelta: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? {
        ...item,
        scale: Math.max(0.2, Math.min(5, item.scale + scaleDelta)),
        rotation: (item.rotation + rotateDelta) % 360
      } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleUpdateItemZIndex = (id: string, delta: number) => {
    setItems(prev => {
      const item = prev.find(it => it.id === id);
      if (!item) return prev;
      const newZIndex = Math.max(1, item.zIndex + delta);
      return prev.map(it => it.id === id ? { ...it, zIndex: newZIndex } : it);
    });
  };

  const handlePickImage = async (file?: File) => {
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    const nextType: MediaType =
      file.type.startsWith("video/") ? "video" : "image";
    setMediaType(nextType);
    setImagePreviewUrl(localUrl);
    setUploadingImage(true);
    setUploadedImageKey("");

    const finalizeItem = (w: number, h: number) => {
      const newItem: StoryContentItem = {
        id: Math.random().toString(36).substring(2, 9),
        type: nextType === "video" ? "VIDEO" : "IMAGE",
        url: localUrl,
        positionX: 0.5,
        positionY: 0.5,
        width: w,
        height: h,
        scale: 1,
        rotation: 0,
        zIndex: items.length + 1,
        file: file,
      };
      setItems(prev => [...prev, newItem]);
      setSelectedItemId(newItem.id || null);
    };

    if (nextType === "image") {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 1080;
        const h = img.naturalHeight || 1920;
        setImageWidth(w);
        setImageHeight(h);
        finalizeItem(w, h);
      };
      img.src = localUrl;
    } else {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const w = video.videoWidth || 720;
        const h = video.videoHeight || 1280;
        setImageWidth(w);
        setImageHeight(h);
        setVideoDuration(
          Number.isFinite(video.duration) ?
            Math.round(video.duration * 1000)
            : 15000,
        );
        finalizeItem(w, h);
      };
      video.src = localUrl;
    }

    setUploadingImage(false);
    setSelectedFile(file);
    const blobUrl = localUrl;
    setUploadedImageKey(blobUrl);
  };

  useEffect(() => {
    if (editingStory && isOpen) {
      if (editingStory.items && editingStory.items.length > 0) {
        setItems(editingStory.items);
        setStep("image"); // Default to canvas view if multiple items exist
      } else if (editingStory.contentType === "TEXT") {
        setStep("image");
        setItems([{
          id: 'legacy-text-' + Math.random().toString(36).substring(2, 5),
          type: 'TEXT',
          textContent: editingStory.textContent,
          textBackgroundColor: editingStory.textBackgroundColor,
          positionX: 0.5,
          positionY: 0.5,
          scale: 1,
          rotation: 0,
          zIndex: 1
        }]);
      } else if (editingStory.contentType === "IMAGE" || editingStory.contentType === "VIDEO") {
        setStep("image");
        setItems([{
          id: 'legacy-media-' + Math.random().toString(36).substring(2, 5),
          type: editingStory.contentType,
          url: editingStory.imageUrl || editingStory.videoUrl,
          positionX: 0.5,
          positionY: 0.5,
          scale: 1,
          rotation: 0,
          zIndex: 1
        }]);
        setImagePreviewUrl(editingStory.imageUrl || editingStory.videoUrl || "");
        setUploadedImageKey(editingStory.imageUrl || editingStory.videoUrl || "");
        setMediaType(editingStory.contentType === "VIDEO" ? "video" : "image");
      }
      if (editingStory.visibility) {
        setVisibility(editingStory.visibility);
        if (editingStory.visibility === "CUSTOM" && editingStory.accessControls) {
          setSelectedFriendIds(editingStory.accessControls.map(ac => ac.accountId));
          if (editingStory.accessControls.length > 0) {
            setCustomRuleType(editingStory.accessControls[0].ruleType);
          }
        }
      }
    }
  }, [editingStory, isOpen]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleShare = async () => {
    if (!canShare) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1. Prepare items to share
      let itemsToShare = [...items];

      // If we're in quick-text mode and items is empty, create a synthetic item
      // IMPORTANT: Only do this for NEW stories. For editing, we must have items.
      if (!editingStory && step === "text" && itemsToShare.length === 0) {
        itemsToShare = [{
          id: 'quick-text-' + Math.random().toString(36).substring(2, 5),
          type: "TEXT",
          textContent: textContent.trim() || currentUserName,
          textBackgroundColor: TEXT_BACKGROUNDS[selectedBg].replace('bg-', '').includes('gradient') ? undefined : TEXT_BACKGROUNDS[selectedBg],
          positionX: 0.5,
          positionY: 0.5,
          scale: 1,
          rotation: 0,
          zIndex: 1
        }];
      }

      if (itemsToShare.length === 0 && !editingStory) {
        setError("Story không có nội dung.");
        setSubmitting(false);
        return;
      }

      // 2. Upload all new media items
      const processedItems = await Promise.all(itemsToShare.map(async (item) => {
        if (item.file && (item.type === "IMAGE" || item.type === "VIDEO")) {
          if (item.url?.startsWith("blob:")) {
            const uploadRes = await uploadStoryMedia(item.file);
            if (uploadRes) {
              return { ...item, url: uploadRes.fileKey };
            }
          }
        }
        return item;
      }));

      // 3. Map to Backend DTO
      const finalStoryItems = processedItems.map(item => ({
        type: item.type === "IMAGE" ? "IMAGE_ITEM" : item.type === "VIDEO" ? "VIDEO_ITEM" : "TEXT_ITEM",
        imageItem: item.type === "IMAGE" ? { ...BASE_STORY_ITEM, url: item.url, width: item.width, height: item.height } : null,
        videoItem: item.type === "VIDEO" ? { ...BASE_STORY_ITEM, url: item.url, width: item.width, height: item.height } : null,
        textItem: item.type === "TEXT" ? {
          ...BASE_STORY_ITEM,
          content: item.textContent,
          backgroundColor: item.textBackgroundColor
        } : null,
        isPrimary: item.zIndex === 1,
        zIndex: item.zIndex,
        positionX: item.positionX,
        positionY: item.positionY,
        scale: item.scale,
        rotation: item.rotation,
        id: item.id && !item.id.startsWith('legacy-') && !item.id.startsWith('quick-') ? item.id : null,
      }));

      // 4. Send to Backend

      let saved: any = null;
      const accessControls = visibility === "CUSTOM" ?
        selectedFriendIds.map(id => ({ accountId: id, ruleType: customRuleType })) :
        undefined;

      if (editingStory) {
        saved = await updateStory(
          editingStory.id,
          {
            userId: currentUserId,
            visibility: visibility as any,
            accessControls,
            storyItems: finalStoryItems,
            expireAt: editingStory.expireAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          selectedFile ? [selectedFile] : undefined
        );
        if (!saved) {
          setError("Không thể cập nhật story. Vui lòng thử lại.");
          setSubmitting(false);
          return;
        }
      } else {
        saved = await createStory({
          userId: currentUserId,
          visibility: visibility as any,
          accessControls,
          isHighlight: false,
          highlightName: null,
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          storyItems: finalStoryItems,
          musics: [],
          hashTags: alternativeText.trim() ? [alternativeText.trim()] : [],
        });

        if (!saved) {
          setError("Không thể chia sẻ story. Vui lòng thử lại.");
          setSubmitting(false);
          return;
        }
      }

      if (onCreated && saved) {
        // Patch media URLs with local blob URLs to avoid "S3 upload lag" (broken images)
        const patchedSaved = { ...saved };
        if (patchedSaved.storyItems) {
          patchedSaved.storyItems = patchedSaved.storyItems.map((apiItem: any, idx: number) => {
            const localItem = items[idx];
            if (localItem?.localUrl?.startsWith("blob:")) {
              const patchedItem = { ...apiItem };
              if (patchedItem.imageItem) {
                patchedItem.imageItem = { ...patchedItem.imageItem, url: localItem.localUrl };
              } else if (patchedItem.videoItem) {
                patchedItem.videoItem = { ...patchedItem.videoItem, url: localItem.localUrl };
              }
              return patchedItem;
            }
            return apiItem;
          });
        }
        await onCreated(patchedSaved);
      }
      handleClose();
    } catch (err: any) {
      console.error("Share story error:", err);
      if (err.response?.status === 401) {
        setError("Phiên làm việc hết hạn. Vui lòng tải lại trang và thử lại.");
      } else {
        setError(err.message || "Có lỗi xảy ra khi đăng story");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const dragStartPos = useRef<{ x: number, y: number } | null>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const phoneCanvas = (
    <div
      className="story-canvas w-[310px] h-[550px] rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 bg-[#111418] flex items-center justify-center transition-all duration-500 scale-[0.9] sm:scale-100"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        handlePickImage(event.dataTransfer.files?.[0]);
      }}
    >
      {items.length === 0 && step === "text" && (
        <div className={`absolute inset-0 ${TEXT_BACKGROUNDS[selectedBg]} flex items-center justify-center p-8 transition-colors duration-500`}>
          <p className="text-white text-3xl font-black text-center break-words whitespace-pre-wrap drop-shadow-2xl">
            {textContent || "Chạm để nhập..."}
          </p>
        </div>
      )}

      {items.length === 0 && step === "image" && !imagePreviewUrl && (
        <div className="text-center space-y-4 animate-in fade-in zoom-in">
          <div className="size-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/20">
            <ImageIcon className="size-8 text-white/50" />
          </div>
          <div className="text-sm text-white/60 font-medium">
            Kéo ảnh hoặc video vào đây
          </div>
          <button
            type="button"
            className="px-6 py-2.5 rounded-full bg-white text-sm font-bold text-slate-900 shadow-xl hover:scale-105 transition"
            onClick={() => fileInputRef.current?.click()}>
            Chọn file
          </button>
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className={`absolute cursor-move select-none transition-shadow ${selectedItemId === item.id ? "ring-2 ring-blue-500 rounded-lg p-1" : ""
            } ${isDragging && selectedItemId === item.id ? "shadow-2xl scale-[1.02] z-[100]" : ""}`}
          style={{
            left: `${item.positionX * 100}%`,
            top: `${item.positionY * 100}%`,
            transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`,
            zIndex: isDragging && selectedItemId === item.id ? 100 : item.zIndex,
            width: item.type === "TEXT" ? "auto" : "100%",
            height: item.type === "TEXT" ? "auto" : "100%",
          }}
          onMouseDown={(e) => {
            const id = item.id!;
            setSelectedItemId(id);
            setIsDragging(true);
            dragStartPos.current = { x: e.clientX, y: e.clientY };

            let hasDragged = false;
            if (isMobile) {
              clickTimer.current = setTimeout(() => {
                if (!hasDragged) {
                  setShowMobileEditModal(true);
                }
              }, 200);
            }

            const canvas = (e.currentTarget as HTMLElement).closest('.story-canvas');
            const rect = canvas?.getBoundingClientRect();

            const onMouseMove = (moveEvent: MouseEvent) => {
              if (!dragStartPos.current || !rect || rect.height === 0 || rect.width === 0) return;
              hasDragged = true;
              if (clickTimer.current) {
                clearTimeout(clickTimer.current);
                clickTimer.current = null;
              }
              // Calculate movement relative to ACTUAL canvas size
              const dx = (moveEvent.clientX - dragStartPos.current.x) / rect.width;
              const dy = (moveEvent.clientY - dragStartPos.current.y) / rect.height;
              handleItemMove(id, dx, dy);
              dragStartPos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
            };

            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
              dragStartPos.current = null;
              setIsDragging(false);

              if (isMobile && !hasDragged) {
                if (clickTimer.current) {
                  clearTimeout(clickTimer.current);
                  clickTimer.current = null;
                }
                setShowMobileEditModal(true);
              }
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        >
          {item.type === "IMAGE" && item.url && (
            <div className="w-full h-full flex items-center justify-center">
              <img src={item.url} alt="" className="max-w-full max-h-full object-contain pointer-events-none shadow-sm" />
            </div>
          )}
          {item.type === "VIDEO" && item.url && (
            <div className="w-full h-full flex items-center justify-center">
              <video src={item.url} className="max-w-full max-h-full object-contain pointer-events-none shadow-sm" autoPlay muted loop />
            </div>
          )}
          {item.type === "TEXT" && item.textContent && (
            <div
              className="px-4 py-2 rounded-xl shadow-md"
              style={{ backgroundColor: item.textBackgroundColor || "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            >
              <p className="text-white text-lg font-bold leading-tight whitespace-pre-wrap break-words text-center">
                {item.textContent}
              </p>
            </div>
          )}
          {selectedItemId === item.id && (
            <div className="absolute -inset-2 border-2 border-blue-500 rounded-lg pointer-events-none">
              <div className="absolute -top-3 -right-3 size-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg cursor-pointer pointer-events-auto"
                onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id!); }}>
                <X className="size-3" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[70] bg-black md:bg-[radial-gradient(80%_80%_at_50%_0%,_#ffffff_0%,_#eef2ff_50%,_#dbeafe_100%)] text-slate-900 font-['Space_Grotesk'] overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handlePickImage(e.target.files?.[0])}
      />

      {/* MOBILE LAYOUT (Full Screen immersive) */}
      <div className="md:hidden h-full flex flex-col relative overflow-hidden bg-black">
        {/* Centered Preview Canvas */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          {phoneCanvas}
        </div>

        {/* Top Controls Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30 pointer-events-none">
          <button
            onClick={handleClose}
            className="size-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto border border-white/10"
          >
            <X className="size-6" />
          </button>
          <div className="flex gap-2 pointer-events-auto">
            <button className="size-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
              <Settings className="size-6" />
            </button>
          </div>
        </div>

        {/* Bottom Floating Tools & Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 flex flex-col gap-6 z-30 pointer-events-none bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          {/* Tool Icons Row */}
          <div className="flex items-center justify-center gap-5 pointer-events-auto">
            {MOBILE_TOOLS.map(tool => (
              <div key={tool.id} className="flex flex-col items-center gap-1.5 group">
                <button
                  onClick={tool.onClick}
                  className="size-14 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all duration-300 shadow-lg"
                >
                  <tool.icon className="size-6" />
                </button>
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">{tool.label}</span>
              </div>
            ))}
          </div>

          {/* Share Button */}
          <div className="flex items-center justify-between gap-3 pointer-events-auto">
            <button
              onClick={handleShare}
              disabled={!canShare || submitting}
              className="flex-1 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-[0_8px_24px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:grayscale active:scale-95 transition-all"
            >
              {submitting ? "Đang xử lý..." : "CHIA SẺ"}
            </button>
          </div>
        </div>



        {/* Item Edit Bottom Sheet (Mobile) */}
        {selectedItemId && showMobileEditModal && (
          <div className="absolute inset-0 z-40 pointer-events-none md:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
              onClick={() => { setSelectedItemId(null); setShowMobileEditModal(false); }}
            />
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-[3rem] p-8 pb-12 pointer-events-auto shadow-[0_-20px_80px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-full duration-500 ease-out">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Chỉnh sửa đối tượng</h3>
                <button onClick={() => { setSelectedItemId(null); setShowMobileEditModal(false); }} className="size-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                  <X className="size-4" />
                </button>
              </div>

              {items.find(it => it.id === selectedItemId) && (() => {
                const item = items.find(it => it.id === selectedItemId)!;
                return (
                  <div className="space-y-8">
                    {item.type === 'TEXT' && (
                      <textarea
                        value={item.textContent || ""}
                        onChange={(e) => setItems(items.map(it => it.id === selectedItemId ? { ...it, textContent: e.target.value } : it))}
                        className="w-full h-24 rounded-3xl bg-slate-50 border border-slate-100 p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                        placeholder="Nhập nội dung văn bản..."
                      />
                    )}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 tracking-widest">
                          <span>KÍCH THƯỚC</span>
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.scale.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range" min={0.1} max={3} step={0.1} value={item.scale}
                          onChange={(e) => handleItemTransform(selectedItemId!, Number(e.target.value) - item.scale, 0)}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 tracking-widest">
                          <span>XOAY</span>
                          <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{item.rotation}°</span>
                        </div>
                        <input
                          type="range" min={0} max={360} step={5} value={item.rotation}
                          onChange={(e) => handleItemTransform(selectedItemId!, 0, Number(e.target.value) - item.rotation)}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => handleUpdateItemZIndex(selectedItemId!, 1)} className="flex-1 h-14 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-xs hover:bg-white hover:shadow-md transition">LÊN TRÊN</button>
                      <button onClick={() => handleUpdateItemZIndex(selectedItemId!, -1)} className="flex-1 h-14 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-xs hover:bg-white hover:shadow-md transition">XUỐNG DƯỚI</button>
                      <button onClick={() => handleRemoveItem(selectedItemId!)} className="size-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-sm">
                        <Trash2 className="size-6" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP LAYOUT (Studio Side-by-Side) */}
      <div className="hidden md:flex h-full flex-col md:flex-row overflow-hidden bg-[#f8fafc]">
        {/* Preview Section - On top for mobile, right for desktop */}
        <section className="flex-1 h-[50vh] md:h-full p-4 md:p-8 lg:p-12 overflow-auto flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f1f5f9_100%)] order-1 md:order-2 border-b md:border-b-0 border-slate-200">
          {step === "picker" ?
            <div className="h-full flex flex-wrap items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => setStep("image")}
                className="group w-[220px] h-[320px] lg:w-[260px] lg:h-[380px] rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-700 to-sky-400 text-white shadow-xl flex flex-col items-center justify-between p-6 transition hover:-translate-y-1">
                <span className="size-12 rounded-2xl bg-white/90 text-slate-900 inline-flex items-center justify-center">
                  <ImageIcon className="size-6" />
                </span>
                <div className="text-center space-y-2">
                  <div className="text-lg font-['Fraunces'] font-semibold">
                    Story ảnh
                  </div>
                  <div className="text-sm text-white/80">
                    Chọn ảnh, thêm text, xoay và căn chỉnh.
                  </div>
                </div>
                <div className="w-full h-px bg-white/20" />
              </button>

              <button
                type="button"
                onClick={handleChooseText}
                className="group w-[220px] h-[320px] lg:w-[260px] lg:h-[380px] rounded-3xl bg-gradient-to-br from-fuchsia-600 via-pink-500 to-rose-400 text-white shadow-xl flex flex-col items-center justify-between p-6 transition hover:-translate-y-1">
                <span className="size-12 rounded-2xl bg-white/90 text-slate-900 inline-flex items-center justify-center font-bold text-2xl">
                  Aa
                </span>
                <div className="text-center space-y-2">
                  <div className="text-lg font-['Fraunces'] font-semibold">
                    Story chữ
                  </div>
                  <div className="text-sm text-white/80">
                    Chọn nền, gõ nội dung, chia sẻ ngay.
                  </div>
                </div>
                <div className="w-full h-px bg-white/20" />
              </button>
            </div>
            : <div className="h-full flex flex-col items-center justify-center py-4">
              <div className="relative group/canvas scale-[0.8] sm:scale-[0.9] lg:scale-100 transition-transform origin-center">
                {/* Visual anchor for the canvas */}
                <div className="absolute -inset-10 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-1000" />

                <div className="relative z-10 rounded-[3rem] p-3 md:p-4 bg-slate-900 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.6)] border border-slate-800">
                  {phoneCanvas}
                </div>

                <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 hidden md:block">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Xem trước thiết kế</p>
                  <p className="text-[10px] text-slate-300 mt-1">Kéo để di chuyển • Sử dụng bảng điều khiển bên {window.innerWidth < 768 ? 'dưới' : 'trái'}</p>
                </div>
              </div>
            </div>
          }
        </section>

        {/* Sidebar Controls - Below for mobile, left for desktop */}
        <aside className="w-full md:w-[300px] lg:w-[340px] bg-white/90 backdrop-blur-md border-t md:border-t-0 md:border-r border-slate-200 flex flex-col shadow-2xl z-20 order-2 md:order-1 h-[50vh] md:h-full overflow-hidden">
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/70">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="size-10 rounded-full bg-slate-100 hover:bg-slate-200 inline-flex items-center justify-center transition">
                <X className="size-5 text-slate-700" />
              </button>
              <div className="h-10 px-3 rounded-full bg-gradient-to-r from-slate-900 to-slate-700 text-white text-sm font-semibold tracking-wide inline-flex items-center justify-center">
                Story Studio
              </div>
            </div>
          </div>

          <div className="px-5 py-5 border-b border-slate-200/70 overflow-y-auto custom-scrollbar flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl leading-tight font-['Fraunces'] font-semibold text-slate-900">
                {editingStory ? "Cập nhật story" : "Tạo story mới"}
              </h2>
              <button className="size-10 rounded-full bg-slate-100 hover:bg-slate-200 inline-flex items-center justify-center transition">
                <Settings className="size-5 text-slate-600" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-50">
              <img
                src={currentUserAvatar}
                alt={currentUserName}
                className="size-12 rounded-2xl object-cover"
              />
              <div>
                <div className="text-xs text-slate-500 font-medium">Đăng với tư cách</div>
                <div className="text-base font-bold text-slate-900 leading-tight">
                  {currentUserName}
                </div>
                <div className="relative mt-1">
                  <button
                    onClick={() => setShowVisibility(!showVisibility)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md text-xs font-medium text-slate-700 transition"
                  >
                    {visibility === 'PUBLIC' ? <Globe className="size-3" /> : visibility === 'PRIVATE' ? <Lock className="size-3" /> : <Users className="size-3" />}
                    <span>{visibility === 'PUBLIC' ? 'Công khai' : visibility === 'PRIVATE' ? 'Chỉ mình tôi' : visibility === 'CUSTOM' ? 'Tùy chỉnh' : 'Bạn bè'}</span>
                    <ChevronDown className="size-3" />
                  </button>
                  {showVisibility && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-36 overflow-hidden">
                      {[
                        { value: 'PUBLIC', label: 'Công khai', icon: Globe },
                        { value: 'FRIENDS', label: 'Bạn bè', icon: Users },
                        { value: 'PRIVATE', label: 'Chỉ mình tôi', icon: Lock },
                        { value: 'CUSTOM', label: 'Tùy chỉnh', icon: Users }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setVisibility(opt.value);
                            setShowVisibility(false);
                            if (opt.value !== 'CUSTOM') {
                              setSelectedFriendIds([]);
                              setCustomError(null);
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition ${visibility === opt.value ? "text-blue-600 font-semibold" : "text-slate-700"}`}
                        >
                          <opt.icon className="size-4" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {visibility === "CUSTOM" && (
              <div className="mb-6">
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
                      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
                    );
                  }}
                  customError={customError}
                />
              </div>
            )}



            {/* Content Control Section */}
            <div className="space-y-6">
              {step === "text" && items.length === 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nội dung văn bản</label>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      placeholder="Gõ điều gì đó thú vị..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Màu nền</label>
                    <div className="flex flex-wrap gap-2">
                      {TEXT_BACKGROUNDS.map((bg, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedBg(idx)}
                          className={`size-8 rounded-full border-2 transition-transform hover:scale-110 ${bg} ${selectedBg === idx ? "border-slate-900 scale-110 shadow-md" : "border-transparent"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === "image" && (
                <div className="space-y-6">
                  {selectedItemId && items.find(it => it.id === selectedItemId) && (() => {
                    const item = items.find(it => it.id === selectedItemId)!;
                    return (
                      <div className="p-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl space-y-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chỉnh sửa {item.type === 'TEXT' ? 'Văn bản' : 'Phương tiện'}</h3>
                          <button onClick={() => setSelectedItemId(null)} className="size-6 rounded-full bg-slate-200/50 flex items-center justify-center hover:bg-slate-200 transition">
                            <X className="size-3 text-slate-600" />
                          </button>
                        </div>

                        {item.type === 'TEXT' && (
                          <div className="space-y-1.5">
                            <textarea
                              value={item.textContent || ""}
                              onChange={(e) => {
                                setItems(items.map(it => it.id === selectedItemId ? { ...it, textContent: e.target.value } : it));
                              }}
                              className="w-full rounded-2xl border border-slate-200/60 bg-white/60 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder:text-slate-300"
                              placeholder="Nhập nội dung văn bản..."
                              rows={2}
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Scale & Xoay</span>
                            <div className="flex gap-2">
                              <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-mono">{item.scale.toFixed(1)}x</span>
                              <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-mono">{item.rotation}°</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="range"
                              min={0.1}
                              max={3}
                              step={0.1}
                              value={item.scale}
                              onChange={(e) => handleItemTransform(selectedItemId!, Number(e.target.value) - item.scale, 0)}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <input
                              type="range"
                              min={0}
                              max={360}
                              step={5}
                              value={item.rotation}
                              onChange={(e) => handleItemTransform(selectedItemId!, 0, Number(e.target.value) - item.rotation)}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateItemZIndex(selectedItemId!, 1)}
                            className="flex-1 h-9 rounded-xl bg-white/80 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-white transition shadow-sm"
                          >
                            Lên trên
                          </button>
                          <button
                            onClick={() => handleUpdateItemZIndex(selectedItemId!, -1)}
                            className="flex-1 h-9 rounded-xl bg-white/80 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-white transition shadow-sm"
                          >
                            Xuống dưới
                          </button>
                          <button
                            onClick={() => handleRemoveItem(selectedItemId!)}
                            className="size-9 rounded-xl bg-red-50/80 border border-red-100 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-sm"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="rounded-2xl bg-white/60 border border-slate-200/60 p-4 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group"
                      onClick={() => {
                        const text = prompt("Nhập nội dung text:");
                        if (text) handleAddItem("TEXT", text);
                      }}
                    >
                      <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Type className="size-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">Văn bản</span>
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl bg-white/60 border border-slate-200/60 p-4 flex flex-col items-center gap-2 hover:border-emerald-400 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon className="size-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">Phương tiện</span>
                    </button>
                  </div>

                  {items.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danh sách items</p>
                      <div className="max-h-[200px] overflow-auto space-y-1 pr-1 custom-scrollbar">
                        {[...items].reverse().map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id!)}
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${selectedItemId === item.id ? "bg-blue-600 text-white shadow-md" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                          >
                            <div className={`size-8 rounded-lg flex items-center justify-center ${selectedItemId === item.id ? "bg-white/20" : "bg-white border border-slate-200"}`}>
                              {item.type === 'TEXT' ? <Type className="size-4" /> : item.type === 'VIDEO' ? <Film className="size-4" /> : <ImageIcon className="size-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold truncate">
                                {item.type === 'TEXT' ? (item.textContent || "Văn bản") : item.type === 'VIDEO' ? "Video" : "Ảnh"}
                              </p>
                              <p className={`text-[9px] ${selectedItemId === item.id ? "text-white/70" : "text-slate-400"}`}>Lớp {item.zIndex}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id!); }}
                              className={`p-1 rounded-md transition ${selectedItemId === item.id ? "hover:bg-white/20 text-white" : "hover:bg-red-50 text-slate-400 hover:text-red-500"}`}
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>
          </div>

          {(step === "text" || step === "image") && (
            <div className="p-4 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-11 rounded-full bg-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-300 transition">
                Hủy
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={!canShare}
                className="flex-1 h-11 rounded-full bg-slate-900 disabled:bg-slate-300 text-sm font-semibold text-white disabled:text-slate-500 hover:bg-slate-800 transition">
                {submitting ? (editingStory ? "Đang lưu..." : "Đang đăng...") : (editingStory ? "Cập nhật" : "Đăng story")}
              </button>
            </div>
          )}
        </aside>

      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
};

export default CreateStoryModal;
