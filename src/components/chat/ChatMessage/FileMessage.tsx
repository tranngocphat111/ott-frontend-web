import { Download } from "lucide-react";
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
}) => {
  // 1. Xử lý thông tin File
  const rawFileName = fileName || getFileNameFromUrl(url, "file");
  const finalFileName = decodeURIComponent(rawFileName);
  const fileExt = getFileExtension(finalFileName);
  const fileSize = size ? formatFileSize(size) : "Unknown";

  // 2. Lấy Data từ file .ts (Lấy Component Icon, màu chữ, màu nền)
  const { Icon, color, bg } = getFileTypeData(fileExt);

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
    >
      {(borderRadius) => (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            group flex items-center gap-3 p-2.5 pr-4 border transition-all cursor-pointer min-w-55 max-w-75 shadow-sm
            ${borderRadius}
            ${
              isMe
                ? "bg-chat-me border-chat-me hover:brightness-95"
                : "bg-chat-other border-chat-other-border hover:bg-gray-50"
            }
          `}
        >
          {/* A. Icon Container */}
          <div
            className={`shrink-0 w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}
          >
            {/* 🔥 Giờ component render ở đây */}
            <Icon className={`w-5 h-5 ${color}`} />
          </div>

          {/* B. File Info */}
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

          {/* C. Download Button */}
          <div className="shrink-0 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
            <Download className="w-4 h-4 text-gray-600" />
          </div>
        </a>
      )}
    </MessageLayout>
  );
};
