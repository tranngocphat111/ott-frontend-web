import React, { useMemo } from "react";
import {
  MessageCircle,
  Dribbble,
} from "lucide-react";
import { useConversations } from "../../contexts/ConversationsContext";
import {
  getParticipantUnreadCount,
  isConversationMuted,
} from "../../utils/conversationNotification";
import NavigationItem from "./NavigationItem";
import UserProfile from "./UserProfile";
import NotificationMenu from "./NotificationMenu";
import type { NavigationItem as NavigationItemType } from "../../interfaces";
interface NavigationSidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeItem = "chat",
  onItemClick,
}) => {
  const { conversations } = useConversations();

  const chatUnreadCount = useMemo(
    () =>
      conversations.reduce((total, item) => {
        if (isConversationMuted(item.participant)) return total;
        return total + getParticipantUnreadCount(item.participant);
      }, 0),
    [conversations],
  );

  const navigationItems: NavigationItemType[] = [
    {
      id: "chat",
      icon: <MessageCircle className="w-6 h-6" />,
      label: "Tin nhắn",
      isActive: activeItem === "chat",
      badge: chatUnreadCount,
    },
    {
      id: "social",
      icon: <Dribbble className="w-6 h-6" />,
      label: "Mạng xã hội",
      isActive: activeItem === "social",
    },
  ];

  return (
    <div className="relative z-30 flex h-full w-16 shrink-0 flex-col items-center overflow-visible border-r border-gray-200 bg-white py-4">
      {/* User Avatar với Logout */}
      <UserProfile />

      {/* Navigation Items */}
      <div className="mt-8 flex flex-col space-y-2">
        {navigationItems.map((item) => (
          <NavigationItem key={item.id} item={item} onItemClick={onItemClick} />
        ))}
        <NotificationMenu />
      </div>

      <div className="flex-1" />
    </div>
  );
};

export default NavigationSidebar;
