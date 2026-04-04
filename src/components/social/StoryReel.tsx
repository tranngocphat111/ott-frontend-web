import React, { useEffect, useRef, useState } from "react";
import type { StoryItem, StorySuggestedUser, StoryUserGroup } from "./types";
import CreateStoryCard from "./feed/CreateStoryCard";
import StoryGroupCards from "./feed/StoryGroupCards";
import SuggestedFriendCards from "./feed/SuggestedFriendCards";

interface Props {
  storyGroups: StoryUserGroup[];
  suggestedUsers: StorySuggestedUser[];
  currentUserAvatar: string;
  onCreateStory: () => void;
  onOpenUserStories: (userStories: StoryItem[]) => void;
}

const StoryReel: React.FC<Props> = ({
  storyGroups,
  suggestedUsers,
  currentUserAvatar,
  onCreateStory,
  onOpenUserStories,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (suggestedUsers.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;

    const shouldShow = el.scrollWidth <= el.clientWidth + 4;
    if (shouldShow) {
      setShowSuggestions(true);
    }
  }, [storyGroups.length, suggestedUsers.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || suggestedUsers.length === 0 || showSuggestions) return;

    const reachedEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (reachedEnd) {
      setShowSuggestions(true);
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

        <StoryGroupCards
          storyGroups={storyGroups}
          onOpenUserStories={onOpenUserStories}
        />

        {showSuggestions && suggestedUsers.length > 0 && (
          <SuggestedFriendCards users={suggestedUsers} />
        )}
      </div>
    </div>
  );
};

export default StoryReel;
