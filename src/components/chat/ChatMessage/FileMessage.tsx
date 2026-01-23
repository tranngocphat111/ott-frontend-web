import { useState, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  FileCode,
  FileArchive,
  Download,
  File,
} from "lucide-react";
import type { Message, User as UserType } from "../../../types";
import { UserService } from "../../../services";
import {
  formatFileSize,
  getFileExtension,
  getFileNameFromUrl,
} from "../../../utils";

// --- Helper: Màu & Icon theo loại file ---
const getFileIconAndColor = (ext: string) => {
  const extension = ext.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return {
      icon: <ImageIcon className="w-5 h-5 text-purple-600" />,
      bg: "bg-purple-100",
    };
  }
  if (["pdf"].includes(extension)) {
    return {
      icon: <FileText className="w-5 h-5 text-red-600" />,
      bg: "bg-red-100",
    };
  }
  if (["doc", "docx"].includes(extension)) {
    return {
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-100",
    };
  }
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return {
      icon: <FileText className="w-5 h-5 text-green-600" />,
      bg: "bg-green-100",
    };
  }
  if (["zip", "rar", "7z"].includes(extension)) {
    return {
      icon: <FileArchive className="w-5 h-5 text-yellow-600" />,
      bg: "bg-yellow-100",
    };
  }
  if (
    ["js", "ts", "tsx", "jsx", "py", "html", "css", "json"].includes(extension)
  ) {
    return {
      icon: <FileCode className="w-5 h-5 text-slate-700" />,
      bg: "bg-slate-200",
    };
  }

  // Default
  return {
    icon: <File className="w-5 h-5 text-gray-600" />,
    bg: "bg-gray-100",
  };
};

// --- Helper Avatar (Giữ nguyên) ---
const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const getAvatarLabel = (str: string) => {
  return str ? str.charAt(0).toUpperCase() : "?";
};

// --- Component Chính ---
export const FileMessage = ({
  msg,
  url,
  fileName,
  size,
  isMe,
  isFirstInSequence,
  isLastInSequence,
}: {
  msg: Message;
  url: string;
  fileName?: string;
  size?: number;
  isMe: boolean;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
}) => {
  // 1. Xử lý tên file (Decode URI để bỏ %20)
  const rawFileName = fileName || getFileNameFromUrl(url, "file");
  const finalFileName = decodeURIComponent(rawFileName); // 🔥 FIX LỖI TÊN FILE
  const fileExt = getFileExtension(finalFileName);
  const fileSize = size ? formatFileSize(size) : "Unknown";

  // Lấy icon và màu nền tương ứng
  const { icon: FileIconComponent, bg: iconBg } = getFileIconAndColor(fileExt);

  // 2. Fetch User (Giữ nguyên)
  const [sender, setSender] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (isMe || !msg?.sender_id) return;
      try {
        const userData = await UserService.getUserById(String(msg.sender_id));
        setSender(userData);
      } catch (error) {
        console.error("Lỗi lấy user:", error);
      }
    };
    fetchUser();
  }, [msg?.sender_id, isMe]);

  const senderName = sender?.name || "Người lạ";
  const senderAvatarUrl = sender?.avatar;
  const avatarBg = getAvatarColor(senderName);
  const avatarLabel = getAvatarLabel(senderName);

  // 3. Logic Bo Góc (Giữ nguyên để đồng bộ)
  const borderRadius = isMe
    ? isFirstInSequence && isLastInSequence
      ? "rounded-[18px]"
      : isFirstInSequence
        ? "rounded-[18px] rounded-br-[2px]"
        : isLastInSequence
          ? "rounded-[18px] rounded-tr-[2px]"
          : "rounded-[18px] rounded-r-[2px]"
    : isFirstInSequence && isLastInSequence
      ? "rounded-[18px]"
      : isFirstInSequence
        ? "rounded-[18px] rounded-bl-[2px]"
        : isLastInSequence
          ? "rounded-[18px] rounded-tl-[2px]"
          : "rounded-[18px] rounded-l-[2px]";

  return (
    <div
      className={`flex w-full ${isLastInSequence ? "mb-4" : "mb-[2px]"} 
      ${isMe ? "justify-end" : "justify-start gap-2.5"}`}
    >
      {/* Cột Avatar */}
      {!isMe && (
        <div className="flex-shrink-0 flex flex-col w-8">
          {isFirstInSequence ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm select-none border border-white overflow-hidden mt-1"
              style={{
                backgroundColor: senderAvatarUrl ? "transparent" : avatarBg,
              }}
            >
              {senderAvatarUrl ? (
                <img
                  src={senderAvatarUrl}
                  alt={senderName}
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarLabel
              )}
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Cột Nội dung File */}
      <div
        className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}
      >
        {!isMe && isFirstInSequence && (
          <span className="text-[12px] font-semibold text-gray-600 mb-1 ml-1 select-none">
            {senderName}
          </span>
        )}

        {/* FILE CARD UI */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            group flex items-center gap-3 p-2.5 pr-4 border transition-all cursor-pointer min-w-[220px] max-w-[300px]
            ${borderRadius}
            ${
              isMe
                ? "bg-[#EFDCCB] border-[#EFDCCB] hover:brightness-95" // Màu nền của mình
                : "bg-white border-gray-200 hover:bg-gray-50" // Màu nền người khác
            }
          `}
        >
          {/* 1. Icon Container */}
          <div
            className={`shrink-0 w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}
          >
            {FileIconComponent}
          </div>

          {/* 2. File Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div
              className={`text-sm font-medium truncate ${isMe ? "text-gray-900" : "text-gray-800"}`}
            >
              {finalFileName}
            </div>
            <div
              className={`text-[11px] flex items-center gap-1 ${isMe ? "text-gray-600" : "text-gray-500"}`}
            >
              <span>{fileSize}</span>
              <span>•</span>
              <span className="uppercase">{fileExt}</span>
            </div>
          </div>

          {/* 3. Download Button (Hiện khi hover hoặc luôn hiện nhưng mờ) */}
          <div className="shrink-0 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
            <Download className="w-4 h-4 text-gray-600" />
          </div>
        </a>
      </div>
    </div>
  );
};
