import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import type { PostMediaItem } from "./types";

interface Props {
  media: PostMediaItem[];
  totalLikes?: number;
  isInView?: boolean;
}

const SWIPE_THRESHOLD_PX = 60;

const PostMediaCarousel: React.FC<Props> = ({ media, isInView }) => {
  if (media.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const dragState = useRef({
    startX: 0,
    deltaX: 0,
    dragging: false,
  });

  const hasMultiple = media.length > 1;
  const activeMedia = media[activeIndex];

  useEffect(() => {
    if (!isInView) {
      videoRefs.current.forEach((video) => {
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      });
      return;
    }

    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeIndex && media[idx]?.type === "video") {
        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => undefined);
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [activeIndex, isInView, media]);

  useEffect(() => {
    setActiveIndex(0);
  }, [media.length]);

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % media.length);
  };

  const dots = useMemo(() => media.map((_, idx) => idx), [media]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragState.current = {
      startX: event.clientX,
      deltaX: 0,
      dragging: true,
    };
    setDragOffset(0);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.dragging) return;
    const delta = event.clientX - dragState.current.startX;
    dragState.current.deltaX = delta;
    setDragOffset(delta);
  };

  const endDrag = () => {
    if (!dragState.current.dragging) return;
    const delta = dragState.current.deltaX;
    dragState.current.dragging = false;
    dragState.current.deltaX = 0;
    setDragOffset(0);

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  const handlePointerUp = () => endDrag();
  const handlePointerLeave = () => endDrag();

  return (
    <div className="relative bg-gray-900 overflow-hidden">
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}>
        {media.map((m, index) => (
          <div
            key={index}
            className="min-w-full max-h-[70vh] flex items-center justify-center bg-gray-900">
            {m.type === "image" ?
              <img
                src={m.url}
                alt={m.caption || "Post image"}
                loading="lazy"
                className="w-full h-full max-h-[70vh] object-contain"
              />
            : <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={m.url}
                className="w-full h-full max-h-[70vh] object-contain"
                muted
                playsInline
                loop
                preload="metadata"
                controls
              />
            }
          </div>
        ))}
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}>
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}>
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {hasMultiple && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {dots.map((idx) => (
            <button
              key={idx}
              type="button"
              className={`h-2.5 rounded-full transition-all ${
                idx === activeIndex ? "w-5 bg-white" : "w-2.5 bg-white/60"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(idx);
              }}
            />
          ))}
        </div>
      )}

      {activeMedia?.type === "video" && !isInView && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Film className="size-12 text-white/70" />
        </div>
      )}
    </div>
  );
};

export default PostMediaCarousel;
