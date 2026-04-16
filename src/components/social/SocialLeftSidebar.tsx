import React from "react";
import {
  Users,
  Clock,
  Bookmark,
  ChevronDown,
  Clapperboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PostUser } from "./types";
import UserAvatar from "./UserAvatar";

/* Gradient palette cho shortcut icons */
const GRADIENTS = [
  "from-pink-400 to-rose-500",
  "from-violet-400 to-purple-600",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
];

const NAV_ITEMS = [
  // { icon: <Users className="size-6 text-primary-500" />, label: "Bạn bè" },
  { icon: <Clock className="size-6 text-primary-400" />, label: "Kỷ niệm" },
  { icon: <Bookmark className="size-6 text-primary-600" />, label: "Đã lưu" },
  { icon: <Users className="size-6 text-primary-700" />, label: "Nhóm" },
  {
    icon: <Clapperboard className="size-6 text-primary-500" />,
    label: "Reels",
  },
  // { icon: <Store className="size-6 text-primary-400" />, label: "Marketplace" },
];

const SHORTCUTS = ["TỰ HỌC IELTS MỖI NGÀY", "8 Ball Pool", "Farm Heroes Saga"];

interface Props {
  currentUser: PostUser;
}

const SocialLeftSidebar: React.FC<Props> = ({ currentUser }) => {
  const navigate = useNavigate();

  const goToProfile = () => {
    if (currentUser.id) {
      navigate(`/social/profile/${currentUser.id}`);
    }
  };

  return (
    <aside className="w-72 shrink-0 hidden xl:block">
      <div className="sticky top-4">
        {/* Current user */}
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
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-200 cursor-pointer transition">
              {item.icon}
              <span className="font-medium text-gray-700">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary-100 cursor-pointer transition">
            <div className="size-9 bg-primary-100 rounded-full flex items-center justify-center">
              <ChevronDown className="size-5 text-primary-700" />
            </div>
            <span className="font-medium text-primary-800">Xem thêm</span>
          </div>
        </nav>

        {/* Shortcuts */}
        <div className="mt-4 pt-4 border-t border-primary-200">
          <h3 className="text-primary-600 font-semibold px-2 mb-2 text-sm uppercase tracking-wide">
            Lối tắt của bạn
          </h3>
          {SHORTCUTS.map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary-100 cursor-pointer transition">
              <div
                className={`size-9 bg-linear-to-br ${GRADIENTS[i]} rounded-xl shrink-0`}
              />
              <span className="font-medium text-primary-800 text-sm truncate">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SocialLeftSidebar;
