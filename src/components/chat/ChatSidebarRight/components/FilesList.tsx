import React, { useEffect, useRef, useState } from "react";
import { Clock3, Download, Ellipsis, Reply } from "lucide-react";
import { URL_S3 } from "../../../../config/api.config";
import type { Message } from "../../../../types";
import { getFileTypeData, getFileTypeLabel } from "../../../../utils/fileTypeUtils";

interface FilesListProps {
  messages: Message[];
  onViewAll: () => void;
}

const FilesList: React.FC<FilesListProps> = ({ messages, onViewAll }) => {
  const [openMenuFileId, setOpenMenuFileId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuFileId(null);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const validMessages = (messages || []).filter(msg => 
    msg && 
    msg._id && 
    Array.isArray(msg.content)
  );

  const allFiles: Array<{id: string, message: Message, key: string, size?: number}> = [];
  validMessages.forEach((message) => {
    const type = String(message.type || "").toLowerCase();
    if (type !== "file") return;

    const contentArray = Array.isArray(message.content)
      ? message.content
      : [message.content];

    contentArray.forEach((content, index) => {
      const key = typeof content === "string" ? content : content?.url;
      if (key) {
        const contentSize =
          typeof content === "object" ? Number(content?.size || 0) : 0;
        const messageSize = Number((message as any)?.size || 0);

        allFiles.push({
          id: `${message._id}:${index}`,
          message,
          key,
          size: contentSize || messageSize || undefined,
        });
      }
    });
  });

  if (allFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gray-100" />
        <p className="text-gray-500">Chưa có file nào</p>
      </div>
    );
  }

  const getFileName = (key: string) => {
    const rawName = key.split("/").pop() || "File";
    const match = rawName.match(/^[a-f0-9]+_(.+)$/i);
    return match ? match[1] : rawName;
  };

  const formatFileSize = (size?: number) => {
    if (!size || Number.isNaN(size)) return "Không rõ dung lượng";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => undefined);
  };

  return (
    <div ref={menuRef}>
      <div className="space-y-2 mb-3">
        {allFiles.slice(0, 3).map(({ id, message, key, size }) => {
          const fileName = getFileName(key);
          const ext = fileName.split(".").pop() || "";
          const { Icon, bg, color } = getFileTypeData(ext);
          const typeLabel = getFileTypeLabel(ext);
          const fileUrl = `${URL_S3}${key}`;
          const fileDate = message.created_at || message.createdAt
            ? new Date(message.created_at || message.createdAt || "").toLocaleDateString("vi-VN")
            : "Không rõ ngày";
          const isMenuOpen = openMenuFileId === id;

          return (
            <div
              key={id}
              className={`group relative flex items-center gap-3 rounded-lg bg-gray-50 px-2 py-2 hover:bg-gray-100 ${
                isMenuOpen ? "z-30" : "z-0"
              }`}
            >
              <button
                className="flex cursor-pointer min-w-0 flex-1 items-center gap-3 pr-2 text-left"
                onClick={() => {
                  window.open(fileUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded ${bg}`}>
                  <Icon size={14} className={color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{typeLabel} • {formatFileSize(size)}</p>
                </div>
              </button>

              <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-xs text-gray-500">
                <Clock3 size={11} />
                <span>{fileDate}</span>
              </div>

              <div
                className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md bg-white pl-1 shadow-sm ring-1 ring-gray-200 transition-opacity ${
                  isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <button
                  type="button"
                  className="flex cursor-pointer h-8 w-8 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
                  title="Tải xuống"
                  onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}
                >
                  <Download size={15} />
                </button>
                <button
                  type="button"
                  className="flex cursor-pointer h-8 w-8 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
                  title="Chia sẻ"
                  onClick={() => copyToClipboard(fileUrl)}
                >
                  <Reply size={15} />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    className="flex cursor-pointer h-8 w-8 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
                    title="Tùy chọn"
                    onClick={() =>
                      setOpenMenuFileId((prev) => (prev === id ? null : id))
                    }
                  >
                    <Ellipsis size={16} />
                  </button>

                  {openMenuFileId === id && (
                    <div className="absolute right-0 top-9 z-50 w-56 rounded-xl border border-gray-200 bg-white py-1.5 shadow-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(fileUrl);
                          setOpenMenuFileId(null);
                        }}
                        className="w-full cursor-pointer px-4 py-2 text-left text-[14px] text-gray-700 hover:bg-gray-50"
                      >
                        Chia sẻ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.open(fileUrl, "_blank", "noopener,noreferrer");
                          setOpenMenuFileId(null);
                        }}
                        className="w-full cursor-pointer px-4 py-2 text-left text-[14px] text-gray-700 hover:bg-gray-50"
                      >
                        Lưu vào My Documents
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.open(fileUrl, "_blank", "noopener,noreferrer");
                          setOpenMenuFileId(null);
                        }}
                        className="w-full cursor-pointer px-4 py-2 text-left text-[14px] text-gray-700 hover:bg-gray-50"
                      >
                        Xem tin nhắn gốc
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        type="button"
                        onClick={() => setOpenMenuFileId(null)}
                        className="w-full cursor-pointer px-4 py-2 text-left text-[14px] text-red-500 hover:bg-red-50"
                      >
                        Xóa chỉ ở phía tôi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => {
          onViewAll();
        }}
        className="w-full cursor-pointer py-2.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
      >
        Xem tất cả
      </button>
    </div>
  );
};

export default FilesList;
