import React from "react";
import {
  Maximize,
  MoreHorizontal,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import avatar from "../../../assets/avatar.png";
import type { StoryItem, StoryUserGroup } from "../types";

interface Props {
  isOpen: boolean;
  activeStory: StoryItem | null;
  storyGroups: StoryUserGroup[];
  selectedUserStoriesLength: number;
  activeStoryIndex: number;
  storyProgress: number;
  isPaused: boolean;
  volume: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onClose: () => void;
  onOpenUserStories: (userStories: StoryItem[]) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePause: () => void;
  onVolumeChange: (nextVolume: number) => void;
  onEnterFullscreen: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const StoryViewer: React.FC<Props> = ({
  isOpen,
  activeStory,
  storyGroups,
  selectedUserStoriesLength,
  activeStoryIndex,
  storyProgress,
  isPaused,
  volume,
  canGoPrev,
  canGoNext,
  onClose,
  onOpenUserStories,
  onPrev,
  onNext,
  onTogglePause,
  onVolumeChange,
  onEnterFullscreen,
  videoRef,
}) => {
  if (!isOpen || !activeStory) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#0c0d0f]">
      <button
        type="button"
        onClick={onClose}
        className="absolute left-5 top-5 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center transition">
        <X className="size-5" />
      </button>

      <div className="h-full w-full flex">
        <aside className="hidden lg:flex w-[320px] border-r border-white/10 bg-white/[0.03] flex-col">
          <div className="px-6 py-6 text-white">
            <div className="text-xl font-semibold">Stories</div>
            <div className="text-sm text-white/60 mt-1">All stories</div>
          </div>
          <div className="px-4 pb-4 overflow-y-auto">
            <div className="space-y-2">
              {storyGroups.map((group) => (
                <button
                  key={group.userId}
                  type="button"
                  onClick={() => onOpenUserStories(group.stories)}
                  className="w-full flex items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-white/10 transition">
                  <img
                    src={group.avatarUrl ?? avatar}
                    alt={group.name}
                    className="size-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-white text-sm font-semibold">
                      {group.name}
                    </div>
                    <div className="text-white/50 text-xs">Story</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-[360px] sm:w-[390px] h-[640px] sm:h-[680px] rounded-[32px] bg-[#a7b4bb] shadow-[0_40px_90px_-45px_rgba(15,23,42,0.9)] overflow-hidden">
            <div className="absolute top-3 left-4 right-4 z-20">
              <div className="h-1.5 rounded-full bg-white/40 overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{
                    width: `${((activeStoryIndex + storyProgress) / selectedUserStoriesLength) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="absolute top-6 left-5 right-5 z-20 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <img
                  src={activeStory.avatarUrl ?? avatar}
                  alt={activeStory.name}
                  className="size-9 rounded-full border border-white/40 object-cover"
                />
                <div>
                  <div className="text-sm font-semibold">
                    {activeStory.name}
                  </div>
                  <div className="text-xs text-white/60">Story</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    type="button"
                    disabled={activeStory.contentType !== "VIDEO"}
                    onClick={() => onVolumeChange(volume === 0 ? 0.6 : 0)}
                    className="size-8 rounded-full bg-black/30 hover:bg-black/50 disabled:opacity-40 inline-flex items-center justify-center">
                    {volume === 0 ?
                      <VolumeX className="size-4" />
                    : volume < 0.5 ?
                      <Volume1 className="size-4" />
                    : <Volume2 className="size-4" />}
                  </button>
                  <div className="absolute right-0 mt-2 w-36 opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 z-30">
                    <div className="rounded-full bg-black/60 px-3 py-2">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(event) =>
                          onVolumeChange(Number(event.target.value))
                        }
                        disabled={activeStory.contentType !== "VIDEO"}
                        className="w-full accent-white"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onTogglePause}
                  className="size-8 rounded-full bg-black/30 hover:bg-black/50 inline-flex items-center justify-center">
                  {isPaused ?
                    <Play className="size-4" />
                  : <Pause className="size-4" />}
                </button>
                <button
                  type="button"
                  className="size-8 rounded-full bg-black/30 hover:bg-black/50 inline-flex items-center justify-center">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center px-6 pt-12 pb-10">
              <div className="w-full h-full rounded-3xl bg-white/80 shadow-xl overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  {activeStory.contentType === "IMAGE" && activeStory.imageUrl ?
                    <img
                      src={activeStory.imageUrl}
                      alt={activeStory.name}
                      className="w-full h-full object-contain"
                    />
                  : (
                    activeStory.contentType === "VIDEO" && activeStory.videoUrl
                  ) ?
                    <video
                      ref={videoRef}
                      src={activeStory.videoUrl}
                      className="w-full h-full object-contain"
                      autoPlay
                      playsInline
                      controls={false}
                    />
                  : (
                    activeStory.contentType === "TEXT" &&
                    activeStory.textContent
                  ) ?
                    <div
                      className="w-full h-full flex flex-col items-center justify-center text-center px-8"
                      style={{
                        backgroundColor:
                          activeStory.textBackgroundColor || "#111827",
                      }}>
                      <p className="text-white text-2xl font-semibold leading-tight whitespace-pre-wrap break-words">
                        {activeStory.textContent}
                      </p>
                    </div>
                  : <>
                      {activeStory.isBirthday && (
                        <div className="mb-3 text-3xl">🎂</div>
                      )}
                      <h3 className="text-slate-900 text-xl font-bold leading-tight">
                        {activeStory.name}
                      </h3>
                    </>
                  }
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Previous story"
              disabled={!canGoPrev}
              onClick={onPrev}
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer disabled:cursor-default z-10"
            />
            <button
              type="button"
              aria-label="Next story"
              disabled={!canGoNext}
              onClick={onNext}
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer disabled:cursor-default z-10"
            />

            <p className="absolute bottom-5 left-6 text-white/70 text-xs">
              Story {activeStoryIndex + 1} / {selectedUserStoriesLength}
            </p>
          </div>

          {activeStory.contentType === "VIDEO" && activeStory.videoUrl && (
            <button
              type="button"
              onClick={onEnterFullscreen}
              className="absolute right-[calc(50%-230px)] bottom-12 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center transition">
              <Maximize className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
