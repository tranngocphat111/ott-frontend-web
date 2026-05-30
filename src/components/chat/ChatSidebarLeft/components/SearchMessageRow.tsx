import React from "react";
import Avatar from "../../../common/Avatar";
import { getFullUrl, parseBackendDate } from "../../../../utils";
import type { SearchMessageRowProps } from "../../../../types";

const SearchMessageRow: React.FC<SearchMessageRowProps> = ({
  msg,
  conversationMetaMap,
  onOpenConversation,
  highlightKeyword,
}) => {
  const conversationMeta = conversationMetaMap.get(msg.conversation_id);
  const senderDisplayName =
    conversationMeta?.senderNameById?.[msg.sender_id] ||
    msg.sender_name ||
    msg.sender_id;

  return (
    <button
      key={msg._id}
      onClick={() =>
        onOpenConversation(msg.conversation_id, msg.msg_id || msg._id)
      }
      className="w-full cursor-pointer rounded-lg px-2 py-2 text-left hover:bg-gray-50"
    >
      <div className="flex items-center gap-2.5">
        <Avatar
          src={getFullUrl(conversationMeta?.avatar || "")}
          name={conversationMeta?.name || "Đoạn chat"}
          size={40}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between text-xs text-gray-500">
            <span className="truncate font-medium text-gray-600">
              {conversationMeta?.name || "Đoạn chat"}
            </span>
            <span>
              {msg.createdAt
                ? parseBackendDate(msg.createdAt)?.toLocaleDateString("vi-VN") || ""
                : ""}
            </span>
          </div>

          <p className="mb-1 line-clamp-2 text-[15px] text-gray-800">
            {!(msg.preview || "").toLowerCase().trim().startsWith((senderDisplayName || "").toLowerCase().trim()) && (
              <span className="font-medium text-gray-700">{senderDisplayName}:</span>
            )}{" "}
            {highlightKeyword(msg.preview)}
          </p>
        </div>
      </div>
    </button>
  );
};

export default SearchMessageRow;
