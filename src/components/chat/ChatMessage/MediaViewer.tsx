import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Loader2,
} from "lucide-react";
import type { Message } from "../../../types";
import { getFullUrl } from "../../../utils";

interface MediaItem {
  messageId: string;
  url: string;
  type: string;
  imageIndex: number;
}

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessageId: string | null;
  initialImageIndex?: number;
  messages: Message[];
}

const resolveContentKey = (item: unknown): string => {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "url" in item) {
    return String((item as { url?: string }).url || "");
  }
  return "";
};

export const MediaViewer = ({
  isOpen,
  onClose,
  initialMessageId,
  initialImageIndex = 0,
  messages,
}: MediaViewerProps) => {
  // Flatten tất cả ảnh/video thành danh sách phẳng
  const mediaList = React.useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = [];
    for (const m of messages) {
      const type = m.type?.toLowerCase();
      if (type === "image") {
        const content = Array.isArray(m.content) ? m.content : [m.content];
        content.forEach((c, idx) => {
          const key = resolveContentKey(c);
          if (!key) return;

          items.push({
            messageId: m._id,
            url: getFullUrl(key),
            type: "image",
            imageIndex: idx,
          });
        });
      } else if (type === "video") {
        const content = Array.isArray(m.content) ? m.content : [m.content];
        const key = resolveContentKey(content[0]);
        if (!key) continue;

        items.push({
          messageId: m._id,
          url: getFullUrl(key),
          type: "video",
          imageIndex: 0,
        });
      }
    }
    return items;
  }, [messages]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && initialMessageId) {
      const idx = mediaList.findIndex(
        (item) =>
          item.messageId === initialMessageId &&
          item.imageIndex === initialImageIndex,
      );
      setCurrentIndex(idx !== -1 ? idx : 0);
    }
  }, [isOpen, initialMessageId, initialImageIndex, mediaList]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : prev));
  }, [mediaList.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Thumbnail window: hiển thị tối đa 10 item, tự dịch chuyển theo currentIndex
  const THUMB_WINDOW = 10;
  const windowStart = Math.floor(currentIndex / THUMB_WINDOW) * THUMB_WINDOW;
  const visibleThumbs = mediaList.slice(windowStart, windowStart + THUMB_WINDOW);
  const hasPrevWindow = windowStart > 0;
  const hasNextWindow = windowStart + THUMB_WINDOW < mediaList.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  const handleDownload = async () => {
    const current = mediaList[currentIndex];
    if (!current || isDownloading) return;

    try {
      setIsDownloading(true);
      const response = await fetch(current.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const fileName = current.url.split("/").pop() || `download-${Date.now()}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Lỗi tải file:", error);
      alert("Không thể tải file này. Vui lòng thử lại.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || mediaList.length === 0) return null;

  const current = mediaList[currentIndex];
  const isVideo = current.type === "video";

  return (
    <div className="fixed inset-0 z-9999 bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-linear-to-b from-black/80 to-transparent">
        <div className="text-white text-sm font-medium ml-2">
          {currentIndex + 1} / {mediaList.length}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tải xuống"
          >
            {isDownloading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Download size={20} />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 w-full flex items-center justify-center p-4 relative overflow-hidden">
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all z-40 group"
          >
            <ChevronLeft
              size={32}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>
        )}

        {isVideo ? (
          <video
            key={current.url}
            src={current.url}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <img
            src={current.url}
            alt="Full view"
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/400x300?text=Error";
            }}
          />
        )}

        {currentIndex < mediaList.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all z-40 group"
          >
            <ChevronRight
              size={32}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        )}
      </div>

      {/* THUMBNAIL STRIP — hiển thị tối đa 10, điều hướng bằng mũi tên */}
      <div className="w-full h-24 bg-black/40 z-50 backdrop-blur-sm border-t border-white/10 flex items-center justify-center gap-2 py-2 px-3">
        {/* Mũi tên sang trang trước */}
        <button
          onClick={() => setCurrentIndex(windowStart - 1)}
          disabled={!hasPrevWindow}
          className="shrink-0 p-1.5 rounded-full text-white transition-all disabled:opacity-0 disabled:pointer-events-none bg-white/10 hover:bg-white/20"
        >
          <ChevronLeft size={18} />
        </button>

        {/* 10 thumbnail */}
        <div className="flex gap-2 items-center h-full">
          {visibleThumbs.map((item, i) => {
            const actualIndex = windowStart + i;
            const isItemVideo = item.type === "video";
            const isActive = actualIndex === currentIndex;

            return (
              <div
                key={`${item.messageId}-${item.imageIndex}`}
                onClick={() => setCurrentIndex(actualIndex)}
                className={`
                  relative shrink-0 cursor-pointer rounded-md overflow-hidden transition-all duration-200
                  ${isActive
                    ? "w-16 h-16 border-2 border-blue-500 opacity-100 scale-110"
                    : "w-14 h-14 border border-transparent opacity-50 hover:opacity-100 hover:scale-105"}
                `}
              >
                {isItemVideo ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover pointer-events-none"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play size={16} className="text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt="thumb"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mũi tên sang trang sau */}
        <button
          onClick={() => setCurrentIndex(windowStart + THUMB_WINDOW)}
          disabled={!hasNextWindow}
          className="shrink-0 p-1.5 rounded-full text-white transition-all disabled:opacity-0 disabled:pointer-events-none bg-white/10 hover:bg-white/20"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
