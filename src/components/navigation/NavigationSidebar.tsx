import React from 'react';
import { MessageCircle, Users, Settings, Phone, Video, Bell, Search } from 'lucide-react';
import Avatar from '../common/Avatar';

interface NavigationItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

interface NavigationSidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeItem = 'chat',
  onItemClick
}) => {
  const navigationItems: NavigationItem[] = [
    {
      id: 'chat',
      icon: <MessageCircle className="w-6 h-6" />,
      label: 'Tin nhắn',
      isActive: activeItem === 'chat'
    },
    {
      id: 'contacts',
      icon: <Users className="w-6 h-6" />,
      label: 'Danh bạ',
      isActive: activeItem === 'contacts'
    },
    {
      id: 'search',
      icon: <Search className="w-6 h-6" />,
      label: 'Tìm kiếm',
      isActive: activeItem === 'search'
    },
    {
      id: 'calls',
      icon: <Phone className="w-6 h-6" />,
      label: 'Cuộc gọi',
      isActive: activeItem === 'calls'
    },
    {
      id: 'video',
      icon: <Video className="w-6 h-6" />,
      label: 'Video',
      isActive: activeItem === 'video'
    },
    {
      id: 'notifications',
      icon: <Bell className="w-6 h-6" />,
      label: 'Thông báo',
      isActive: activeItem === 'notifications'
    }
  ];

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
      {/* User Avatar */}
      <div className="mb-8">
        <Avatar 
          name="User"
          size={40}
          className="ring-2 ring-[#AE7F53] cursor-pointer hover:ring-4 transition-all"
        />
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item.id)}
            className={`
              relative p-3 rounded-xl transition-all duration-200 group
              ${item.isActive 
                ? 'bg-[#AE7F53] text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-[#AE7F53]'
              }
            `}
            title={item.label}
          >
            {item.icon}
            
            {/* Active indicator */}
            {item.isActive && (
              <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-[#AE7F53] rounded-l-full" />
            )}
          </button>
        ))}
      </div>

      {/* Settings */}
      <button
        onClick={() => onItemClick?.('settings')}
        className="p-3 text-gray-600 hover:bg-gray-100 hover:text-[#AE7F53] rounded-xl transition-all duration-200"
        title="Cài đặt"
      >
        <Settings className="w-6 h-6" />
      </button>
    </div>
  );
};

export default NavigationSidebar;