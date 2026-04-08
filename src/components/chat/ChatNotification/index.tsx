import React from "react";
import { UserPlus, Ban, LogOut, Settings } from "lucide-react";
import type { ChatNotificationProps } from "../../../types/message.type";

export const ChatNotification: React.FC<ChatNotificationProps> = ({
  type,
  content,
}) => {
  const renderIcon = () => {
    switch (type) {
      case "system_add":
        return <UserPlus size={14} className="text-teal-600" />;
      case "system_block":
        return <Ban size={14} className="text-red-500" />;
      case "system_leave":
        return <LogOut size={14} className="text-orange-500" />;
      default:
        return <Settings size={14} className="text-gray-400" />;
    }
  };

  const getBadgeStyles = () => {
    switch (type) {
      case "system_add":
        return "bg-teal-50 border-teal-100 text-teal-700";
      case "system_block":
        return "bg-red-50 border-red-100 text-red-700";
      default:
        return "bg-gray-50 border-gray-100 text-gray-500";
    }
  };

  return (
    <div className="flex justify-center my-2.5 w-full px-6">
      <div
        className={`
        flex items-center gap-2.5 
        px-3.5 py-1.5 
        rounded-full 
        border 
        shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]
        transition-all
        ${getBadgeStyles()}
      `}
      >
        {/* Vòng tròn nhỏ chứa icon để tạo điểm nhấn */}
        <div className="bg-white/80 p-1 rounded-full shadow-sm flex items-center justify-center">
          {renderIcon()}
        </div>

        <span className="text-[12.5px] font-medium tracking-tight">
          {content}
        </span>
      </div>
    </div>
  );
};
