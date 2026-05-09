import React from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import avatar from "../../../assets/avatar.png";
import type { FriendOption } from "../../../services/social.service";

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

interface Props {
  friends: FriendOption[];
  loading: boolean;
}

const FriendsPanel: React.FC<Props> = ({ friends, loading }) => {
  const navigate = useNavigate();
  const goProfile = (userId: string) => {
    if (!userId) return;
    navigate(`/social/profile/${userId}`);
  };

  return (
    <div className="border-t border-primary-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-primary-800">Bạn bè</h3>
        <button className="text-primary-500 font-medium text-sm hover:underline">
          Xem tất cả
        </button>
      </div>
      {loading && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Users className="size-8 text-primary-200" />
          <p className="text-xs text-gray-400">Đang tải bạn bè...</p>
        </div>
      )}
      {!loading && friends.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Users className="size-8 text-primary-200" />
          <p className="text-xs text-gray-400">Chưa có bạn bè</p>
        </div>
      )}
      {!loading && friends.length > 0 && (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => goProfile(friend.id)}
                style={{ backgroundColor: stringToColor(friend.name) }}
                className="size-10 rounded-full overflow-hidden shrink-0 shadow focus:outline-none flex items-center justify-center text-white font-bold text-sm">
                {friend.avatarUrl ? (


                  <img
                    src={friend.avatarUrl === "/avatar/avatar.png" ? avatar : friend.avatarUrl}
                    alt={friend.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{getInitials(friend.name)}</span>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => goProfile(friend.id)}
                  className="font-semibold text-gray-800 text-sm truncate text-left hover:underline">
                  {friend.name}
                  <div>{friend.avatarUrl}</div>
                </button>
                <p className="text-xs text-gray-400 mt-0.5">Bạn bè</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsPanel;
