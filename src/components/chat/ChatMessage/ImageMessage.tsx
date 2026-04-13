import type { Message } from "../../../types";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, X } from "lucide-react";
import { MessageLayout } from "./MessageLayout";

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
}) => {
  const count = urls.length;
  const isUploading = msg.local_status === "uploading";
  const isUploadSuccess = msg.local_status === "success";
  const isUploadError = msg.local_status === "error";
  const hasUploadState = isUploading || isUploadSuccess || isUploadError;
  const canPreviewClick = !isUploading && !isUploadError;

  const handleImageClick = (imageIndex: number) => {
    if (!canPreviewClick) return;
    onClick?.(imageIndex);
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
            src={urls[0]}
            alt="Attachment"
            className="block max-w-full h-auto object-cover max-h-100 min-w-25"
            loading="eager"
          />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div
          className={`grid grid-cols-2 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{ width: "300px" }}
        >
          {urls.map((url, index) => (
            <div
              key={index}
              className={`overflow-hidden transition-all ${
                canPreviewClick
                  ? "cursor-pointer hover:brightness-90"
                  : "cursor-default"
              }`}
              style={{ height: "150px" }}
              onClick={
                canPreviewClick ? () => handleImageClick(index) : undefined
              }
            >
              <img
                src={url}
                alt="Attachment"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div
          className={`grid grid-cols-2 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{ width: "300px", gridTemplateRows: "repeat(2, 150px)" }}
        >
          <div
            className={`row-span-2 overflow-hidden transition-all ${
              canPreviewClick
                ? "cursor-pointer hover:brightness-90"
                : "cursor-default"
            }`}
            onClick={canPreviewClick ? () => handleImageClick(0) : undefined}
          >
            <img
              src={urls[0]}
              alt="Attachment"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          {urls.slice(1, 3).map((url, index) => (
            <div
              key={index + 1}
              className={`overflow-hidden transition-all ${
                canPreviewClick
                  ? "cursor-pointer hover:brightness-90"
                  : "cursor-default"
              }`}
              style={{ height: "150px" }}
              onClick={
                canPreviewClick ? () => handleImageClick(index + 1) : undefined
              }
            >
              <img
                src={url}
                alt="Attachment"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          ))}
        </div>
      );
    }

    if (count === 4) {
      return (
        <div
          className={`grid grid-cols-2 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{ width: "300px" }}
        >
          {urls.map((url, index) => (
            <div
              key={index}
              className={`overflow-hidden transition-all ${
                canPreviewClick
                  ? "cursor-pointer hover:brightness-90"
                  : "cursor-default"
              }`}
              style={{ height: "150px" }}
              onClick={
                canPreviewClick ? () => handleImageClick(index) : undefined
              }
            >
              <img
                src={url}
                alt="Attachment"
                className="w-full h-full object-cover"
                loading="eager"
              />
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
        style={{ width: "300px" }}
      >
        {visibleUrls.map((url, index) => (
          <div
            key={index}
            className={`relative overflow-hidden transition-all ${
              canPreviewClick
                ? "cursor-pointer hover:brightness-90"
                : "cursor-default"
            }`}
            style={{ height: "100px" }}
            onClick={
              canPreviewClick ? () => handleImageClick(index) : undefined
            }
          >
            <img
              src={url}
              alt="Attachment"
              className="w-full h-full object-cover"
              loading="eager"
            />
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
    >
      {(borderRadius: string) => (
        <div className="relative inline-block">
          {renderGrid(borderRadius)}
          {renderUploadOverlay()}
        </div>
      )}
    </MessageLayout>
  );
};
