import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import type { StoryItem, StorySuggestedUser, StoryUserGroup } from "../types";
import StoryReel from "../StoryReel";
import { fetchStories } from "../../../services/story.service";
import CreateStoryModal from "../CreateStoryModal";

interface Props {
  currentUserAvatar: string;
  currentUserId: string;
  currentUserName: string;
}

export const StoryFeed: React.FC<Props> = ({
  currentUserAvatar,
  currentUserId,
  currentUserName,
}) => {
  const [storyGroups, setStoryGroups] = useState<StoryUserGroup[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<StorySuggestedUser[]>(
    [],
  );
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState<StoryItem[]>(
    [],
  );
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const STORY_DURATION_MS = 6000;

  const loadStories = useCallback(async () => {
    const data = await fetchStories(currentUserId);
    setStoryGroups(data.storyGroups);
    setSuggestedUsers(data.suggestedUsers);
  }, [currentUserId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const data = await fetchStories(currentUserId);
      if (isMounted) {
        setStoryGroups(data.storyGroups);
        setSuggestedUsers(data.suggestedUsers);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  const openUserStories = useCallback((userStories: StoryItem[]) => {
    if (userStories.length === 0) return;
    setSelectedUserStories(userStories);
    // Default to first story in the grouped list.
    setActiveStoryIndex(0);
    setStoryProgress(0);
    setIsPaused(false);
    setIsViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
    setSelectedUserStories([]);
    setActiveStoryIndex(0);
    setStoryProgress(0);
    setIsPaused(false);
  }, []);

  const activeStory = useMemo(
    () => selectedUserStories[activeStoryIndex] ?? null,
    [activeStoryIndex, selectedUserStories],
  );

  const canGoPrev = activeStoryIndex > 0;
  const canGoNext = activeStoryIndex < selectedUserStories.length - 1;

  const handlePrev = useCallback(() => {
    setActiveStoryIndex((prev) => Math.max(0, prev - 1));
    setStoryProgress(0);
    setIsPaused(false);
  }, []);

  const handleNext = useCallback(() => {
    setActiveStoryIndex((prev) =>
      Math.min(selectedUserStories.length - 1, prev + 1),
    );
    setStoryProgress(0);
    setIsPaused(false);
  }, [selectedUserStories.length]);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleVolumeChange = useCallback((nextVolume: number) => {
    const clamped = Math.min(1, Math.max(0, nextVolume));
    setVolume(clamped);
  }, []);

  const enterFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
      return;
    }
    const legacyVideo = video as HTMLVideoElement & {
      webkitRequestFullscreen?: () => void;
      msRequestFullscreen?: () => void;
    };
    legacyVideo.webkitRequestFullscreen?.();
    legacyVideo.msRequestFullscreen?.();
  }, []);

  useEffect(() => {
    if (!isViewerOpen || !activeStory) return;
    setStoryProgress(0);
    setIsPaused(false);
  }, [activeStory, isViewerOpen]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
    videoRef.current.muted = volume === 0;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => undefined);
    }
  }, [isPaused]);

  useEffect(() => {
    if (!isViewerOpen || !activeStory || isPaused) return;

    if (activeStory.contentType === "VIDEO" && videoRef.current) {
      const video = videoRef.current;

      const handleTimeUpdate = () => {
        if (!video.duration || Number.isNaN(video.duration)) return;
        setStoryProgress(Math.min(1, video.currentTime / video.duration || 0));
      };

      const handleEnded = () => {
        if (activeStoryIndex < selectedUserStories.length - 1) {
          setActiveStoryIndex((prev) => prev + 1);
        }
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("ended", handleEnded);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", handleEnded);
      };
    }

    const startTime = Date.now();
    const timerId = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / STORY_DURATION_MS);
      setStoryProgress(progress);
      if (progress >= 1) {
        window.clearInterval(timerId);
        if (activeStoryIndex < selectedUserStories.length - 1) {
          setActiveStoryIndex((prev) => prev + 1);
        }
      }
    }, 120);

    return () => window.clearInterval(timerId);
  }, [
    activeStory,
    activeStoryIndex,
    isPaused,
    isViewerOpen,
    selectedUserStories.length,
  ]);

  return (
    <>
      <StoryReel
        key={`${currentUserId}-${storyGroups.length}-${suggestedUsers.length}`}
        storyGroups={storyGroups}
        suggestedUsers={suggestedUsers}
        currentUserAvatar={currentUserAvatar}
        onCreateStory={() => setIsStoryModalOpen(true)}
        onOpenUserStories={openUserStories}
      />

      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        onCreated={loadStories}
      />

      {isViewerOpen && activeStory && (
        <div className="fixed inset-0 z-[60] bg-[#0c0d0f]">
          <button
            type="button"
            onClick={closeViewer}
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
                      onClick={() => openUserStories(group.stories)}
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
                        width: `${((activeStoryIndex + storyProgress) / selectedUserStories.length) * 100}%`,
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
                        onClick={() =>
                          handleVolumeChange(volume === 0 ? 0.6 : 0)
                        }
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
                              handleVolumeChange(Number(event.target.value))
                            }
                            disabled={activeStory.contentType !== "VIDEO"}
                            className="w-full accent-white"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleTogglePause}
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
                      {(
                        activeStory.contentType === "IMAGE" &&
                        activeStory.imageUrl
                      ) ?
                        <img
                          src={activeStory.imageUrl}
                          alt={activeStory.name}
                          className="w-full h-full object-contain"
                        />
                      : (
                        activeStory.contentType === "VIDEO" &&
                        activeStory.videoUrl
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
                  onClick={handlePrev}
                  className="absolute inset-y-0 left-0 w-1/2 cursor-pointer disabled:cursor-default z-10"
                />
                <button
                  type="button"
                  aria-label="Next story"
                  disabled={!canGoNext}
                  onClick={handleNext}
                  className="absolute inset-y-0 right-0 w-1/2 cursor-pointer disabled:cursor-default z-10"
                />

                <p className="absolute bottom-5 left-6 text-white/70 text-xs">
                  Story {activeStoryIndex + 1} / {selectedUserStories.length}
                </p>
              </div>

              {activeStory.contentType === "VIDEO" && activeStory.videoUrl && (
                <button
                  type="button"
                  onClick={enterFullscreen}
                  className="absolute right-[calc(50%-230px)] bottom-12 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center transition">
                  <Maximize className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoryFeed;
