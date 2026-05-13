import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { StoryItem, StorySuggestedUser, StoryUserGroup } from "../types";
import StoryReel from "./StoryReel";
import {
  fetchStoryGroups,
  fetchSuggestedUsers,
  deleteStory,
} from "../../../services/story.service";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewer from "./StoryViewer";

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
  const [isLoading, setIsLoading] = useState(true);
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
  const isMountedRef = useRef(true);

  const STORY_DURATION_MS = 6000;

  const loadStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchStoryGroups(currentUserId);
      if (!isMountedRef.current) return;
      setStoryGroups(data);

      if (data.length < 5) {
        const suggestLimit = 5 - data.length;
        const suggestData = await fetchSuggestedUsers(
          currentUserId,
          suggestLimit,
        );
        if (!isMountedRef.current) return;
        setSuggestedUsers(suggestData);
      } else {
        setSuggestedUsers([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentUserId]);

  useEffect(() => {
    isMountedRef.current = true;
    const load = async () => {
      await loadStories();
    };
    load();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadStories]);

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

  const handleDeleteStory = useCallback(
    async (storyId: string) => {
      const success = await deleteStory(storyId);
      if (success) {
        setStoryGroups((prev) =>
          prev
            .map((group) => ({
              ...group,
              stories: group.stories.filter((s) => s.id !== storyId),
            }))
            .filter((group) => group.stories.length > 0),
        );
        // If current viewer is open, close it or move to next
        if (selectedUserStories.length <= 1) {
          closeViewer();
        } else {
          const nextStories = selectedUserStories.filter((s) => s.id !== storyId);
          setSelectedUserStories(nextStories);
          setActiveStoryIndex((prev) => Math.min(prev, nextStories.length - 1));
        }
      }
    },
    [closeViewer, selectedUserStories],
  );

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
        currentUserId={currentUserId}
        isLoading={isLoading}
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

      <StoryViewer
        isOpen={isViewerOpen}
        activeStory={activeStory}
        storyGroups={storyGroups}
        selectedUserStoriesLength={selectedUserStories.length}
        activeStoryIndex={activeStoryIndex}
        storyProgress={storyProgress}
        isPaused={isPaused}
        volume={volume}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onClose={closeViewer}
        onOpenUserStories={openUserStories}
        onPrev={handlePrev}
        onNext={handleNext}
        onTogglePause={handleTogglePause}
        onVolumeChange={handleVolumeChange}
        onEnterFullscreen={enterFullscreen}
        onDeleteStory={handleDeleteStory}
        videoRef={videoRef}
      />
    </>
  );
};

export default StoryFeed;
