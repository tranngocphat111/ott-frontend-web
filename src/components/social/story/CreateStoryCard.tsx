import React from "react";
import CreateStoryCardFooter from "./CreateStoryCardFooter";
import CreateStoryCardImage from "./CreateStoryCardImage";

interface Props {
  currentUserAvatar: string;
  onClick: () => void;
}

const CreateStoryCard: React.FC<Props> = ({ currentUserAvatar, onClick }) => (
  <div
    className="shrink-0 w-27.5 h-48 rounded-xl overflow-hidden relative cursor-pointer group shadow"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    }}>
    <CreateStoryCardImage currentUserAvatar={currentUserAvatar} />
    <CreateStoryCardFooter />
  </div>
);

export default CreateStoryCard;
