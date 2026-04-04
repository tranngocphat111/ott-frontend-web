import React from "react";
import { Plus } from "lucide-react";
import fallbackAvatar from "../../../assets/avatar.png";

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
    <div className="w-full h-[72%] overflow-hidden">
      <img
        src={currentUserAvatar || fallbackAvatar}
        alt="create"
        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
      />
    </div>
    <div className="absolute bottom-0 left-0 right-0 bg-white flex flex-col items-center pt-5 pb-2">
      <div className="absolute -top-4 size-8 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white shadow">
        <Plus className="size-4 text-white" />
      </div>
      <span className="text-xs font-semibold text-gray-800">Tạo tin</span>
    </div>
  </div>
);

export default CreateStoryCard;
