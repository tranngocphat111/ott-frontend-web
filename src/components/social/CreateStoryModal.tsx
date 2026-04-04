import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Image as ImageIcon,
  Music2,
  RotateCw,
  Settings,
  Smile,
  Type,
  X,
} from "lucide-react";
import { createStory, uploadStoryMedia } from "../../services/story.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  onCreated?: () => Promise<void> | void;
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canShare = useMemo(() => {
    if (submitting || !currentUserId) return false;
    if (step === "text") return textContent.trim().length > 0;
    if (step === "image") return Boolean(uploadedImageKey) && !uploadingImage;
    return false;
  }, [
    submitting,
    currentUserId,
    step,
    textContent,
    uploadedImageKey,
    uploadingImage,
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
  };

  const handleChooseImage = () => {
    setStep("image");
    setError(null);
  };

  const handlePickImage = async (file?: File) => {
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    const nextType: MediaType = file.type.startsWith("video/")
      ? "video"
      : "image";
    setMediaType(nextType);
    setImagePreviewUrl(localUrl);
    setUploadingImage(true);
    setUploadedImageKey("");

    if (nextType === "image") {
      const img = new Image();
      img.onload = () => {
        setImageWidth(img.naturalWidth || 1080);
        setImageHeight(img.naturalHeight || 1920);
      };
      img.src = localUrl;
    } else {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        setImageWidth(video.videoWidth || 720);
        setImageHeight(video.videoHeight || 1280);
        setVideoDuration(
          Number.isFinite(video.duration)
            ? Math.round(video.duration * 1000)
            : 15000,
        );
      };
      video.src = localUrl;
    }

    const uploaded = await uploadStoryMedia(file);
    if (!uploaded) {
      setError("Tải ảnh lên thất bại. Vui lòng thử lại.");
      setUploadingImage(false);
      return;
    }

    setUploadedImageKey(uploaded.fileKey);
    setUploadingImage(false);
  };

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
      const storyItems =
        step === "text" ?
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
              }
            : {
                type: "IMAGE_ITEM",
                imageItem: {
                  ...BASE_STORY_ITEM,
                  url: uploadedImageKey,
                  width: imageWidth,
                  height: imageHeight,
                },
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
                },
              ]
            : []),
          ];

      const saved = await createStory({
        userId: currentUserId,
        visibility,
        isHighlight: false,
        highlightName: null,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        storyItems,
        musics: [],
        hashTags: alternativeText.trim() ? [alternativeText.trim()] : [],
      });

      if (!saved) {
        setError("Không thể chia sẻ story. Vui lòng thử lại.");
        setSubmitting(false);
        return;
      }

      if (onCreated) await onCreated();
      handleClose();
    } catch {
      setError("Có lỗi xảy ra khi chia sẻ story.");
      setSubmitting(false);
    }
  };

  const phoneCanvas =
    step === "text" ?
      <div className="w-[310px] h-[550px] rounded-lg relative overflow-hidden shadow-lg border border-white/20">
        <div className={`absolute inset-0 ${TEXT_BACKGROUNDS[selectedBg]}`} />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <p className="text-white text-2xl font-semibold text-center break-words whitespace-pre-wrap">
            {textContent || "Nhập nội dung story"}
          </p>
        </div>
        <Smile className="absolute bottom-3 right-3 size-6 text-white/70" />
      </div>
      : <div
        className={`w-[310px] h-[550px] rounded-2xl relative overflow-hidden shadow-lg border border-white/30 bg-emerald-100 flex items-center justify-center transition ${
          isDragActive ? "ring-4 ring-white/70" : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);
          handlePickImage(event.dataTransfer.files?.[0]);
        }}>
        {imagePreviewUrl ?
          mediaType === "video" ?
            <video
              src={imagePreviewUrl}
              className="w-full h-full object-contain"
              controls
            />
          : <img
              src={imagePreviewUrl}
              alt="story preview"
              style={{
                transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
        : <div className="text-center space-y-3">
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
        }
      </div>;

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
                Tạo story mới
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
                <div className="text-sm text-slate-500">Đăng với</div>
                <div className="text-lg font-semibold text-slate-900">
                  {currentUserName}
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
              <div className="space-y-4">
                <button
                  type="button"
                  className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition"
                  onClick={() => {
                    const next = overlayText ? "" : "Nhập text lên ảnh";
                    setOverlayText(next);
                  }}>
                  <Type className="size-5" />
                  Thêm text
                </button>

                {overlayText.length > 0 && (
                  <input
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="Nội dung text"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                )}

                <button
                  type="button"
                  className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition">
                  <Music2 className="size-5" />
                  Thêm nhạc
                </button>

                <div className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <ImageIcon className="size-5" />
                  Alternative text
                </div>

                <input
                  value={alternativeText}
                  onChange={(e) => setAlternativeText(e.target.value)}
                  placeholder="Mô tả ảnh..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-slate-300 transition">
                  {uploadingImage ? "Đang tải file..." : "Chọn file khác"}
                </button>
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
                {submitting ? "Đang đăng..." : "Đăng story"}
              </button>
            </div>
          )}
        </aside>

        <section className="flex-1 p-6 md:p-12 overflow-auto">
          {step === "picker" ?
            <div className="h-full flex flex-wrap items-center justify-center gap-6">
              <button
                type="button"
                onClick={handleChooseImage}
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

                {step === "image" && (
                  <div className="w-full max-w-[760px] mt-4 flex items-center gap-4">
                    <button
                      type="button"
                      className="text-white text-3xl"
                      onClick={() =>
                        setImageScale((v) => Math.max(0.6, v - 0.1))
                      }>
                      -
                    </button>
                    <input
                      type="range"
                      min={0.6}
                      max={2}
                      step={0.1}
                      value={imageScale}
                      onChange={(e) => setImageScale(Number(e.target.value))}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      className="text-white text-3xl"
                      onClick={() =>
                        setImageScale((v) => Math.min(2, v + 0.1))
                      }>
                      +
                    </button>
                    <button
                      type="button"
                      className="h-10 px-3 rounded-lg bg-gray-200 inline-flex items-center gap-2 text-gray-900 text-sm"
                      onClick={() => setImageRotation((r) => (r + 90) % 360)}>
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
