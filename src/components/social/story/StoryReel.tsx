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
  onCreateStory: () => void;
  onOpenUserStories: (userStories: StoryItem[]) => void;
}

const StoryReel: React.FC<Props> = ({
  storyGroups,
  suggestedUsers,
  currentUserAvatar,
  currentUserId,
  isLoading = false,
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
        : (() => {
            let storyIndex = -1;
            return visibleItems.map((item, index) => {
              const uniqueKey =
                item.type === "story" ? item.group.userId
                : `suggest-${item.user.id || index}`;

              if (item.type === "story") {
                storyIndex += 1;
                return (
                  <StoryGroupCard
                    key={uniqueKey}
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
