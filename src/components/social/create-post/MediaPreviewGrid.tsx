import React from "react";
import { Film, X } from "lucide-react";
import type { UploadedMedia } from "./types";

interface MediaPreviewGridProps {
  mediaFiles: UploadedMedia[];
  onUpdateCaption: (id: string, caption: string) => void;
  onRemoveMedia: (id: string) => void;
}

const MediaPreviewGrid: React.FC<MediaPreviewGridProps> = ({
  mediaFiles,
  onUpdateCaption,
  onRemoveMedia,
}) => {
  const count = mediaFiles.length;
  if (count === 0) return null;

  if (count === 1) {
    const media = mediaFiles[0];
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200">
        <div className="relative bg-gray-900">
          {media.type === "image" ?
            <img
              src={media.url}
              alt=""
              className="w-full max-h-72 object-contain"
            />
          : <video src={media.url} controls className="w-full max-h-72" />}
          <button
            onClick={() => onRemoveMedia(media.id)}
            className="absolute top-2 right-2 size-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="bg-white px-3 py-2">
          <input
            type="text"
            value={media.caption ?? ""}
            onChange={(e) => onUpdateCaption(media.id, e.target.value)}
            placeholder="Thêm caption cho ảnh/video này..."
            maxLength={200}
            className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          />
        </div>
      </div>
    );
  }

  const gridCols =
    count === 2 ? "grid-cols-2"
    : count === 3 ? "grid-cols-3"
    : "grid-cols-2";

  return (
    <div className="space-y-2">
      <div className={`grid ${gridCols} gap-1 rounded-xl overflow-hidden`}>
        {mediaFiles.slice(0, 4).map((media, idx) => (
          <div
            key={media.id}
            className="relative aspect-square bg-gray-900 overflow-hidden">
            {media.type === "image" ?
              <img
                src={media.url}
                alt=""
                className="w-full h-full object-cover"
              />
            : <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                <Film className="size-10 text-white/60" />
                <span className="text-white/70 text-xs mt-1">Video</span>
              </div>
            }
            {idx === 3 && count > 4 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  +{count - 4}
                </span>
              </div>
            )}
            <button
              onClick={() => onRemoveMedia(media.id)}
              className="absolute top-1 right-1 size-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition">
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {mediaFiles.map((media, idx) => (
          <div
            key={media.id}
            className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-gray-50 transition">
            <div className="size-10 rounded-lg overflow-hidden bg-gray-900 shrink-0">
              {media.type === "image" ?
                <img
                  src={media.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              : <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Film className="size-4 text-white/60" />
                </div>
              }
            </div>
            <input
              type="text"
              value={media.caption ?? ""}
              onChange={(e) => onUpdateCaption(media.id, e.target.value)}
              placeholder={`Caption ${media.type === "image" ? "ảnh" : "video"} ${idx + 1}...`}
              maxLength={200}
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent min-w-0"
            />
            <button
              onClick={() => onRemoveMedia(media.id)}
              className="size-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition shrink-0">
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaPreviewGrid;
