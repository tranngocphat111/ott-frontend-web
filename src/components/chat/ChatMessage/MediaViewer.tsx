import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Loader2,
} from "lucide-react"; // Thêm Loader2
import type { Message } from "../../../types";
import { getFullUrl } from "../../../utils";

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessageId: string | null;
  messages: Message[];
}

export const MediaViewer = ({
  isOpen,
  onClose,
  initialMessageId,
  messages,
}: MediaViewerProps) => {
  const mediaList = React.useMemo(() => {
    return messages.filter((m) => {
      const type = m.type?.toLowerCase();
      return type === "image" || type === "video";
    });
  }, [messages]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false); // 🔥 State loading tải xuống
  const thumbContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && initialMessageId) {
      const index = mediaList.findIndex((m) => m._id === initialMessageId);
      if (index !== -1) {
        setCurrentIndex(index);
      } else {
        setCurrentIndex(0);
      }
    }
  }, [isOpen, initialMessageId, mediaList]);

  // Auto scroll thumbnail
  useEffect(() => {
    if (thumbContainerRef.current) {
      const activeThumb = thumbContainerRef.current.children[
        currentIndex
      ] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex, isOpen]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : prev));
  }, [mediaList.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

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

  // 🔥 HÀM DOWNLOAD MỚI: Tải Blob về để ép trình duyệt lưu file
  const handleDownload = async () => {
    const currentMedia = mediaList[currentIndex];
    if (!currentMedia || isDownloading) return;

    try {
      setIsDownloading(true);

      const rawContent = Array.isArray(currentMedia.content)
        ? currentMedia.content[0]
        : currentMedia.content;
      const url = getFullUrl(rawContent);

      // 1. Fetch dữ liệu file về dưới dạng Blob
      const response = await fetch(url);
      const blob = await response.blob();

      // 2. Tạo URL ảo cho Blob này
      const blobUrl = window.URL.createObjectURL(blob);

      // 3. Tạo thẻ a ẩn để click tải xuống
      const link = document.createElement("a");
      link.href = blobUrl;

      // Lấy tên file hoặc đặt tên mặc định
      const fileName = rawContent.split("/").pop() || `download-${Date.now()}`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      // 4. Dọn dẹp
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

  const currentMedia = mediaList[currentIndex];
  const rawContent = Array.isArray(currentMedia.content)
    ? currentMedia.content[0]
    : currentMedia.content;
  const mediaUrl = getFullUrl(rawContent);
  const isVideo = currentMedia.type?.toLowerCase() === "video";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white text-sm font-medium ml-2">
          {currentIndex + 1} / {mediaList.length}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tải xuống máy"
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
            key={mediaUrl}
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <img
            src={mediaUrl}
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

      {/* THUMBNAIL STRIP */}
      <div className="w-full h-24 bg-black/40 z-50 backdrop-blur-sm border-t border-white/10 flex items-center justify-center py-2">
        <div
          ref={thumbContainerRef}
          className="flex gap-2 overflow-x-auto px-4 max-w-full h-full items-center custom-scrollbar scroll-smooth"
        >
          {mediaList.map((item, index) => {
            const itemContent = Array.isArray(item.content)
              ? item.content[0]
              : item.content;
            const itemUrl = getFullUrl(itemContent);
            const isItemVideo = item.type?.toLowerCase() === "video";
            const isActive = index === currentIndex;

            return (
              <div
                key={item._id}
                onClick={() => setCurrentIndex(index)}
                className={`
                  relative flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-all duration-200
                  ${isActive ? "w-16 h-16 border-2 border-blue-500 opacity-100 scale-110" : "w-14 h-14 border border-transparent opacity-50 hover:opacity-100 hover:scale-105"}
                `}
              >
                {isItemVideo ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <video
                      src={itemUrl}
                      className="w-full h-full object-cover pointer-events-none"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play size={16} className="text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={itemUrl}
                    alt="thumb"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
