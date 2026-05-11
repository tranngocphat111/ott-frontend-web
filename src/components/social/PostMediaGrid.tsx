import React, { useEffect, useRef } from "react";
import { Film } from "lucide-react";
import type { PostMediaItem } from "./types";

interface Props {
  media: PostMediaItem[];
  totalLikes?: number;
  isInView?: boolean;
}

const PostMediaGrid: React.FC<Props> = ({ media, isInView }) => {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      if (isInView) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [isInView]);

  if (media.length === 0) return null;

  const visibleMedia = media.slice(0, 4);
  const extraCount = media.length - visibleMedia.length;
  const isSingle = media.length === 1;
  const isThree = media.length === 3;

  return (
    <div
      className={`grid gap-1 bg-gray-900 overflow-hidden ${
        isSingle ? "grid-cols-1" : "grid-cols-2 max-h-[600px]"
      }`}>
      {visibleMedia.map((item, index) => {
        const isSpanTwo = isThree && index === 2;
        return (
          <div
            key={index}
            className={`relative overflow-hidden ${
              isSingle ? "w-full" : "aspect-square"
            } ${isSpanTwo ? "col-span-2" : ""}`}>
            {item.type === "image" ?
              <img
                src={item.url}
                alt={item.caption || "Post image"}
                loading="lazy"
                className={`w-full h-full ${isSingle ? "max-h-[70vh] object-contain" : "object-cover"}`}
              />
            : <div className={`relative w-full h-full ${isSingle ? "max-h-[70vh]" : ""}`}>
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  controls={isSingle}
                />
                {!isSingle && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Film className="size-10 text-white/80" />
                  </div>
                )}
              </div>
            }

            {extraCount > 0 && index === 3 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-2xl font-semibold">
                +{extraCount}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PostMediaGrid;
