import React, { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Phone,
  Dribbble,
  Settings,
  User,
  Shield,
  LogOut,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import NavigationItem from "./NavigationItem";
import UserProfile from "./UserProfile";
import logo from "../../assets/logo_tach_nen.jpg";
import type { NavigationItem as NavigationItemType } from "../../interfaces";
interface NavigationSidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeItem = "chat",
  onItemClick,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

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
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowSettingsMenu((value) => !value)}
            className="p-3 text-gray-600 hover:bg-gray-100 hover:text-primary-500 rounded-xl transition-all duration-200"
            title="Cài đặt"
          >
            <Settings className="w-6 h-6" />
          </button>

          {showSettingsMenu && (
            <div className="absolute bottom-12 left-0 z-50 w-52 overflow-hidden rounded-2xl border border-[#ead9cc] bg-white shadow-xl">
              <div className="flex items-center gap-2 border-b border-[#f1e4d7] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f1e4d7] bg-[#fffaf6] shadow-sm">
                  <img src={logo} alt="Riff" className="h-5 w-5 object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#5f432c]">Riff</p>
                  <p className="text-xs text-[#a77c54]">Account menu</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  navigate("/profile");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#6f5136] hover:bg-[#fff7f1]"
              >
                <User size={14} className="text-[#b8895f]" />
                Trang cá nhân
              </button>
              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  navigate("/security/2fa");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#6f5136] hover:bg-[#fff7f1]"
              >
                <Shield size={14} className="text-[#b8895f]" />
                Bảo mật
              </button>
              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#6f5136] hover:bg-[#fff7f1]"
              >
                <MoreVertical size={14} className="text-[#b8895f]" />
                Cài đặt
              </button>

              <div className="my-1 h-px bg-[#f1e4d7]" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#d65b4a] hover:bg-[#fff0ee]"
              >
                <LogOut size={14} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationSidebar;
