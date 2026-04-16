import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { API_CHAT_SERVER_URL } from "../../../config/api.config";
import { MessageService } from "../../../services";

interface MediaItem {
  messageId: string;
  url: string;
  type: string;
  imageIndex: number;
  createdAtMs: number;
}

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  initialMessageId: string | null;
  initialImageIndex?: number;
  seedMessages: Message[];
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
  conversationId,
  initialMessageId,
  initialImageIndex = 0,
  seedMessages,
}: MediaViewerProps) => {
  const buildMediaItemsFromMessages = useCallback((messages: Message[]) => {
    const items: MediaItem[] = [];

    for (const m of messages || []) {
      if (m.is_deleted || m.is_revoked) continue;

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
            createdAtMs: new Date(m.createdAt || m.created_at || 0).getTime(),
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
          createdAtMs: new Date(m.createdAt || m.created_at || 0).getTime(),
        });
      }
    }

    return items;
  }, []);

  const [remoteMediaMessages, setRemoteMediaMessages] = useState<Message[]>([]);
  const [remoteSkip, setRemoteSkip] = useState(0);
  const [hasMoreRemoteMedia, setHasMoreRemoteMedia] = useState(true);
  const [isFetchingRemoteMedia, setIsFetchingRemoteMedia] = useState(false);
  const isFetchingRemoteMediaRef = useRef(false);
  const initializedConversationRef = useRef<string | null>(null);
  const aroundTargetLoadedRef = useRef(false);

  const mediaList = React.useMemo<MediaItem[]>(() => {
    const merged = [
      ...buildMediaItemsFromMessages(remoteMediaMessages),
      ...buildMediaItemsFromMessages(seedMessages),
    ];

    const dedup = new Map<string, MediaItem>();
    merged.forEach((item) => {
      const key = `${item.messageId}-${item.imageIndex}-${item.type}`;
      if (!dedup.has(key)) {
        dedup.set(key, item);
      }
    });

    return Array.from(dedup.values()).sort(
      (a, b) => b.createdAtMs - a.createdAtMs,
    );
  }, [buildMediaItemsFromMessages, remoteMediaMessages, seedMessages]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingMoreMedia, setIsLoadingMoreMedia] = useState(false);
  const hasInitializedRef = useRef(false);
  const pendingAnchorRef = useRef<string | null>(null);
  const loadedAtMediaLengthRef = useRef<number>(-1);
  const lastLoadedAnchorKeyRef = useRef<string | null>(null);
  const waitForUserMoveAfterLoadRef = useRef(false);

  const fetchRemoteMediaPage = useCallback(
    async (skip: number) => {
      if (!conversationId || isFetchingRemoteMediaRef.current) return;

      isFetchingRemoteMediaRef.current = true;
      setIsFetchingRemoteMedia(true);
      try {
        const page = await MessageService.getMediaMessages(
          conversationId,
          20,
          skip,
        );
        const normalized = Array.isArray(page) ? page : [];

        setRemoteMediaMessages((prev) => {
          const map = new Map<string, Message>();
          [...prev, ...normalized].forEach((msg) => {
            const key = String(msg.msg_id || msg._id || "");
            if (key) {
              map.set(key, msg);
            }
          });
          return Array.from(map.values());
        });

        setRemoteSkip(skip + normalized.length);
        setHasMoreRemoteMedia(normalized.length === 20);
      } catch (error) {
        console.error("Failed to fetch media page:", error);
      } finally {
        isFetchingRemoteMediaRef.current = false;
        setIsFetchingRemoteMedia(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    if (initializedConversationRef.current === conversationId) {
      return;
    }
    initializedConversationRef.current = conversationId;

    setRemoteMediaMessages([]);
    setRemoteSkip(0);
    setHasMoreRemoteMedia(true);
    setIsLoadingMoreMedia(false);
    loadedAtMediaLengthRef.current = -1;
    lastLoadedAnchorKeyRef.current = null;
    waitForUserMoveAfterLoadRef.current = false;
    aroundTargetLoadedRef.current = false;

    void fetchRemoteMediaPage(0);
  }, [isOpen, conversationId, fetchRemoteMediaPage]);

  useEffect(() => {
    if (!isOpen) {
      initializedConversationRef.current = null;
      aroundTargetLoadedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !conversationId || !initialMessageId) return;
    if (aroundTargetLoadedRef.current) return;
    if (!mediaList.length) return;

    const existsInList = mediaList.some(
      (item) => item.messageId === initialMessageId,
    );
    if (existsInList) {
      aroundTargetLoadedRef.current = true;
      return;
    }

    aroundTargetLoadedRef.current = true;

    MessageService.getMediaAroundTarget(
      conversationId,
      initialMessageId,
      12,
      12,
    )
      .then((messages) => {
        const normalized = Array.isArray(messages) ? messages : [];
        if (!normalized.length) return;

        setRemoteMediaMessages((prev) => {
          const map = new Map<string, Message>();
          [...prev, ...normalized].forEach((msg) => {
            const key = String(msg.msg_id || msg._id || "");
            if (key) map.set(key, msg);
          });
          return Array.from(map.values());
        });
      })
      .catch((error) => {
        console.error("Failed to load media around target:", error);
      });
  }, [isOpen, conversationId, initialMessageId, mediaList]);

  const getMediaKey = useCallback((item: MediaItem | null | undefined) => {
    if (!item) return "";
    return `${item.messageId}-${item.imageIndex}-${item.type}`;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }

    if (!initialMessageId || mediaList.length === 0) return;

    const idx = mediaList.findIndex(
      (item) =>
        item.messageId === initialMessageId &&
        item.imageIndex === initialImageIndex,
    );

    // Only set as initialized if we found the target message or after around-target load
    if (idx !== -1) {
      setCurrentIndex(idx);
      hasInitializedRef.current = true;
    } else if (aroundTargetLoadedRef.current && !hasInitializedRef.current) {
      // If we've loaded around target but still can't find exact match, use first item
      setCurrentIndex(0);
      hasInitializedRef.current = true;
    }
  }, [isOpen, initialMessageId, initialImageIndex, mediaList]);

  useEffect(() => {
    if (!isOpen || mediaList.length === 0) return;

    if (pendingAnchorRef.current) {
      const anchorIdx = mediaList.findIndex(
        (item) => getMediaKey(item) === pendingAnchorRef.current,
      );
      if (anchorIdx >= 0) {
        setCurrentIndex(anchorIdx);
      }
      pendingAnchorRef.current = null;
      return;
    }

    if (currentIndex > mediaList.length - 1) {
      setCurrentIndex(Math.max(mediaList.length - 1, 0));
    }
  }, [isOpen, mediaList, currentIndex, getMediaKey]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : prev));
  }, [mediaList.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    if (isLoadingMoreMedia || isFetchingRemoteMedia || mediaList.length === 0)
      return;
    if (!hasMoreRemoteMedia) return;

    const currentItem = mediaList[currentIndex];
    if (!currentItem) return;
    const currentItemKey = getMediaKey(currentItem);

    // Avoid auto-chaining loads while user is still on the same item
    // that triggered the previous fetch.
    if (waitForUserMoveAfterLoadRef.current) {
      if (currentItemKey === lastLoadedAnchorKeyRef.current) {
        return;
      }
      waitForUserMoveAfterLoadRef.current = false;
    }

    // Load when user reaches the 3rd item from the end.
    const triggerIndex = Math.max(mediaList.length - 3, 0);
    const isAtTriggerPoint = currentIndex >= triggerIndex;
    if (!isAtTriggerPoint) return;

    if (loadedAtMediaLengthRef.current === mediaList.length) return;
    loadedAtMediaLengthRef.current = mediaList.length;

    lastLoadedAnchorKeyRef.current = currentItemKey;
    waitForUserMoveAfterLoadRef.current = true;
    pendingAnchorRef.current = getMediaKey(currentItem);
    setIsLoadingMoreMedia(true);

    fetchRemoteMediaPage(remoteSkip).finally(() => {
      setIsLoadingMoreMedia(false);
    });
  }, [
    currentIndex,
    mediaList,
    isOpen,
    conversationId,
    isLoadingMoreMedia,
    isFetchingRemoteMedia,
    hasMoreRemoteMedia,
    remoteSkip,
    fetchRemoteMediaPage,
    getMediaKey,
  ]);

  // Thumbnail window: hiển thị tối đa 10 item, tự dịch chuyển theo currentIndex
  const THUMB_WINDOW = 10;
  const windowStart = Math.floor(currentIndex / THUMB_WINDOW) * THUMB_WINDOW;
  const visibleThumbs = mediaList.slice(
    windowStart,
    windowStart + THUMB_WINDOW,
  );
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

    const fileName =
      current.url.split("/").pop()?.split("?")[0] || `download-${Date.now()}`;

    try {
      setIsDownloading(true);

      const downloadUrl = `${API_CHAT_SERVER_URL}/media/download?fileUrl=${encodeURIComponent(current.url)}&fileName=${encodeURIComponent(fileName)}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
        <div className="text-white text-sm font-medium ml-2"></div>
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
          <div className="relative max-w-full max-h-[80vh] rounded-lg overflow-hidden shadow-2xl bg-black">
            <video
              key={current.url}
              src={current.url}
              className="max-w-full max-h-[80vh] object-contain"
              controls
              preload="metadata"
            />
          </div>
        ) : (
          <img
            src={current.url}
            alt="Full view"
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              e.currentTarget.src = "";
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

      {isLoadingMoreMedia && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-black/55 border border-white/15 text-white text-xs flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Đang tải thêm ảnh...
        </div>
      )}

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
                  ${
                    isActive
                      ? "w-16 h-16 border-2 border-blue-500 opacity-100 scale-110"
                      : "w-14 h-14 border border-transparent opacity-50 hover:opacity-100 hover:scale-105"
                  }
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
