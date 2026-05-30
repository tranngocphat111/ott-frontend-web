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
  viewStory,
  fetchStoryViewers,
  mapStory,
} from "../../../services/story.service";
import {
  mediaSocketService,
  type MediaRealtimePayload,
  type PostActivityPayload,
} from "../../../services/mediaSocket.service";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewer from "./StoryViewer";
import { X } from "lucide-react";
import avatar from "../../../assets/avatar.png";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [editingStory, setEditingStory] = useState<StoryItem | null>(null);
  const lastLocalUpdateRef = useRef<number>(0);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isViewersModalOpen, setIsViewersModalOpen] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [selectedUserStories, setSelectedUserStories] = useState<StoryItem[]>(
    [],
  );
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [volume, setVolume] = useState(0.6);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isMountedRef = useRef(true);

  const STORY_DURATION_MS = 6000;

  const loadStories = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const groups = await fetchStoryGroups(currentUserId);
      setStoryGroups((prev) => {
        // Create a map of IDs we want to keep from local state (if recently updated)
        const recentlyUpdatedIds = new Set();
        const localUserGroup = prev.find((g) => g.userId === currentUserId);

        if (Date.now() - lastLocalUpdateRef.current < 3000 && localUserGroup) {
          localUserGroup.stories.forEach((s) => recentlyUpdatedIds.add(s.id));
        }

        // Merge logic: For each group from server, filter out stories that we are protecting locally
        const mergedGroups = groups.map((g) => {
          if (g.userId === currentUserId && recentlyUpdatedIds.size > 0) {
            // Keep local version for current user if protecting
            return localUserGroup!;
          }
          return g;
        });

        // Final safety check: ensure NO duplicate story IDs across ALL groups
        const seenIds = new Set();
        return mergedGroups
          .map((group) => ({
            ...group,
            stories: group.stories.filter((s) => {
              if (seenIds.has(s.id)) return false;
              seenIds.add(s.id);
              return true;
            }),
          }))
          .filter((g) => g.stories.length > 0);
      });

      const data = groups;
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
    } catch (error) {
      setLoadError(
        error instanceof Error && error.message ?
          error.message
        : "Không tải được story. Vui lòng thử lại sau.",
      );
      setStoryGroups([]);
      setSuggestedUsers([]);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentUserId]);

  useEffect(() => {
    const handleMediaUpdate = (payload: MediaRealtimePayload) => {
      if (!payload?.contentId) return;
      if (payload.contentTargetType === "STORY") {
        void loadStories();
      }
    };

    const handleActivity = (payload: PostActivityPayload) => {
      if (!payload.postId) return;
      // Since story IDs are completely distinct from post IDs, we can check
      // if it exists in our current storyGroups.
      const isStory = storyGroups.some((g) =>
        g.stories.some((s) => s.id === payload.postId),
      );
      if (isStory) {
        void loadStories();
      }
    };

    mediaSocketService.onMediaUpdate(handleMediaUpdate);
    mediaSocketService.onPostActivity(handleActivity);

    return () => {
      mediaSocketService.offMediaUpdate(handleMediaUpdate);
      mediaSocketService.offPostActivity(handleActivity);
    };
  }, [loadStories, storyGroups]);

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
    setEditingStory(null);
  }, []);

  const activeStory = useMemo(
    () => selectedUserStories[activeStoryIndex] ?? null,
    [activeStoryIndex, selectedUserStories],
  );

  const currentGroupIndex = useMemo(
    () => storyGroups.findIndex((g) => g.userId === activeStory?.userId),
    [activeStory?.userId, storyGroups],
  );

  const canGoPrev = activeStoryIndex > 0 || currentGroupIndex > 0;
  const canGoNext =
    activeStoryIndex < selectedUserStories.length - 1 ||
    (currentGroupIndex !== -1 && currentGroupIndex < storyGroups.length - 1);

  const handlePrev = useCallback(() => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      setStoryProgress(0);
      setIsPaused(false);
    } else {
      if (currentGroupIndex > 0) {
        const prevGroup = storyGroups[currentGroupIndex - 1];
        setSelectedUserStories(prevGroup.stories);
        setActiveStoryIndex(prevGroup.stories.length - 1);
        setStoryProgress(0);
        setIsPaused(false);
      }
    }
  }, [activeStoryIndex, currentGroupIndex, storyGroups]);

  const handleNext = useCallback(() => {
    if (activeStoryIndex < selectedUserStories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setStoryProgress(0);
      setIsPaused(false);
    } else {
      // Find current user's group index
      const currentUserGroupId = activeStory?.userId;
      const currentGroupIndex = storyGroups.findIndex(
        (g) => g.userId === currentUserGroupId,
      );

      if (
        currentGroupIndex !== -1 &&
        currentGroupIndex < storyGroups.length - 1
      ) {
        // Move to next user's stories
        openUserStories(storyGroups[currentGroupIndex + 1].stories);
      } else {
        // End of all stories
        closeViewer();
      }
    }
  }, [
    activeStory?.userId,
    activeStoryIndex,
    closeViewer,
    openUserStories,
    selectedUserStories.length,
    storyGroups,
  ]);

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

  const handleEditStory = useCallback((story: StoryItem) => {
    // Close viewer state without clearing editingStory to keep update mode stable.
    setIsViewerOpen(false);
    setSelectedUserStories([]);
    setActiveStoryIndex(0);
    setStoryProgress(0);
    setIsPaused(false);
    setEditingStory(story);
    setIsStoryModalOpen(true);
  }, []);

  const handleShowViewers = useCallback(async (storyId: string) => {
    setIsPaused(true);
    const data = await fetchStoryViewers(storyId);
    setViewers(data);
    setIsViewersModalOpen(true);
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
          const nextStories = selectedUserStories.filter(
            (s) => s.id !== storyId,
          );
          setSelectedUserStories(nextStories);
          setActiveStoryIndex((prev) => Math.min(prev, nextStories.length - 1));
        }
      }
    },
    [closeViewer, selectedUserStories],
  );

  const handleStoryCreated = useCallback(
    (apiStory: any) => {
      if (!apiStory) return;
      const newStory = mapStory(apiStory);
      lastLocalUpdateRef.current = Date.now();

      setStoryGroups((prev) => {
        const targetUserId = newStory.userId || currentUserId;

        // Filter out any existing story with the same ID to prevent duplication
        const filteredGroups = prev.map((group) => ({
          ...group,
          stories: group.stories.filter((s) => s.id !== newStory.id),
        }));

        const userGroupIndex = filteredGroups.findIndex(
          (g) => g.userId === targetUserId,
        );
        if (userGroupIndex !== -1) {
          const newGroups = [...filteredGroups];
          const group = newGroups[userGroupIndex];

          newGroups[userGroupIndex] = {
            ...group,
            stories: [
              newStory,
              ...group.stories.filter((s) => s.id !== newStory.id),
            ],
          };
          return newGroups;
        } else {
          return [
            {
              userId: targetUserId!,
              name: newStory.name || currentUserName,
              avatarUrl: newStory.avatarUrl || currentUserAvatar,
              stories: [newStory],
            },
            ...filteredGroups,
          ];
        }
      });

      // Update current viewer state if it's showing the user's stories
      setSelectedUserStories((prev) => {
        const storyIndex = prev.findIndex((s) => s.id === newStory.id);
        if (storyIndex !== -1) {
          const next = [...prev];
          next[storyIndex] = newStory;
          return next;
        }
        return prev;
      });

      // Refresh background data
      loadStories();
    },
    [currentUserId, currentUserName, currentUserAvatar, loadStories],
  );

  useEffect(() => {
    if (!isViewerOpen || !activeStory) return;

    // Track view
    viewStory(activeStory.id, currentUserId);

    setStoryProgress(0);
    setIsPaused(false);
  }, [activeStory, isViewerOpen, currentUserId]);

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
        handleNext();
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("ended", handleEnded);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", handleEnded);
      };
    }

    let lastTime = Date.now();
    const timerId = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      setStoryProgress((prev) => {
        const next = Math.min(1, prev + delta / STORY_DURATION_MS);
        if (next >= 1) {
          window.clearInterval(timerId);
          setTimeout(handleNext, 0);
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(timerId);
  }, [
    activeStory,
    activeStoryIndex,
    isPaused,
    isViewerOpen,
    selectedUserStories.length,
    handleNext,
  ]);

  const ViewersModal = () => {
    if (!isViewersModalOpen) return null;
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              Người xem ({viewers.length})
            </h3>
            <button
              onClick={() => {
                setIsViewersModalOpen(false);
                setIsPaused(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition">
              <X className="size-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {viewers.length === 0 ?
              <p className="text-center text-gray-500 py-10">
                Chưa có ai xem story này.
              </p>
            : viewers.map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-3">
                  <img
                    src={viewer.avatarUrl || avatar}
                    alt={viewer.username}
                    className="size-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {viewer.displayName || viewer.username}
                    </p>
                    <p className="text-xs text-gray-500">@{viewer.username}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <StoryReel
        key={`${currentUserId}-${storyGroups.length}-${suggestedUsers.length}`}
        storyGroups={storyGroups}
        suggestedUsers={suggestedUsers}
        currentUserAvatar={currentUserAvatar}
        currentUserId={currentUserId}
        isLoading={isLoading}
        loadError={loadError}
        onCreateStory={() => setIsStoryModalOpen(true)}
        onOpenUserStories={openUserStories}
      />

      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => {
          setIsStoryModalOpen(false);
          setEditingStory(null);
        }}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        onCreated={handleStoryCreated}
        editingStory={editingStory}
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
        onEditStory={handleEditStory}
        onShowViewers={handleShowViewers}
        currentUserId={currentUserId}
        videoRef={videoRef}
      />

      <ViewersModal />
    </>
  );
};

export default StoryFeed;
