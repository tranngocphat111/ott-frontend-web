import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
    setIsViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
    setSelectedUserStories([]);
    setActiveStoryIndex(0);
  }, []);

  const activeStory = useMemo(
    () => selectedUserStories[activeStoryIndex] ?? null,
    [activeStoryIndex, selectedUserStories],
  );

  const canGoPrev = activeStoryIndex > 0;
  const canGoNext = activeStoryIndex < selectedUserStories.length - 1;

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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeViewer}
          />

          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black shadow-2xl">
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={activeStory.avatarUrl ?? avatar}
                  alt={activeStory.name}
                  className="size-8 rounded-full border border-white/40 object-cover"
                />
                <div className="text-white text-sm font-semibold">
                  {activeStory.name}
                </div>
              </div>
              <button
                type="button"
                onClick={closeViewer}
                className="size-8 rounded-full bg-black/45 hover:bg-black/65 text-white inline-flex items-center justify-center transition">
                <X className="size-4" />
              </button>
            </div>

            <div className="absolute top-14 left-3 right-3 z-10 h-1 rounded bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: `${((activeStoryIndex + 1) / selectedUserStories.length) * 100}%`,
                }}
              />
            </div>

            <div className="h-[70vh] min-h-120 max-h-170 bg-linear-to-br from-indigo-600 via-blue-500 to-sky-400 flex flex-col items-center justify-center text-center px-8 pt-14 pb-8">
              {activeStory.contentType === "IMAGE" && activeStory.imageUrl ? (
                <img
                  src={activeStory.imageUrl}
                  alt={activeStory.name}
                  className="w-full h-full object-contain"
                />
              ) : activeStory.contentType === "TEXT" && activeStory.textContent ? (
                <div
                  className="w-full h-full flex flex-col items-center justify-center text-center px-8"
                  style={{
                    backgroundColor: activeStory.textBackgroundColor || "#111827",
                  }}>
                  <p className="text-white text-3xl font-bold leading-tight whitespace-pre-wrap wrap-break-word">
                    {activeStory.textContent}
                  </p>
                </div>
              ) : (
                <>
                  {activeStory.isBirthday && (
                    <div className="mb-3 text-3xl">🎂</div>
                  )}
                  <h3 className="text-white text-2xl font-bold leading-tight">
                    {activeStory.name}
                  </h3>
                </>
              )}

              <p className="absolute bottom-6 text-white/80 text-sm">
                Story {activeStoryIndex + 1} / {selectedUserStories.length}
              </p>
            </div>

            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setActiveStoryIndex((prev) => prev - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/45 hover:bg-black/65 disabled:opacity-35 disabled:hover:bg-black/45 text-white inline-flex items-center justify-center transition">
              <ChevronLeft className="size-5" />
            </button>

            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setActiveStoryIndex((prev) => prev + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/45 hover:bg-black/65 disabled:opacity-35 disabled:hover:bg-black/45 text-white inline-flex items-center justify-center transition">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StoryFeed;
