// src/components/Chat/ChatHeader.tsx
import React from "react";
import { Phone, Video, PanelRightOpen, PanelRightClose } from "lucide-react";
import Avatar from "../common/Avatar";
import type { ChatAreaProps } from "../../interfaces";
import {
  getConversationDisplayAvatar,
  getConversationDisplayName,
} from "../../utils";

interface ChatHeaderProps extends ChatAreaProps {
  // Props từ bản HEAD (Call logic)
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
  disableCallActions?: boolean;
  currentUserId?: string;
  // Props từ bản develop (Sidebar logic)
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onStartVoiceCall,
  onStartVideoCall,
  disableCallActions = false,
  currentUserId,
  isSidebarOpen = false,
  onToggleSidebar,
}) => {
  const getConversationName = (): string => {
    return getConversationDisplayName(conversation, currentUserId);
  };

  const getConversationAvatar = (): string | undefined => {
    return getConversationDisplayAvatar(conversation, currentUserId);
  };

  return (
    <div className="px-6 py-3 bg-white border-b border-gray-100 shadow-sm flex-none z-10">
      <div className="flex items-center justify-between">
        {/* Left Section: Avatar & Info */}
        <div className="flex items-center gap-4">
          <Avatar
            src={getConversationAvatar()}
            name={getConversationName()}
            size={48}
            className="ring-2 ring-white shadow-sm"
          />
          <div>
            <h2 className="font-bold text-gray-800 text-lg line-clamp-1">
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

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1 text-gray-600">
          {/* Voice Call Button */}
          <button
            className="p-2 hover:bg-gray-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onStartVoiceCall}
            disabled={disableCallActions}
            title="Gọi thoại"
          >
            <Phone size={20} />
          </button>

          {/* Video Call Button */}
          <button
            className="p-2 hover:bg-gray-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onStartVideoCall}
            disabled={disableCallActions}
            title="Gọi video"
          >
            <Video size={20} />
          </button>

          {/* Vertical Divider (Optional) */}
          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${
              isSidebarOpen ? "bg-primary-50 text-primary-600" : ""
            }`}
            title={isSidebarOpen ? "Đóng thông tin" : "Mở thông tin"}
          >
            {isSidebarOpen ? (
              <PanelRightClose size={20} />
            ) : (
              <PanelRightOpen size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
