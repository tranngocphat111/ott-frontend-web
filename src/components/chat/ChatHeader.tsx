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
  hideCallActions?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onStartVoiceCall,
  onStartVideoCall,
  disableCallActions = false,
  currentUserId,
  isSidebarOpen = false,
  onToggleSidebar,
  hideCallActions = false,
}) => {
  const getConversationName = (): string => {
    return getConversationDisplayName(conversation, currentUserId);
  };

  const getConversationAvatar = (): string | undefined => {
    return getConversationDisplayAvatar(conversation, currentUserId);
  };

  return (
    <div className="relative flex-none z-10">
      <div className="px-6 py-3 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between">
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
          {!hideCallActions && (
            <>
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
            </>
          )}

          {/* Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${isSidebarOpen ? "bg-primary-50 text-primary-600" : ""
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

      {/* Active Call Banner (Group Call) */}
      {conversation.type === "group" && conversation.is_calling && (
        <div className="px-6 py-2 bg-emerald-50/80 backdrop-blur-md border-b border-emerald-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Video size={16} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <p className="text-[13px] font-bold text-emerald-700">Cuộc gọi video nhóm</p>
              <p className="text-[11px] text-emerald-600/80 font-medium">
                {conversation.call_participant_count || 1} người đang tham gia
              </p>
            </div>
          </div>
          <button
            onClick={onStartVideoCall}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-95"
          >
            Tham gia
          </button>
        </div>
      )}
    </div>
  );
};
