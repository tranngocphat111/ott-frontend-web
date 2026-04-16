import type { KeyboardEvent, MouseEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import type { Message } from "../../../types";

import { MessageLayout } from "./MessageLayout";
import {
  formatFileSize,
  getFileExtension,
  getFileNameFromUrl,
  getFileTypeData,
} from "../../../utils";

export const FileMessage = ({
  msg,
  url,
  fileName,
  size,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  isTopBoundary,
  onReply,
  onReact,
  onRevoke,
  onDelete,
  onPin,
  onForward,
}: {
  msg: Message;
  url: string;
  fileName?: string;
  size?: number;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, reactionType: string) => void;
  onRevoke?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onPin?: (msg: Message) => void;
  onForward?: (msg: Message) => void;
}) => {
  const isUploading = msg.local_status === "uploading";
  const isUploadSuccess = msg.local_status === "success";
  const isUploadError = msg.local_status === "error";
  const hasUploadState = isUploading || isUploadSuccess || isUploadError;
  const previewUrl = msg.local_preview_urls?.[0] || url;
  const uploadProgress = Math.max(
    0,
    Math.min(100, Number(msg.local_upload_progress || 0)),
  );

  // 1. Xử lý thông tin File
  const rawFileName =
    fileName || msg.fileName || getFileNameFromUrl(previewUrl, "file");
  const finalFileName = decodeURIComponent(rawFileName);
  const fileExt = getFileExtension(finalFileName);
  const fileSize = size ? formatFileSize(size) : "Unknown";

  // 2. Lấy Data từ file .ts (Lấy Component Icon, màu chữ, màu nền)
  const { Icon, color, bg } = getFileTypeData(fileExt);

  const handleDownload = async (event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    event?.preventDefault();

    try {
      const response = await fetch(previewUrl);
      if (!response.ok) {
        throw new Error("Không thể tải file");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = finalFileName;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
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
      {(borderRadius) => (
        <div
          className={`
            group flex items-center gap-3 p-2.5 pr-4 border transition-all min-w-55 max-w-75 shadow-sm relative overflow-hidden
            ${borderRadius}
            ${
              isMe
                ? "bg-chat-me border-chat-me hover:brightness-95"
                : "bg-chat-other border-chat-other-border hover:bg-gray-50"
            }
          `}
        >
          {hasUploadState ? (
            <>
              <div
                className={`shrink-0 w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${color}`} />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div
                  className={`text-sm font-medium truncate ${
                    isMe ? "text-gray-900" : "text-chat-other-text"
                  }`}
                >
                  {finalFileName}
                </div>
                <div
                  className={`text-[11px] flex items-center gap-1 ${
                    isMe ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  <span>{fileSize}</span>
                  <span>•</span>
                  <span className="uppercase">{fileExt}</span>
                </div>
              </div>

              <div className="shrink-0 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                <Download className="w-4 h-4 text-gray-600" />
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                {isUploadError ? (
                  <div className="flex flex-col items-center gap-2 text-white px-3 text-center">
                    <AlertCircle size={18} />
                    <div className="text-xs font-semibold">Gửi thất bại</div>
                    {typeof msg.local_retry === "function" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void msg.local_retry?.();
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-900"
                      >
                        <RotateCcw size={12} />
                        Gửi lại
                      </button>
                    )}
                  </div>
                ) : isUploadSuccess ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
                    <CheckCircle2 size={14} />
                    Đã gửi
                  </div>
                ) : (
                  <div className="flex w-full max-w-60 flex-col gap-2 rounded-2xl bg-black/65 px-3 py-2 text-white shadow-lg">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 size={13} className="animate-spin" />
                        Đang gửi
                      </span>
                      <span className="tabular-nums">{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    {typeof msg.local_cancel === "function" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          msg.local_cancel?.();
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-900"
                      >
                        <X size={12} />
                        Hủy
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              className="contents"
              role="button"
              tabIndex={0}
              onClick={(event) => {
                void handleDownload(event);
              }}
              onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void handleDownload();
                }
              }}
            >
              <div
                className={`shrink-0 w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${color}`} />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div
                  className={`text-sm font-medium truncate ${
                    isMe ? "text-gray-900" : "text-chat-other-text"
                  }`}
                >
                  {finalFileName}
                </div>
                <div
                  className={`text-[11px] flex items-center gap-1 ${
                    isMe ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  <span>{fileSize}</span>
                  <span>•</span>
                  <span className="uppercase">{fileExt}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  void handleDownload(event);
                }}
                className="shrink-0 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors"
              >
                <Download className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}
    </MessageLayout>
  );
};
