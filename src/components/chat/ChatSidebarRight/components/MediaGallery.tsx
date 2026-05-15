import React from "react";
import { Image } from "lucide-react";
import type { Message } from "../../../../types";
import { getFullUrl } from "../../../../utils";
import { isMessageMediaFlagged } from "../../../../utils/mediaModeration";

interface MediaGalleryProps {
  messages: Message[];
  onMediaClick: (messageId: string, imageIndex: number) => void;
  onViewAll: () => void;
}

const getMediaKey = (content: unknown) => {
  if (typeof content === "string") return content;
  if (content && typeof content === "object" && "url" in content) {
    return String((content as { url?: unknown }).url || "");
  }
  return "";
};

const MediaGallery: React.FC<MediaGalleryProps> = ({
  messages,
  onMediaClick,
  onViewAll,
}) => {
  const validMessages = (messages || []).filter(msg => 
    msg && 
    msg._id && 
    Array.isArray(msg.content)
  );

  if (validMessages.length === 0) {
    return (
      <div className="text-center py-12">
        <Image size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Chưa có ảnh hoặc video nào</p>
      </div>
    );
  }

  const allMediaItems: Array<{
    messageIndex: number;
    messageId: string;
    type: "image" | "video";
    key: string;
    index: number;
    isFlagged: boolean;
  }> = [];

  validMessages.forEach((message, messageIndex) => {
    const type = String(message.type || "").toLowerCase();
    if (type !== "image" && type !== "video") return;

    const contentArray = Array.isArray(message.content)
      ? message.content
      : [message.content];

    contentArray.forEach((content, index) => {
      const key = getMediaKey(content);
      if (!key) return;

      allMediaItems.push({
        messageIndex,
        messageId: message._id,
        type: type as "image" | "video",
        key,
        index,
        isFlagged: isMessageMediaFlagged(message, index),
      });
    });
  });

  // Show only first 8 media items for preview
  const displayedItems = allMediaItems.slice(0, 8);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {displayedItems.map(({ messageIndex, messageId, type, key, index, isFlagged }) => (
          <div
            key={`${validMessages[messageIndex]._id}-${index}`}
            onClick={() => onMediaClick(messageId, index)}
            className="aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            {type === "image" ? (
              <img
                src={getFullUrl(key)}
                alt="Media"
                className={`w-full h-full object-cover transition duration-200 ${
                  isFlagged ? "blur-md scale-105" : ""
                }`}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : type === "video" ? (
              <div className="relative w-full h-full">
                <video
                  src={getFullUrl(key)}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-4 border-l-gray-600 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Image size={24} className="text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {allMediaItems.length > 0 && (
        <button
          onClick={() => {
            onViewAll();
          }}
          className="w-full cursor-pointer py-2.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          Xem tất cả
        </button>
      )}
    </div>
  );
};

export default MediaGallery;
