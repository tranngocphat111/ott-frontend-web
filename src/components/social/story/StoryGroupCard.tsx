import React from "react";
import fallbackAvatar from "../../../assets/avatar.png";
import type { StoryItem, StoryUserGroup } from "../types";

interface Props {
  group: StoryUserGroup;
  gradientClass: string;
  onOpenUserStories: (userStories: StoryItem[]) => void;
}

const StoryGroupCard: React.FC<Props> = ({
  group,
  gradientClass,
  onOpenUserStories,
}) => {
  const story = group.stories[0];
  if (!story) return null;

  const storyAvatar = group.avatarUrl ?? story.avatarUrl ?? fallbackAvatar;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenUserStories(group.stories)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenUserStories(group.stories);
        }
      }}
      className="shrink-0 w-27.5 h-48 rounded-xl overflow-hidden relative cursor-pointer group shadow">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
      <img
        src={storyAvatar}
        alt={story.name}
        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition duration-300"
      />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/50" />
      <div className="absolute top-2 left-2 size-9 rounded-full border-[3px] border-primary-400 overflow-hidden shadow">
        <img
          src={storyAvatar}
          alt={story.name}
          className="size-full object-cover"
        />
      </div>
      {story.isBirthday && (
        <div className="absolute top-1 right-1 text-sm">🎂</div>
      )}
      <div className="absolute bottom-2 left-2 right-2">
        <span className="text-white text-xs font-semibold leading-tight line-clamp-2">
          {story.name}
        </span>
      </div>
    </div>
  );
};

export default StoryGroupCard;
