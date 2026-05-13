import React from "react";
import { Image, Smile, Video } from "lucide-react";
import type { PostUser } from "./types";
import UserAvatar from "./UserAvatar";

interface Props {
  currentUser: PostUser;
  onOpenModal: () => void;
  onOpenWithFeeling?: () => void;
}

const CreatePostCard: React.FC<Props> = ({
  currentUser,
  onOpenModal,
  onOpenWithFeeling,
}) => (
  <div className="bg-white rounded-2xl shadow-sm p-3">
    <div className="flex items-center gap-3 mb-3">
      <div className="size-10 rounded-full overflow-hidden shrink-0 ring-2 ring-primary-400">
        <UserAvatar user={currentUser} size="size-10" />
      </div>
      <button
        onClick={onOpenModal}
        className="flex-1 bg-primary-50 hover:bg-primary-100 rounded-full px-4 py-2 cursor-pointer text-primary-400 transition select-none text-left text-sm">
        {currentUser.displayName?.split(" ").pop()} ơi, bạn đang nghĩ gì vậy?
      </button>
    </div>
    <div className="border-t border-primary-100 pt-2 flex">
      <button
        onClick={onOpenModal}
        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-primary-50 transition text-primary-700">
        <Video className="size-5 text-primary-500" />
        <span className="text-sm font-medium">Live</span>
      </button>
      <button
        onClick={onOpenModal}
        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-primary-50 transition text-primary-700">
        <Image className="size-5 text-green-500" />
        <span className="text-sm font-medium">Ảnh / Video</span>
      </button>
      <button
        onClick={onOpenWithFeeling ?? onOpenModal}
        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-primary-50 transition text-primary-700">
        <Smile className="size-5 text-yellow-500" />
        <span className="text-sm font-medium hidden sm:inline">Cảm xúc</span>
      </button>
    </div>
  </div>
);

export default CreatePostCard;
