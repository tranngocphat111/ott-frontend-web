import React from "react";
import { X } from "lucide-react";
import Avatar from "../../../common/Avatar";
import { getConversationDisplayAvatar, getConversationDisplayName } from "../../../../utils";
import type { RecentSearchListProps } from "../../../../types";

const RecentSearchList: React.FC<RecentSearchListProps> = ({
  historyConversations,
  normalizedUserId,
  onOpenConversation,
  onRemoveHistoryItem,
  onClearAllHistory,
}) => {
  return (
    <div className="h-full overflow-y-auto border-t border-gray-100 pb-4">
      <div className="flex items-center justify-between px-4 pt-3">
        <h4 className="text-[16px] font-semibold text-gray-800">Tìm gần đây</h4>
        {historyConversations.length > 0 && (
          <button
            onClick={onClearAllHistory}
            className="cursor-pointer text-[13px] font-medium text-gray-500 hover:text-gray-700"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1 px-2">
        {historyConversations.length === 0 ? (
          <p className="px-3 py-3 text-sm text-gray-500">Chưa có lịch sử tìm kiếm</p>
        ) : (
          historyConversations.map((item) => {
            const displayName =
              getConversationDisplayName(item.conversation, normalizedUserId) ||
              item.conversation.name ||
              "Đoạn chat";

            return (
              <div
                key={item.conversation._id}
                className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50"
              >
                <button
                  onClick={() => onOpenConversation(item.conversation._id)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                >
                  <Avatar
                    src={
                      getConversationDisplayAvatar(
                        item.conversation,
                        normalizedUserId,
                      ) || ""
                    }
                    name={displayName}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {displayName}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => onRemoveHistoryItem(item.conversation._id)}
                  className="cursor-pointer rounded-md p-1.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600"
                  title="Xóa khỏi lịch sử"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentSearchList;
