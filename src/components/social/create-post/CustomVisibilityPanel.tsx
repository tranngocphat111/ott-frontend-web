import React from "react";
import type { FriendOption } from "../../../services/social.service";

interface CustomVisibilityPanelProps {
  customRuleType: "INCLUDE" | "EXCLUDE";
  onRuleTypeChange: (value: "INCLUDE" | "EXCLUDE") => void;
  friendSearch: string;
  onFriendSearchChange: (value: string) => void;
  friendsLoading: boolean;
  friends: FriendOption[];
  selectedFriendIds: string[];
  onToggleFriend: (id: string) => void;
  customError: string | null;
}

const CustomVisibilityPanel: React.FC<CustomVisibilityPanelProps> = ({
  customRuleType,
  onRuleTypeChange,
  friendSearch,
  onFriendSearchChange,
  friendsLoading,
  friends,
  selectedFriendIds,
  onToggleFriend,
  customError,
}) => {
  return (
    <div className="mx-4 mb-3 border border-gray-200 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">
          Phạm vi tùy chỉnh
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onRuleTypeChange("INCLUDE")}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
              customRuleType === "INCLUDE" ?
                "bg-primary-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Chia sẻ cho
          </button>
          <button
            type="button"
            onClick={() => onRuleTypeChange("EXCLUDE")}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
              customRuleType === "EXCLUDE" ?
                "bg-primary-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Ngoại trừ
          </button>
        </div>
      </div>

      <input
        type="text"
        value={friendSearch}
        onChange={(e) => onFriendSearchChange(e.target.value)}
        placeholder="Tìm bạn bè..."
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200"
      />

      <div className="max-h-40 overflow-y-auto space-y-2">
        {friendsLoading && (
          <div className="text-sm text-gray-500">
            Đang tải danh sách bạn bè...
          </div>
        )}
        {!friendsLoading && friends.length === 0 && (
          <div className="text-sm text-gray-500">Không có bạn bè phù hợp.</div>
        )}
        {!friendsLoading &&
          friends.map((friend) => {
            const isSelected = selectedFriendIds.includes(friend.id);
            return (
              <label
                key={friend.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleFriend(friend.id)}
                  className="size-4"
                />
                <div className="size-8 rounded-full overflow-hidden bg-gray-200">
                  {friend.avatarUrl ?
                    <img
                      src={friend.avatarUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  : <div className="size-full flex items-center justify-center text-xs text-gray-500">
                      {friend.name.slice(0, 1).toUpperCase()}
                    </div>
                  }
                </div>
                <span className="text-sm text-gray-700">{friend.name}</span>
              </label>
            );
          })}
      </div>

      {customError && <p className="text-sm text-red-600">{customError}</p>}
    </div>
  );
};

export default CustomVisibilityPanel;
