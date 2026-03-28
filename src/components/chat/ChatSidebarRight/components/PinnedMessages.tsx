import React from "react";
import { X } from "lucide-react";
import type { PinnedMessagesProps } from "../../../../interfaces";

const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  messages,
  conversationId,
  currentUserId,
  onUnpin,
}) => {
  const validMessages = (messages || []).filter(msg => 
    msg && 
    msg._id && 
    Array.isArray(msg.content)
  );

  if (validMessages.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Chưa có tin nhắn ghim nào
      </p>
    );
  }

  const getContentPreview = (message: any) => {
    if (message.type === "image") return "[Hình ảnh]";
    if (message.type === "video") return "[Video]";
    if (message.type === "file") return "[Tệp tin]";

    const raw = Array.isArray(message.content)
      ? String(message.content[0] || "")
      : String(message.content || "");

    return raw.length > 100 ? `${raw.slice(0, 100)}...` : raw;
  };

  return (
    <div className="space-y-3">
      {validMessages.slice(0, 3).map((message) => (
        <div
          key={message._id}
          className="bg-amber-50 border border-amber-200 rounded-lg p-3"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-amber-700 font-medium">
              {message.sender_name || "Unknown User"}
            </span>
            <button
              onClick={() => onUnpin(message._id)}
              className="text-amber-600 hover:text-amber-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="text-sm text-gray-700">{getContentPreview(message)}</div>
          <div className="text-xs text-amber-600 mt-1">
            {message.created_at || message.createdAt 
              ? new Date(message.created_at || message.createdAt || "").toLocaleDateString("vi-VN")
              : "Không rõ thời gian"
            }
          </div>
        </div>
      ))}
    </div>
  );
};

export default PinnedMessages;