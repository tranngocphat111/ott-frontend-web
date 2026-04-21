import React from "react";
import Avatar from "../../../common/Avatar";
import { getFullUrl } from "../../../../utils";
import type { SearchConversationsSectionProps } from "../../../../types";

const SearchConversationsSection: React.FC<SearchConversationsSectionProps> = ({
  conversations,
  searchTab,
  onOpenConversation,
  highlightKeyword,
}) => {
  if (conversations.length === 0) return null;

  return (
    <section className="px-2">
      <h4 className="mb-2 text-sm font-semibold text-gray-800">
        Trò chuyện ({conversations.length})
      </h4>
      <div className="space-y-1">
        {conversations
          .slice(0, searchTab === "all" ? 3 : 20)
          .map((conv) => (
            <button
              key={conv.conversation_id}
              onClick={() => onOpenConversation(conv.conversation_id)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-gray-50"
            >
              <Avatar src={getFullUrl(conv.avatar || "")} name={conv.name || "Nhóm"} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {highlightKeyword(conv.name || "Đoạn chat")}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {highlightKeyword(conv.last_message?.content || "Chưa có tin nhắn")}
                </p>
              </div>
            </button>
          ))}
      </div>
    </section>
  );
};

export default SearchConversationsSection;
