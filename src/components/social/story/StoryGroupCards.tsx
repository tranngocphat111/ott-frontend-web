import React from "react";
import type { StoryItem, StoryUserGroup } from "../types";
import StoryGroupCard from "./StoryGroupCard";

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
  onOpenUserStories: (userStories: StoryItem[]) => void;
}

const StoryGroupCards: React.FC<Props> = ({
  storyGroups,
  onOpenUserStories,
}) => (
  <>
    {storyGroups.map((group, i) => (
      <StoryGroupCard
        key={group.userId}
        group={group}
        gradientClass={GRADIENTS[i % GRADIENTS.length]}
        onOpenUserStories={onOpenUserStories}
      />
    ))}
  </>
);

export default StoryGroupCards;
