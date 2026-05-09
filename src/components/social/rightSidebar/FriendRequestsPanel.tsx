import React from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import avatar from "../../../assets/avatar.png";
import type { FriendRequestOption } from "../../../services/social.service";

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
  requests: FriendRequestOption[];
  loading: boolean;
  busyRequestId: string | null;
  onAccept: (relationshipId: string) => void;
  onReject: (relationshipId: string) => void;
}

const FriendRequestsPanel: React.FC<Props> = ({
  requests,
  loading,
  busyRequestId,
  onAccept,
  onReject,
}) => {
  const navigate = useNavigate();
  const goProfile = (userId: string) => {
    if (!userId) return;
    navigate(`/social/profile/${userId}`);
  };

  return (
    <div className="border-t border-primary-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-primary-800">Lời mời kết bạn</h3>
        <button className="text-primary-500 font-medium text-sm hover:underline">
          Xem tất cả
        </button>
      </div>
      {loading && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Users className="size-8 text-primary-200" />
          <p className="text-xs text-gray-400">Đang tải lời mời...</p>
        </div>
      )}
      {!loading && requests.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Users className="size-8 text-primary-200" />
          <p className="text-xs text-gray-400">Chưa có lời mời kết bạn nào</p>
        </div>
      )}
      {!loading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => goProfile(req.userId)}
                style={{ backgroundColor: stringToColor(req.name) }}
                className="size-14 rounded-full overflow-hidden shrink-0 shadow focus:outline-none flex items-center justify-center text-white font-bold text-lg">
                {req.avatarUrl ? (
                  <img
                    src={req.avatarUrl}
                    alt={req.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{getInitials(req.name)}</span>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => goProfile(req.userId)}
                  className="font-semibold text-gray-800 text-sm truncate text-left hover:underline">
                  {req.name}
                </button>
                <p className="text-xs text-gray-400 mt-0.5">Vừa gửi lời mời</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => onAccept(req.id)}
                    disabled={busyRequestId === req.id}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-200 text-white py-1.5 rounded-lg text-sm font-medium transition">
                    Xác nhận
                  </button>
                  <button
                    onClick={() => onReject(req.id)}
                    disabled={busyRequestId === req.id}
                    className="flex-1 bg-primary-100 hover:bg-primary-200 disabled:bg-primary-50 text-primary-800 py-1.5 rounded-lg text-sm font-medium transition">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequestsPanel;
