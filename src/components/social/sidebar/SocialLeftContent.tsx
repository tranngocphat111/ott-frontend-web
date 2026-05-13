import React from "react";
import {
  Users,
  Clock,
  Bookmark,
  Clapperboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PostUser } from "../types";
import UserAvatar from "../UserAvatar";

const NAV_ITEMS = [
  { icon: <Clock className="size-6 text-primary-400" />, label: "Kỷ niệm" },
  { icon: <Bookmark className="size-6 text-primary-600" />, label: "Đã lưu" },
  { icon: <Users className="size-6 text-primary-700" />, label: "Nhóm" },
  {
    icon: <Clapperboard className="size-6 text-primary-500" />,
    label: "Reels",
  },
];

interface Props {
  currentUser: PostUser;
  onItemClick?: () => void;
}

const SocialLeftContent: React.FC<Props> = ({ currentUser, onItemClick }) => {
  const navigate = useNavigate();

  const goToProfile = () => {
    if (currentUser.id) {
      navigate(`/social/profile/${currentUser.id}`);
      onItemClick?.();
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={goToProfile}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary-100 cursor-pointer mb-1 transition">
        <div className="size-9 rounded-full overflow-hidden ring-2 ring-primary-400 shrink-0">
          <UserAvatar user={currentUser} size="size-9" />
        </div>
        <span className="font-semibold text-gray-800">
          {currentUser.displayName}
        </span>
      </div>

      {/* Nav items */}
      <nav className="space-y-0.5">
        {NAV_ITEMS.map((item, i) => (
          <div
            key={i}
            onClick={() => onItemClick?.()}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-200 cursor-pointer transition">
            {item.icon}
            <span className="font-medium text-gray-700">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default SocialLeftContent;
