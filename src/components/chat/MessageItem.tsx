import { convertShortcodeToEmoji } from "../../utils/emojiUtils";

// Hàm format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Hàm lấy tên file từ URL
const getFileNameFromUrl = (url: string, fallback: string = "file"): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split("/").pop() || fallback;
    // Loại bỏ unique ID prefix (format: uniqueId_filename)
    const match = fileName.match(/^[a-f0-9]+_(.+)$/);
    return match ? match[1] : fileName;
  } catch {
    return fallback;
  }
};

// Hàm lấy extension từ filename
const getFileExtension = (fileName: string): string => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toUpperCase() || "FILE" : "FILE";
};

export const MessageItem = ({ msg, isMe }: { msg: any; isMe: boolean }) => {
  const renderContent = () => {
    switch (msg.type) {
      case "image":
        return (
          <div className="space-y-2">
            <img
              src={msg.content}
              alt="Hình ảnh"
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
              style={{ maxHeight: "300px", minWidth: "200px" }}
              onClick={() => window.open(msg.content, "_blank")}
              loading="lazy"
              title="Click để xem ảnh cỡ lớn"
            />
          </div>
        );

      case "video":
        return (
          <div className="space-y-2">
            <video
              src={msg.content}
              controls
              className="max-w-full rounded-lg shadow-sm"
              style={{ maxHeight: "300px", minWidth: "200px" }}
              preload="metadata"
            >
              Trình duyệt không hỗ trợ video.
            </video>
          </div>
        );

      case "file": {
        const fileName =
          msg.fileName || getFileNameFromUrl(msg.content, "file");
        const fileSize = msg.size ? formatFileSize(msg.size) : "";
        const fileExt = getFileExtension(fileName);

        return (
          <a
            href={msg.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 min-w-62.5 group"
          >
            {/* File Icon */}
            <div className="shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-xs">
                {fileExt}
              </span>
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                {fileName}
              </div>
              {fileSize && (
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  {fileSize}
                  <span className="ml-1">• Đã có trên Cloud</span>
                </div>
              )}
            </div>

            {/* Download Icon */}
            <div className="shrink-0">
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </a>
        );
      }

      case "text":
      default:
        // Convert shortcode thành emoji để hiển thị
        // Xử lý trường hợp msg.content là Array
        let originalText = msg.content;
        if (Array.isArray(originalText)) {
          originalText = originalText.join("");
        }
        originalText = String(originalText || "");

        const displayText = convertShortcodeToEmoji(originalText);

        return (
          <div className="wrap-break-word whitespace-pre-wrap">
            {displayText}
          </div>
        );
    }
  };

  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-5 py-3 max-w-[70%] text-[15px] leading-relaxed shadow-sm
        ${
          isMe
            ? "bg-[#EFDCCB] text-gray-900 rounded-2xl rounded-tr-sm"
            : "bg-white text-gray-900 rounded-2xl rounded-tl-sm border border-gray-100"
        }`}
      >
        {renderContent()}
      </div>
    </div>
  );
};
