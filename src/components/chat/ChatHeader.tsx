import React from "react";
import { Phone, Video, MoreVertical } from "lucide-react";
import Avatar from "../common/Avatar";
import type { ChatAreaProps } from "../../interfaces";

export const ChatHeader: React.FC<ChatAreaProps> = ({ conversation }) => {
  const getConversationName = (): string => {
    if (conversation.name) return conversation.name;
    if (conversation.type === "private" && conversation.participants?.length) {
      return conversation.participants[0].display_name;
    }
    return "Hội thoại";
  };

  const getConversationAvatar = (): string | undefined => {
    if (conversation.avatar) return conversation.avatar;
    if (conversation.type === "private" && conversation.participants?.length) {
      return conversation.participants[0].avatar;
    }
    return undefined;
  };

  return (
    <div className="px-6 py-3 bg-white border-b border-gray-100 shadow-sm flex-none z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            src={getConversationAvatar()}
            name={getConversationName()}
            size={48}
            className="ring-2 ring-white shadow-sm"
          />
          <div>
            <h2 className="font-bold text-gray-800 text-lg">
              {getConversationName()}
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-xs text-green-600 font-medium">
                Đang hoạt động
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 text-gray-600">
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <Video size={20} />
          </button>
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
