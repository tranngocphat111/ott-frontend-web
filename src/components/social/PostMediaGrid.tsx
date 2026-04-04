import React from "react";
import { Film } from "lucide-react";
import type { PostMediaItem } from "./types";

interface Props {
  media: PostMediaItem[];
}

const PostMediaGrid: React.FC<Props> = ({ media }) => {
  if (media.length === 0) return null;

  /* ── 1 item ──────────────────────────────────────────── */
  if (media.length === 1) {
    const m = media[0];
    return (
      <div className="bg-gray-900 overflow-hidden cursor-pointer">
        {m.type === "image" ?
          <img src={m.url} alt="" className="w-full max-h-125 object-contain" />
        : <video src={m.url} controls className="w-full max-h-125" />}
      </div>
    );
  }

  /* ── 2 items ─────────────────────────────────────────── */
  if (media.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {media.map((m, i) => (
          <div
            key={i}
            className="aspect-square overflow-hidden bg-gray-900 cursor-pointer">
            {m.type === "image" ?
              <img src={m.url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <Film className="size-12 text-white/60" />
              </div>
            }
          </div>
        ))}
      </div>
    );
  }

  /* ── 3 items ─────────────────────────────────────────── */
  if (media.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5" style={{ height: 360 }}>
        <div className="overflow-hidden bg-gray-900 cursor-pointer row-span-2">
          {media[0].type === "image" ?
            <img
              src={media[0].url}
              alt=""
              className="w-full h-full object-cover"
            />
          : <div className="w-full h-full flex items-center justify-center">
              <Film className="size-12 text-white/60" />
            </div>
          }
        </div>
        {media.slice(1).map((m, i) => (
          <div key={i} className="overflow-hidden bg-gray-900 cursor-pointer">
            {m.type === "image" ?
              <img src={m.url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <Film className="size-10 text-white/60" />
              </div>
            }
          </div>
        ))}
      </div>
    );
  }

  /* ── 4+ items ────────────────────────────────────────── */
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {media.slice(0, 4).map((m, idx) => (
        <div
          key={idx}
          className="relative aspect-square overflow-hidden bg-gray-900 cursor-pointer">
          {m.type === "image" ?
            <img src={m.url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <Film className="size-10 text-white/60" />
            </div>
          }
          {idx === 3 && media.length > 4 && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                +{media.length - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostMediaGrid;
