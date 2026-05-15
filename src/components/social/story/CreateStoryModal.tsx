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
} from "lucide-react";
import { createStory, updateStory, uploadStoryMedia } from "../../../services/story.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  onCreated?: () => Promise<void> | void;
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

  const [textContent, setTextContent] = useState("");
  const [textStyle, setTextStyle] = useState("Clean");
  const [selectedBg, setSelectedBg] = useState(0);
  const [visibility, setVisibility] = useState("FRIENDS");

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        positionX: Math.max(0, Math.min(1, item.positionX + deltaX)),
        positionY: Math.max(0, Math.min(1, item.positionY + deltaY))
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
        url: blobUrl,
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
      if (editingStory.visibility) setVisibility(editingStory.visibility);
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
      // 1. Upload all new media first
      const processedItems = await Promise.all(items.map(async (item) => {
        if (item.file && (item.type === "IMAGE" || item.type === "VIDEO")) {
          // If it's a local blob URL, it needs to be uploaded
          if (item.url?.startsWith("blob:")) {
            const uploadRes = await uploadStoryMedia(item.file);
            if (uploadRes) {
              return { ...item, url: uploadRes.fileKey };
            }
          }
        }
        return item;
      }));

      const finalStoryItems = processedItems.length > 0 ? 
        processedItems.map(item => ({
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
          id: item.id,
        }))
        : (step === "text" ?
          [
            {
              type: "TEXT_ITEM",
              textItem: {
                ...BASE_STORY_ITEM,
                content: textContent.trim(),
                font: textStyle,
                color: "#FFFFFF",
                backgroundColor: "#111827",
                alignment: "CENTER",
              },
              isPrimary: true,
              zIndex: 1,
              positionX: 0.5,
              positionY: 0.5,
              scale: 1,
              rotation: 0,
            },
          ]
        : [
            mediaType === "video" ?
              {
                type: "VIDEO_ITEM",
                videoItem: {
                  ...BASE_STORY_ITEM,
                  url: uploadedImageKey,
                  thumbnailUrl: uploadedImageKey,
                  duration: videoDuration,
                  width: imageWidth,
                  height: imageHeight,
                },
                isPrimary: true,
                zIndex: 1,
                positionX: 0.5,
                positionY: 0.5,
                scale: 1,
                rotation: 0,
              }
            : {
                type: "IMAGE_ITEM",
                imageItem: {
                  ...BASE_STORY_ITEM,
                  url: uploadedImageKey,
                  width: imageWidth,
                  height: imageHeight,
                },
                isPrimary: true,
                zIndex: 1,
                positionX: 0.5,
                positionY: 0.5,
                scale: 1,
                rotation: 0,
              },
            ...(overlayText.trim() && mediaType !== "video" ?
              [
                {
                  type: "TEXT_ITEM",
                  textItem: {
                    ...BASE_STORY_ITEM,
                    isPrimary: false,
                    zIndex: 2,
                    content: overlayText.trim(),
                    font: "Clean",
                    color: "#FFFFFF",
                    backgroundColor: "transparent",
                    alignment: "CENTER",
                  },
                  isPrimary: false,
                  zIndex: 2,
                  positionX: 0.5,
                  positionY: 0.8,
                  scale: 1,
                  rotation: 0,
                },
              ]
            : []),
          ]);

      if (editingStory) {
        const saved = await updateStory(
          editingStory.id,
          {
            userId: currentUserId,
            visibility,
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
        const saved = await createStory({
          userId: currentUserId,
          visibility,
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

      if (onCreated) await onCreated();
      handleClose();
    } catch {
      setError("Có lỗi xảy ra khi chia sẻ story.");
      setSubmitting(false);
    }
  };

  const dragStartPos = useRef<{ x: number, y: number } | null>(null);

  const phoneCanvas = (
    <div 
      className="w-[310px] h-[550px] rounded-2xl relative overflow-hidden shadow-lg border border-white/30 bg-[#111418] flex items-center justify-center transition"
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
        <>
          <div className={`absolute inset-0 ${TEXT_BACKGROUNDS[selectedBg]}`} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <p className="text-white text-2xl font-semibold text-center break-words whitespace-pre-wrap">
              {textContent || "Nhập nội dung story"}
            </p>
          </div>
          <Smile className="absolute bottom-3 right-3 size-6 text-white/70" />
        </>
      )}

      {items.length === 0 && step === "image" && !imagePreviewUrl && (
        <div className="text-center space-y-3">
          <div className="text-sm text-emerald-900/80 font-medium">
            Kéo ảnh hoặc video vào đây
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-full bg-white text-sm text-gray-800 shadow"
            onClick={() => fileInputRef.current?.click()}>
            Chọn file
          </button>
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className={`absolute cursor-move select-none ${selectedItemId === item.id ? "ring-2 ring-blue-500 rounded-lg p-1" : ""}`}
          style={{
            left: `${item.positionX * 100}%`,
            top: `${item.positionY * 100}%`,
            transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`,
            zIndex: item.zIndex,
            width: item.type === "TEXT" ? "auto" : "100%",
            height: item.type === "TEXT" ? "auto" : "100%",
          }}
          onMouseDown={(e) => {
            const id = item.id!;
            setSelectedItemId(id);
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            const onMouseMove = (moveEvent: MouseEvent) => {
               if (!dragStartPos.current) return;
               const dx = (moveEvent.clientX - dragStartPos.current.x) / 310;
               const dy = (moveEvent.clientY - dragStartPos.current.y) / 550;
               handleItemMove(id, dx, dy);
               dragStartPos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
            };
            const onMouseUp = () => {
               window.removeEventListener('mousemove', onMouseMove);
               window.removeEventListener('mouseup', onMouseUp);
               dragStartPos.current = null;
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
    <div className="fixed inset-0 z-[70] bg-[radial-gradient(80%_80%_at_50%_0%,_#ffffff_0%,_#eef2ff_50%,_#dbeafe_100%)] text-slate-900 font-['Space_Grotesk']">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handlePickImage(e.target.files?.[0])}
      />

      <div className="h-full flex flex-col md:flex-row">
        <aside className="w-full md:w-[360px] bg-white/80 backdrop-blur border-b md:border-b-0 md:border-r border-white/60 flex flex-col shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
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

          <div className="px-5 py-5 border-b border-slate-200/70">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl leading-tight font-['Fraunces'] font-semibold text-slate-900">
                {editingStory ? "Cập nhật story" : "Tạo story mới"}
              </h2>
              <button className="size-10 rounded-full bg-slate-100 hover:bg-slate-200 inline-flex items-center justify-center transition">
                <Settings className="size-5 text-slate-600" />
              </button>
            </div>

            <div className="flex items-center gap-3">
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
                <div className="flex gap-1.5 mt-2">
                  {[
                    { val: "PUBLIC", label: "Công khai", icon: RotateCw }, // Using RotateCw as a globe placeholder if Globe isn't imported, but let's check imports
                    { val: "FRIENDS", label: "Bạn bè", icon: Smile },
                    { val: "PRIVATE", label: "Riêng tư", icon: X },
                  ].map((v) => (
                    <button
                      key={v.val}
                      onClick={() => setVisibility(v.val)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                        visibility === v.val 
                          ? "bg-slate-900 text-white shadow-sm scale-105" 
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {v.val === "PUBLIC" ? "🌍" : v.val === "FRIENDS" ? "👥" : "🔒"}
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-auto">
            {step === "picker" && (
              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-medium text-slate-700">
                  Chọn kiểu story bạn muốn tạo.
                </p>
                <p className="text-slate-500">
                  Bạn có thể thêm text hoặc ảnh, chỉnh nền và chia sẻ nhanh.
                </p>
              </div>
            )}

            {step === "text" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <Type className="size-5 text-slate-600" />
                    <span className="text-base font-semibold">{textStyle}</span>
                  </div>
                  <ChevronDown className="size-5 text-slate-600" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
                    Backgrounds
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Gradient
                  </p>
                  <div className="grid grid-cols-8 gap-2">
                    {TEXT_BACKGROUNDS.map((bg, idx) => (
                      <button
                        type="button"
                        key={bg}
                        onClick={() => setSelectedBg(idx)}
                        className={`size-8 rounded-full ${bg} border-2 ${
                          selectedBg === idx ? "border-blue-500" : (
                            "border-transparent"
                          )
                        } shadow-sm`}
                      />
                    ))}
                  </div>
                </div>

                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Nhập nội dung text story..."
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                />

                <button
                  type="button"
                  className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition">
                  <Music2 className="size-5" />
                  Thêm nhạc
                </button>
              </div>
            )}

            {step === "image" && (
              <div className="space-y-6">
                {selectedItemId && items.find(it => it.id === selectedItemId) && (() => {
                  const item = items.find(it => it.id === selectedItemId)!;
                  return (
                    <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-2xl space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Chỉnh sửa {item.type === 'TEXT' ? 'Văn bản' : 'Phương tiện'}</h3>
                        <button onClick={() => setSelectedItemId(null)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline decoration-blue-200">Bỏ chọn</button>
                      </div>

                      {item.type === 'TEXT' && (
                        <div className="space-y-2">
                          <label className="text-xs text-slate-500 font-bold uppercase">Nội dung</label>
                          <textarea
                            value={item.textContent || ""}
                            onChange={(e) => {
                              setItems(items.map(it => it.id === selectedItemId ? { ...it, textContent: e.target.value } : it));
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-shadow"
                            placeholder="Nhập nội dung văn bản..."
                            rows={3}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-slate-500 font-bold uppercase">Kích thước</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0.1}
                              max={3}
                              step={0.1}
                              value={item.scale}
                              onChange={(e) => handleItemTransform(selectedItemId!, Number(e.target.value) - item.scale, 0)}
                              className="flex-1 accent-blue-600"
                            />
                            <span className="text-[10px] font-mono font-bold w-6 text-slate-600">{item.scale.toFixed(1)}x</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-slate-500 font-bold uppercase">Xoay</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={360}
                              step={5}
                              value={item.rotation}
                              onChange={(e) => handleItemTransform(selectedItemId!, 0, Number(e.target.value) - item.rotation)}
                              className="flex-1 accent-blue-600"
                            />
                            <span className="text-[10px] font-mono font-bold w-8 text-slate-600">{item.rotation}°</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateItemZIndex(selectedItemId!, 1)}
                          className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Lên trên
                        </button>
                        <button
                          onClick={() => handleUpdateItemZIndex(selectedItemId!, -1)}
                          className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Xuống dưới
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(selectedItemId!)}
                        className="w-full py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition border border-red-100"
                      >
                        Xóa item này
                      </button>
                    </div>
                  );
                })()}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thêm mới</p>
                    {items.length > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{items.length} items</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="rounded-2xl bg-white border border-slate-200 p-3 flex flex-col items-center gap-1 hover:border-blue-300 hover:shadow-md transition group"
                      onClick={() => {
                        const text = prompt("Nhập nội dung text:");
                        if (text) handleAddItem("TEXT", text);
                      }}>
                      <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                        <Type className="size-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">Thêm chữ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-2xl bg-white border border-slate-200 p-3 flex flex-col items-center gap-1 hover:border-emerald-300 hover:shadow-md transition group">
                      <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                        <ImageIcon className="size-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">{uploadingImage ? "Đang tải..." : "Thêm ảnh/video"}</span>
                    </button>
                  </div>
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

        <section className="flex-1 p-6 md:p-12 overflow-auto">
          {step === "picker" ?
            <div className="h-full flex flex-wrap items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => setStep("image")}
                className="group w-[260px] h-[380px] rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-700 to-sky-400 text-white shadow-xl flex flex-col items-center justify-between p-6 transition hover:-translate-y-1">
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
                className="group w-[260px] h-[380px] rounded-3xl bg-gradient-to-br from-fuchsia-600 via-pink-500 to-rose-400 text-white shadow-xl flex flex-col items-center justify-between p-6 transition hover:-translate-y-1">
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
          : <div className="max-w-[980px] mx-auto rounded-xl bg-white p-4 shadow">
              <p className="text-lg font-semibold text-slate-900 mb-4">
                Xem trước
              </p>

              <div className="rounded-3xl bg-[#111418] min-h-[610px] flex flex-col items-center justify-center relative px-4 py-8 shadow-inner">
                {phoneCanvas}

                {selectedItemId && (
                  <div className="w-full max-w-[760px] mt-4 flex items-center gap-4">
                    <button
                      type="button"
                      className="text-white text-3xl"
                      onClick={() =>
                        handleItemTransform(selectedItemId, -0.1, 0)
                      }>
                      -
                    </button>
                    <input
                      type="range"
                      min={0.2}
                      max={5}
                      step={0.1}
                      value={items.find(it => it.id === selectedItemId)?.scale || 1}
                      onChange={(e) => handleItemTransform(selectedItemId, Number(e.target.value) - (items.find(it => it.id === selectedItemId)?.scale || 1), 0)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      className="text-white text-3xl"
                      onClick={() =>
                        handleItemTransform(selectedItemId, 0.1, 0)
                      }>
                      +
                    </button>
                    <button
                      type="button"
                      className="h-10 px-3 rounded-lg bg-gray-200 inline-flex items-center gap-2 text-gray-900 text-sm"
                      onClick={() => handleItemTransform(selectedItemId, 0, 90)}>
                      <RotateCw className="size-4" />
                      Rotate
                    </button>
                  </div>
                )}
              </div>
            </div>
          }
        </section>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
};

export default CreateStoryModal;
