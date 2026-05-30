import React from "react";
import { FileText, ImageIcon, Mic, Video, X } from "lucide-react";
import type { PinnedMessagesProps } from "../../../../interfaces";
import type { Message } from "../../../../types";
import { getFileNameFromUrl, getFullUrl, parseBackendDate } from "../../../../utils";

const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  messages,
  conversationId,
  currentUserId,
  onUnpin,
}) => {
  void conversationId;
  void currentUserId;

  const validMessages = (messages || []).filter(
    (msg) => msg && msg._id && Array.isArray(msg.content),
  );

  if (validMessages.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Chưa có tin nhắn ghim nào
      </p>
    );
  }

  const getContentPreview = (message: Message) => {
    const contentItems = Array.isArray(message.content)
      ? message.content
      : [message.content];
    const mediaCount = contentItems.filter(Boolean).length;

    if (message.type === "image" && mediaCount > 1) {
      return `${mediaCount} hình ảnh`;
    }

    if (
      message.type === "image" ||
      message.type === "video" ||
      message.type === "file" ||
      message.type === "audio"
    ) {
      const raw = Array.isArray(message.content)
        ? String(message.content[0] || "")
        : String(message.content || "");
      const fallbackLabel =
        message.type === "image"
          ? "Hinh anh"
          : message.type === "video"
            ? "Video"
            : message.type === "audio"
              ? "Am thanh"
              : "Tep dinh kem";

      const fileName = getFileNameFromUrl(getFullUrl(raw), fallbackLabel);
      try {
        return decodeURIComponent(fileName);
      } catch {
        return fileName;
      }
    }

    const raw = Array.isArray(message.content)
      ? String(message.content[0] || "")
      : String(message.content || "");

    return raw.length > 100 ? `${raw.slice(0, 100)}...` : raw;
  };

  const getTypeMeta = (type: string) => {
    const normalized = String(type || "text").toLowerCase();
    if (normalized === "image") {
      return { label: "ẢNH", Icon: ImageIcon };
    }
    if (normalized === "video") {
      return { label: "VIDEO", Icon: Video };
    }
    if (normalized === "audio") {
      return { label: "VOICE", Icon: Mic };
    }
    if (normalized === "file") {
      return { label: "FILE", Icon: FileText };
    }
    return { label: "TEXT", Icon: FileText };
  };

  const handleJumpToPinned = (message: Message) => {
    const msgId = String(message?.msg_id || message?._id || "");
    if (!msgId || !conversationId) return;

    window.dispatchEvent(
      new CustomEvent("chat:jump", {
        detail: {
          conversationId,
          messageId: msgId,
          highlight: true,
          fromPinned: true,
        },
      }),
    );
  };

  return (
    <div className="space-y-2">
      {validMessages.slice(0, 3).map((message) => (
        <div
          key={message._id}
          className="group bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:shadow-sm transition-shadow"
        >
          <div className="flex justify-between items-start gap-2">
            <button
              type="button"
              onClick={() => handleJumpToPinned(message)}
              className="min-w-0 text-left flex-1"
            >
              <span className="text-[13px] text-slate-800 font-semibold block truncate">
                {message.sender_name || "Thành viên"}
              </span>
              <span className="text-[11px] text-slate-500 uppercase tracking-wide inline-flex items-center gap-1.5 mt-0.5">
                {(() => {
                  const { label, Icon } = getTypeMeta(message.type);
                  return (
                    <>
                      <Icon size={12} />
                      {label}
                    </>
                  );
                })()}
              </span>
            </button>
            <button
              onClick={() => onUnpin(message.msg_id || message._id)}
              className="cursor-pointer text-slate-400 hover:text-red-600 transition-colors shrink-0"
              title="Bỏ ghim"
            >
              <X size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleJumpToPinned(message)}
            className="w-full text-left"
          >
            <div className="text-sm text-slate-700 mt-2 leading-5 line-clamp-2">
              {getContentPreview(message)}
            </div>
          </button>

          <div className="text-[12px] text-slate-500 mt-2">
            {message.created_at || message.createdAt
              ? parseBackendDate(
                  message.created_at || message.createdAt || "",
                )?.toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }) || "Không rõ thời gian"
              : "Không rõ thời gian"}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PinnedMessages;
