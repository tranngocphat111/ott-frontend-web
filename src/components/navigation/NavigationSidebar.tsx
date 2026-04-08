import React from "react";
import {
  MessageCircle,
  Phone,
  Bell,
  Dribbble,
  Settings,
  User,
} from "lucide-react";
import NavigationItem from "./NavigationItem";
import UserProfile from "./UserProfile";
import type { NavigationItem as NavigationItemType } from "../../interfaces";
interface NavigationSidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeItem = "chat",
  onItemClick,
}) => {
  const navigationItems: NavigationItemType[] = [
    {
      id: "chat",
      icon: <MessageCircle className="w-6 h-6" />,
      label: "Tin nhắn",
      isActive: activeItem === "chat",
    },
    {
      id: "social",
      icon: <Dribbble className="w-6 h-6" />,
      label: "Mạng xã hội",
      isActive: activeItem === "social",
    },
    {
      id: "call",
      icon: <Phone className="w-6 h-6" />,
      label: "Gọi video",
      isActive: activeItem === "call",
    },
  ];

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
      {/* User Avatar với Logout */}
      <UserProfile />

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col space-y-2">
        {navigationItems.map((item) => (
          <NavigationItem key={item.id} item={item} onItemClick={onItemClick} />
        ))}
      </div>

      {/* Profile & Settings */}
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => onItemClick?.("profile")}
          className="p-3 text-gray-600 hover:bg-gray-100 hover:text-primary-500 rounded-xl transition-all duration-200"
          title="Hồ sơ cá nhân"
        >
          <User className="w-6 h-6" />
        </button>
        <button
          onClick={() => onItemClick?.("settings")}
          className="p-3 text-gray-600 hover:bg-gray-100 hover:text-primary-500 rounded-xl transition-all duration-200"
          title="Cài đặt"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default NavigationSidebar;
