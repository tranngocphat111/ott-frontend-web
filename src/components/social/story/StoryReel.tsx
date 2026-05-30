import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StoryItem, StorySuggestedUser, StoryUserGroup } from "../types";
import CreateStoryCard from "./CreateStoryCard";
import StoryGroupCard from "./StoryGroupCard";
import SuggestedFriendCards from "./SuggestedFriendCards";

const GRADIENTS = [
  "from-pink-400 to-rose-500",
  "from-violet-400 to-purple-600",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-primary-400 to-indigo-600",
];

interface Props {
  storyGroups: StoryUserGroup[];
  suggestedUsers: StorySuggestedUser[];
  currentUserAvatar: string;
  currentUserId: string;
  isLoading?: boolean;
  loadError?: string | null;
  onCreateStory: () => void;
  onOpenUserStories: (userStories: StoryItem[]) => void;
}

const StoryReel: React.FC<Props> = ({
  storyGroups,
  suggestedUsers,
  currentUserAvatar,
  currentUserId,
  isLoading = false,
  loadError = null,
  onCreateStory,
  onOpenUserStories,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const combinedItems = useMemo(
    () => [
      ...storyGroups.map((group) => ({ type: "story" as const, group })),
      ...suggestedUsers.map((user) => ({ type: "suggest" as const, user })),
    ],
    [storyGroups, suggestedUsers],
  );

  const visibleItems = combinedItems.slice(0, page * pageSize);
  const hasMore = visibleItems.length < combinedItems.length;
  const showEmptyStoryCard =
    !isLoading && !loadError && combinedItems.length === 0;

  useEffect(() => {
    setPage(1);
  }, [storyGroups.length, suggestedUsers.length]);

  useEffect(() => {
    const storyCount = storyGroups.length;
    const suggestCount = suggestedUsers.length;
    const combinedCount = combinedItems.length;
    const visibleCount = visibleItems.length;
    const visibleStories = visibleItems.filter(
      (item) => item.type === "story",
    ).length;
    const visibleSuggests = visibleItems.filter(
      (item) => item.type === "suggest",
    ).length;

    console.log("[StoryReel] counts", {
      storyCount,
      suggestCount,
      combinedCount,
      page,
      pageSize,
      visibleCount,
      visibleStories,
      visibleSuggests,
      isLoading,
      hasMore,
    });
  }, [
    combinedItems.length,
    hasMore,
    isLoading,
    page,
    pageSize,
    storyGroups.length,
    suggestedUsers.length,
    visibleItems,
  ]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !hasMore) return;

    const reachedEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (reachedEnd) {
      console.log("[StoryReel] reached end", {
        scrollLeft: el.scrollLeft,
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        page,
        pageSize,
        combinedCount: combinedItems.length,
      });
      setPage((prev) =>
        Math.min(prev + 1, Math.ceil(combinedItems.length / pageSize)),
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-3">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {/* Create Story */}
        <CreateStoryCard
          currentUserAvatar={currentUserAvatar}
          onClick={onCreateStory}
        />

        {isLoading ?
          Array.from({ length: pageSize }).map((_, index) => (
            <div
              key={`story-skeleton-${index}`}
              className="shrink-0 w-27.5 h-48 rounded-xl bg-slate-200 animate-pulse"
            />
          ))
        : loadError ?
          <div className="shrink-0 h-48 w-27.5 overflow-hidden rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-center text-sm text-rose-700 flex flex-col items-center justify-center">
            <div className="mb-2 text-base font-black leading-tight">
              Không tải được story
            </div>
            <div className="text-[11px] leading-4 text-rose-600">
              {loadError}
            </div>
          </div>
        : showEmptyStoryCard ?
          <div className="w-full h-48 overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-black text-gray-400 shadow-sm">
              +
            </div>
            <div className="text-base font-black leading-tight text-gray-800">
              Chưa có story
            </div>
            <div className="mt-1 text-[11px] leading-4 text-gray-500">
              Story mới sẽ xuất hiện ở đây.
            </div>
          </div>
        : (() => {
            let storyIndex = -1;
            return visibleItems.map((item, index) => {
              const uniqueKey =
                item.type === "story" ?
                  item.group.userId
                : `suggest-${item.user.id || index}`;

              if (item.type === "story") {
                storyIndex += 1;
                const latestUpdate = Math.max(
                  ...item.group.stories.map((s) => s.lastUpdated || 0),
                );
                return (
                  <StoryGroupCard
                    key={`${uniqueKey}-${latestUpdate}`}
                    group={item.group}
                    gradientClass={GRADIENTS[storyIndex % GRADIENTS.length]}
                    onOpenUserStories={onOpenUserStories}
                  />
                );
              }

              return (
                <div key={uniqueKey}>
                  <SuggestedFriendCards
                    users={[item.user]}
                    currentUserId={currentUserId}
                  />
                </div>
              );
            });
          })()
        }
      </div>
    </div>
  );
};

export default StoryReel;
