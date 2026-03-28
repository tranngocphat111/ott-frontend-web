import React, { useMemo, useRef, useState } from "react";
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
import { createStory } from "../../services/story.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  onCreated?: () => Promise<void> | void;
}

type Step = "picker" | "text" | "image";

const TEXT_BACKGROUNDS = [
  "bg-linear-to-br from-blue-500 to-indigo-600",
  "bg-linear-to-br from-pink-500 to-rose-500",
  "bg-linear-to-br from-cyan-400 to-blue-500",
  "bg-linear-to-br from-red-400 to-pink-500",
  "bg-linear-to-br from-indigo-600 to-violet-700",
  "bg-black",
  "bg-linear-to-br from-fuchsia-500 to-blue-500",
  "bg-linear-to-br from-orange-500 to-red-500",
  "bg-linear-to-br from-yellow-500 to-orange-400",
  "bg-linear-to-br from-pink-300 to-cyan-300",
  "bg-linear-to-br from-lime-300 to-yellow-300",
  "bg-linear-to-br from-gray-500 to-slate-700",
  "bg-linear-to-br from-violet-700 to-indigo-900",
  "bg-linear-to-br from-teal-300 to-pink-300",
  "bg-linear-to-br from-rose-300 to-yellow-300",
  "bg-linear-to-br from-indigo-500 to-orange-500",
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

  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [imageWidth, setImageWidth] = useState(1080);
  const [imageHeight, setImageHeight] = useState(1920);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [overlayText, setOverlayText] = useState("");
  const [alternativeText, setAlternativeText] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canShare = useMemo(() => {
    if (submitting || !currentUserId) return false;
    if (step === "text") return textContent.trim().length > 0;
    if (step === "image") return Boolean(imageDataUrl);
    return false;
  }, [submitting, currentUserId, step, textContent, imageDataUrl]);

  if (!isOpen) return null;

  const resetState = () => {
    setStep("picker");
    setSubmitting(false);
    setError(null);
    setTextContent("");
    setTextStyle("Clean");
    setSelectedBg(0);
    setVisibility("FRIENDS");
    setImageDataUrl("");
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
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handlePickImage = async (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImageDataUrl(result);
    };
    reader.readAsDataURL(file);

    const img = new Image();
    img.onload = () => {
      setImageWidth(img.naturalWidth || 1080);
      setImageHeight(img.naturalHeight || 1920);
    };
    img.src = URL.createObjectURL(file);
  };

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
            {
              type: "IMAGE_ITEM",
              imageItem: {
                ...BASE_STORY_ITEM,
                url: imageDataUrl,
                width: imageWidth,
                height: imageHeight,
              },
            },
            ...(overlayText.trim() ?
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
    : <div className="w-[310px] h-[550px] rounded-lg relative overflow-hidden shadow-lg border border-white/20 bg-emerald-100 flex items-center justify-center">
        {imageDataUrl ?
          <img
            src={imageDataUrl}
            alt="story preview"
            style={{
              transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        : <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white text-sm text-gray-800"
            onClick={() => fileInputRef.current?.click()}>
            Chọn ảnh
          </button>
        }
      </div>;

  return (
    <div className="fixed inset-0 z-[70] bg-[#e5e7eb]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePickImage(e.target.files?.[0])}
      />

      <div className="h-full flex">
        <aside className="w-[360px] bg-[#f0f2f5] border-r border-gray-300 flex flex-col">
          <div className="h-16 px-4 flex items-center justify-between border-b border-gray-300">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="size-10 rounded-full bg-gray-300/80 inline-flex items-center justify-center">
                <X className="size-5 text-gray-700" />
              </button>
              <div className="size-10 rounded-full bg-blue-600 text-white font-bold text-2xl leading-none inline-flex items-center justify-center">
                f
              </div>
            </div>
          </div>

          <div className="px-4 py-5 border-b border-gray-300">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-4xl leading-none font-bold text-gray-900">
                Your story
              </h2>
              <button className="size-10 rounded-full bg-gray-300/80 inline-flex items-center justify-center">
                <Settings className="size-5 text-gray-700" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={currentUserAvatar}
                alt={currentUserName}
                className="size-14 rounded-full object-cover"
              />
              <span className="text-3xl font-semibold text-gray-900">
                {currentUserName}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {step === "picker" && (
              <div className="text-sm text-gray-600">
                Chọn loại story để bắt đầu.
              </div>
            )}

            {step === "text" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-300 bg-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Type className="size-5 text-gray-600" />
                    <span className="text-2xl font-semibold">{textStyle}</span>
                  </div>
                  <ChevronDown className="size-5 text-gray-700" />
                </div>

                <div className="rounded-xl border border-gray-300 bg-white px-4 py-3">
                  <p className="text-xl text-gray-500 mb-1">Backgrounds</p>
                  <p className="text-2xl text-gray-700 mb-3">Gradient</p>
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
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Nhập nội dung text story..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm resize-none"
                />

                <button
                  type="button"
                  className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 flex items-center gap-3 text-3xl font-semibold">
                  <Music2 className="size-6" />
                  Add music
                </button>
              </div>
            )}

            {step === "image" && (
              <div className="space-y-4">
                <button
                  type="button"
                  className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 flex items-center gap-3 text-3xl font-semibold"
                  onClick={() => {
                    const next = overlayText ? "" : "Nhập text lên ảnh";
                    setOverlayText(next);
                  }}>
                  <Type className="size-6" />
                  Add text
                </button>

                {overlayText.length > 0 && (
                  <input
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="Nội dung text"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                )}

                <button
                  type="button"
                  className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 flex items-center gap-3 text-3xl font-semibold">
                  <Music2 className="size-6" />
                  Add music
                </button>

                <div className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 flex items-center gap-3 text-3xl font-semibold">
                  <ImageIcon className="size-6" />
                  Alternative text
                </div>

                <input
                  value={alternativeText}
                  onChange={(e) => setAlternativeText(e.target.value)}
                  placeholder="Mô tả ảnh..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 text-sm font-medium">
                  Chọn ảnh khác
                </button>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>

          {(step === "text" || step === "image") && (
            <div className="p-4 border-t border-gray-300 flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-12 rounded-xl bg-gray-300 text-2xl font-semibold text-gray-800">
                Discard
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={!canShare}
                className="flex-1 h-12 rounded-xl bg-blue-600 disabled:bg-gray-300 text-2xl font-semibold text-white disabled:text-gray-500">
                {submitting ? "Đang share..." : "Share to story"}
              </button>
            </div>
          )}
        </aside>

        <section className="flex-1 p-16 overflow-auto">
          {step === "picker" ?
            <div className="h-full flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={handleChooseImage}
                className="w-[250px] h-[420px] rounded-xl bg-linear-to-br from-indigo-600 to-sky-300 text-white shadow-lg flex flex-col items-center justify-center gap-4">
                <span className="size-14 rounded-full bg-white text-black inline-flex items-center justify-center">
                  <ImageIcon className="size-7" />
                </span>
                <span className="text-3xl font-semibold">
                  Create a photo story
                </span>
              </button>

              <button
                type="button"
                onClick={handleChooseText}
                className="w-[250px] h-[420px] rounded-xl bg-linear-to-br from-fuchsia-500 to-pink-500 text-white shadow-lg flex flex-col items-center justify-center gap-4">
                <span className="size-14 rounded-full bg-white text-black inline-flex items-center justify-center font-bold text-3xl">
                  Aa
                </span>
                <span className="text-3xl font-semibold">
                  Create a text story
                </span>
              </button>
            </div>
          : <div className="max-w-[980px] mx-auto rounded-xl bg-white p-4 shadow">
              <p className="text-2xl font-semibold text-gray-900 mb-4">
                Preview
              </p>

              <div className="rounded-2xl bg-[#111418] min-h-[610px] flex flex-col items-center justify-center relative px-4 py-8">
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
};

export default CreateStoryModal;
