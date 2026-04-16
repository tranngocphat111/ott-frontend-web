import React from "react";
import fallbackAvatar from "../../../assets/avatar.png";

interface Props {
  currentUserAvatar: string;
}

const CreateStoryCardImage: React.FC<Props> = ({ currentUserAvatar }) => (
  <div className="w-full h-[72%] overflow-hidden">
    <img
      src={currentUserAvatar || fallbackAvatar}
      alt="create"
      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
    />
  </div>
);

export default CreateStoryCardImage;
