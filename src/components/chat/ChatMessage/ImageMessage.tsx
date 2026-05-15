import { useEffect, useMemo, useState } from "react";
import type { Message } from "../../../types";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, X } from "lucide-react";
import { MessageLayout } from "./MessageLayout";
import { isMessageMediaFlagged } from "../../../utils/mediaModeration";

const imagePreviewCache = new Map<string, string>();
const PREVIEW_MAX_EDGE = 640;
const PREVIEW_QUALITY = 0.72;

const createImagePreview = async (url: string): Promise<string> => {
  if (!url) return url;

  const cached = imagePreviewCache.get(url);
  if (cached) return cached;

  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) return url;

  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) return url;
  if (blob.type.includes("svg")) return url;

  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(
    1,
    PREVIEW_MAX_EDGE / bitmap.width,
    PREVIEW_MAX_EDGE / bitmap.height,
  );

  if (scale >= 0.98) {
    bitmap.close();
    return url;
  }

  const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
  const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return url;
  }

  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const previewBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", PREVIEW_QUALITY);
  });

  if (!previewBlob) return url;

  const objectUrl = URL.createObjectURL(previewBlob);
  imagePreviewCache.set(url, objectUrl);
  return objectUrl;
};

export const ImageMessage = ({
  msg,
  urls,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  isTopBoundary,
  onClick,
  onReply,
  onReact,
  onRevoke,
  onDelete,
  onPin,
  onForward,
  participants,
  conversationType,
}: {
  msg: Message;
  urls: string[];
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
  onClick?: (imageIndex: number) => void;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, reactionType: string) => void;
  onRevoke?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onPin?: (msg: Message) => void;
  onForward?: (msg: Message) => void;
  participants?: unknown[];
  conversationType?: string;
}) => {
  const GRID_WIDTH = 260;
  const GRID_LARGE_HEIGHT = 130;
  const GRID_SMALL_HEIGHT = 88;
  const count = urls.length;
  const isUploading = msg.local_status === "uploading";
  const isUploadSuccess = msg.local_status === "success";
  const isUploadError = msg.local_status === "error";
  const hasUploadState = isUploading || isUploadSuccess || isUploadError;
  const canPreviewClick = !isUploading && !isUploadError;
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const preprocessUrls = useMemo(() => {
    if (!Array.isArray(urls) || urls.length === 0) return [] as string[];
    return urls.slice(0, 6);
  }, [urls]);

  const handleImageClick = (imageIndex: number) => {
    if (!canPreviewClick) return;
    onClick?.(imageIndex);
  };

  const getDisplaySrc = (url: string) => {
    if (!url) return "";
    return previewMap[url] || imagePreviewCache.get(url) || url;
  };

  const getImageClassName = (index: number, baseClassName: string) =>
    `${baseClassName} transition duration-200 ${
      isMessageMediaFlagged(msg, index) ? "blur-md scale-105" : ""
    }`;

  useEffect(() => {
    let cancelled = false;

    const buildPreviews = async () => {
      for (const url of preprocessUrls) {
        if (!url) continue;

        try {
          const previewUrl = await createImagePreview(url);
          if (cancelled || !previewUrl || previewUrl === url) continue;

          setPreviewMap((previous) => {
            if (previous[url] === previewUrl) return previous;
            return { ...previous, [url]: previewUrl };
          });
        } catch {
          continue;
        }
      }
    };

    void buildPreviews();

    return () => {
      cancelled = true;
    };
  }, [preprocessUrls]);

  const getImagePriority = (index: number) => {
    // Prioritize the first visible tiles so message clusters appear faster.
    if (index <= 2) {
      return {
        loading: "eager" as const,
        fetchPriority: "high" as const,
      };
    }

    return {
      loading: "lazy" as const,
      fetchPriority: "auto" as const,
    };
  };

  const renderUploadOverlay = () => {
    if (!hasUploadState) return null;

    if (isUploadError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-black/55 px-4 text-white backdrop-blur-[1px]">
          <AlertCircle size={20} />
          <div className="text-center">
            <div className="text-sm font-semibold">Gửi thất bại</div>
            <div className="mt-0.5 max-w-full truncate text-[11px] text-white/80">
              {msg.local_error || "Không thể gửi ảnh"}
            </div>
          </div>
          {typeof msg.local_retry === "function" && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void msg.local_retry?.();
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
            >
              <RotateCcw size={13} />
              Gửi lại
            </button>
          )}
        </div>
      );
    }

    if (isUploadSuccess) {
      return (
        <div className="absolute inset-0 flex items-end justify-start rounded-[inherit] bg-linear-to-t from-black/40 via-black/10 to-transparent px-3 py-2 text-white">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm">
            <CheckCircle2 size={13} />
            Đã gửi
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/35 text-white">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/45 px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-sm">
          <span className="inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Đang gửi
            {typeof msg.local_upload_progress === "number" &&
              msg.local_upload_progress > 0 && (
                <span className="tabular-nums text-white/85">
                  {Math.min(99, Math.round(msg.local_upload_progress))}%
                </span>
              )}
          </span>
          {typeof msg.local_cancel === "function" && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                msg.local_cancel?.();
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-900"
            >
              <X size={12} />
              Hủy
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderGrid = (borderRadius: string) => {
    if (count === 1) {
      return (
        <div
          className={`overflow-hidden border border-gray-200 shadow-sm transition-all ${
            canPreviewClick
              ? "cursor-pointer hover:brightness-90"
              : "cursor-default"
          } ${borderRadius}`}
          onClick={canPreviewClick ? () => handleImageClick(0) : undefined}
        >
          <img
            src={getDisplaySrc(urls[0])}
            alt="Attachment"
            className={getImageClassName(
              0,
              "block w-full h-auto object-cover min-w-[200px] min-h-[120px]",
            )}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            style={{ maxWidth: `${GRID_WIDTH}px`, maxHeight: "280px" }}
          />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div
          className={`grid grid-cols-2 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{ width: `${GRID_WIDTH}px` }}
        >
          {urls.map((url, index) => (
            <div
              key={index}
              className={`overflow-hidden transition-all ${
                canPreviewClick
                  ? "cursor-pointer hover:brightness-90"
                  : "cursor-default"
              }`}
              style={{ height: `${GRID_LARGE_HEIGHT}px` }}
              onClick={
                canPreviewClick ? () => handleImageClick(index) : undefined
              }
            >
              {(() => {
                const priority = getImagePriority(index);
                return (
                  <img
                    src={getDisplaySrc(url)}
                    alt="Attachment"
                    className={getImageClassName(index, "w-full h-full object-cover")}
                    loading={priority.loading}
                    fetchPriority={priority.fetchPriority}
                    decoding="async"
                  />
                );
              })()}
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div
          className={`grid grid-cols-2 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{
            width: `${GRID_WIDTH}px`,
            gridTemplateRows: `repeat(2, ${GRID_LARGE_HEIGHT}px)`,
          }}
        >
          <div
            className={`row-span-2 overflow-hidden transition-all ${
              canPreviewClick
                ? "cursor-pointer hover:brightness-90"
                : "cursor-default"
            }`}
            onClick={canPreviewClick ? () => handleImageClick(0) : undefined}
          >
            {(() => {
              const priority = getImagePriority(0);
              return (
                <img
                  src={getDisplaySrc(urls[0])}
                  alt="Attachment"
                  className={getImageClassName(0, "w-full h-full object-cover")}
                  loading={priority.loading}
                  fetchPriority={priority.fetchPriority}
                  decoding="async"
                />
              );
            })()}
          </div>
          {urls.slice(1, 3).map((url, index) => (
            <div
              key={index + 1}
              className={`overflow-hidden transition-all ${
                canPreviewClick
                  ? "cursor-pointer hover:brightness-90"
                  : "cursor-default"
              }`}
              style={{ height: `${GRID_LARGE_HEIGHT}px` }}
              onClick={
                canPreviewClick ? () => handleImageClick(index + 1) : undefined
              }
            >
              {(() => {
                const priority = getImagePriority(index + 1);
                return (
                  <img
                    src={getDisplaySrc(url)}
                    alt="Attachment"
                    className={getImageClassName(
                      index + 1,
                      "w-full h-full object-cover",
                    )}
                    loading={priority.loading}
                    fetchPriority={priority.fetchPriority}
                    decoding="async"
                  />
                );
              })()}
            </div>
          ))}
        </div>
      );
    }

    if (count === 4) {
      return (
        <div
          className={`grid grid-cols-2 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{ width: `${GRID_WIDTH}px` }}
        >
          {urls.map((url, index) => (
            <div
              key={index}
              className={`overflow-hidden transition-all ${
                canPreviewClick
                  ? "cursor-pointer hover:brightness-90"
                  : "cursor-default"
              }`}
              style={{ height: `${GRID_LARGE_HEIGHT}px` }}
              onClick={
                canPreviewClick ? () => handleImageClick(index) : undefined
              }
            >
              {(() => {
                const priority = getImagePriority(index);
                return (
                  <img
                    src={getDisplaySrc(url)}
                    alt="Attachment"
                    className={getImageClassName(index, "w-full h-full object-cover")}
                    loading={priority.loading}
                    fetchPriority={priority.fetchPriority}
                    decoding="async"
                  />
                );
              })()}
            </div>
          ))}
        </div>
      );
    }

    if (count === 5) {
      return (
        <div
          className={`grid gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{
            width: `${GRID_WIDTH}px`,
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gridTemplateRows: `repeat(2, ${GRID_SMALL_HEIGHT}px)`,
          }}
        >
          <div
            className={`col-span-3 row-span-2 overflow-hidden transition-all ${
              canPreviewClick
                ? "cursor-pointer hover:brightness-90"
                : "cursor-default"
            }`}
            onClick={canPreviewClick ? () => handleImageClick(0) : undefined}
          >
            {(() => {
              const priority = getImagePriority(0);
              return (
                <img
                  src={getDisplaySrc(urls[0])}
                  alt="Attachment"
                  className={getImageClassName(0, "h-full w-full object-cover")}
                  loading={priority.loading}
                  fetchPriority={priority.fetchPriority}
                  decoding="async"
                />
              );
            })()}
          </div>

          {urls.slice(1, 3).map((url, index) => (
            <div
              key={index + 1}
              className={`col-span-3 overflow-hidden transition-all ${
                canPreviewClick
                  ? "cursor-pointer hover:brightness-90"
                  : "cursor-default"
              }`}
              style={{ height: `${GRID_SMALL_HEIGHT}px` }}
              onClick={
                canPreviewClick ? () => handleImageClick(index + 1) : undefined
              }
            >
              {(() => {
                const priority = getImagePriority(index + 1);
                return (
                  <img
                    src={getDisplaySrc(url)}
                    alt="Attachment"
                    className={getImageClassName(
                      index + 1,
                      "h-full w-full object-cover",
                    )}
                    loading={priority.loading}
                    fetchPriority={priority.fetchPriority}
                    decoding="async"
                  />
                );
              })()}
            </div>
          ))}

          {urls.slice(3, 5).map((url, index) => (
            <div
              key={index + 3}
              className={`col-span-3 overflow-hidden transition-all ${
                canPreviewClick
                  ? "cursor-pointer hover:brightness-90"
                  : "cursor-default"
              }`}
              style={{ height: `${GRID_SMALL_HEIGHT}px` }}
              onClick={
                canPreviewClick ? () => handleImageClick(index + 3) : undefined
              }
            >
              {(() => {
                const priority = getImagePriority(index + 3);
                return (
                  <img
                    src={getDisplaySrc(url)}
                    alt="Attachment"
                    className={getImageClassName(
                      index + 3,
                      "h-full w-full object-cover",
                    )}
                    loading={priority.loading}
                    fetchPriority={priority.fetchPriority}
                    decoding="async"
                  />
                );
              })()}
            </div>
          ))}
        </div>
      );
    }

    const visibleUrls = urls.slice(0, 6);
    const remaining = count - 6;

    return (
      <div
        className={`grid grid-cols-3 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
        style={{
          width: `${GRID_WIDTH}px`,
          gridAutoRows: `${GRID_SMALL_HEIGHT}px`,
        }}
      >
        {visibleUrls.map((url, index) => (
          <div
            key={index}
            className={`relative overflow-hidden transition-all ${
              canPreviewClick
                ? "cursor-pointer hover:brightness-90"
                : "cursor-default"
            }`}
            onClick={
              canPreviewClick ? () => handleImageClick(index) : undefined
            }
          >
            {(() => {
              const priority = getImagePriority(index);
              return (
                <img
                  src={getDisplaySrc(url)}
                  alt="Attachment"
                  className={getImageClassName(index, "w-full h-full object-cover")}
                  loading={priority.loading}
                  fetchPriority={priority.fetchPriority}
                  decoding="async"
                />
              );
            })()}
            {index === 5 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-xl font-bold pointer-events-none">
                +{remaining}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <MessageLayout
      msg={msg}
      isMe={isMe}
      currentUserId={currentUserId}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
      isTopBoundary={isTopBoundary}
      onReply={onReply}
      onReact={onReact}
      onRevoke={onRevoke}
      onDelete={onDelete}
      onPin={onPin}
      onForward={onForward}
      participants={participants}
      conversationType={conversationType}
    >
      {(borderRadius: string, renderMessageMeta) => (
        <div className="relative inline-block">
          {renderGrid(borderRadius)}
          {renderMessageMeta("media") && (
            <div className="pointer-events-none absolute right-1.5 top-1.5 z-10">
              {renderMessageMeta("media")}
            </div>
          )}
          {renderUploadOverlay()}
        </div>
      )}
    </MessageLayout>
  );
};
