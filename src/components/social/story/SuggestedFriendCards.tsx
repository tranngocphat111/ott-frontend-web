import React from "react";
import { UserPlus } from "lucide-react";
import fallbackAvatar from "../../../assets/avatar.png";
import type { StorySuggestedUser } from "../types";

interface Props {
  users: StorySuggestedUser[];
}

const SuggestedFriendCards: React.FC<Props> = ({ users }) => (
  <>
    {users.map((user) => (
      <div
        key={`suggested-${user.id}`}
        className="shrink-0 w-27.5 h-48 rounded-xl overflow-hidden relative shadow border border-gray-200 bg-white">
        <div className="h-[72%] overflow-hidden bg-gray-100">
          <img
            src={user.avatarUrl ?? fallbackAvatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white px-2 pb-2 pt-1.5">
          <p className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-8">
            {user.name}
          </p>
          <button
            type="button"
            className="mt-1 w-full h-7 rounded-md bg-primary-50 text-primary-700 text-[11px] font-semibold hover:bg-primary-100 transition inline-flex items-center justify-center gap-1">
            <UserPlus className="size-3" />
            Kết bạn
          </button>
        </div>
      </div>
    ))}
  </>
);

export default SuggestedFriendCards;
