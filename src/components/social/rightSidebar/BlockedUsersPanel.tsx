import React from "react";
import { UserX } from "lucide-react";
import avatar from "../../../assets/avatar.png";

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const stringToColor = (str: string) => {
  if (!str) return "#ccc";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

interface BlockedUser {
  id: string; // id của relationship
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
}

interface Props {
  blockedUsers: BlockedUser[];
  loading: boolean;
  busyId: string | null;
  onUnblock: (relationshipId: string) => void;
}

const BlockedUsersPanel: React.FC<Props> = ({ blockedUsers, loading, busyId, onUnblock }) => {
  return (
    <div className="border-t border-primary-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-primary-800">Đã chặn</h3>
      </div>
      {loading && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <UserX className="size-8 text-primary-200" />
          <p className="text-xs text-gray-400">Đang tải...</p>
        </div>
      )}
      {!loading && blockedUsers.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <UserX className="size-8 text-primary-200" />
          <p className="text-xs text-gray-400">Không có người bị chặn</p>
        </div>
      )}
      {!loading && blockedUsers.length > 0 && (
        <div className="space-y-3">
          {blockedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <div
                style={{ backgroundColor: stringToColor(user.receiverName) }}
                className="size-10 rounded-full overflow-hidden shrink-0 shadow flex items-center justify-center text-white font-bold text-sm">
                {user.receiverAvatar ? (
                  <img
                    src={user.receiverAvatar === "/avatar/avatar.png" ? avatar : user.receiverAvatar}
                    alt={user.receiverName}
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{getInitials(user.receiverName)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-800 text-sm truncate text-left">
                  {user.receiverName}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">Bị chặn</p>
              </div>
              <button
                type="button"
                onClick={() => onUnblock(user.id)}
                disabled={busyId === user.id}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {busyId === user.id ? "Đang xử lý..." : "Bỏ chặn"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedUsersPanel;
