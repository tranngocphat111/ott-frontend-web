import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavigationSidebar from "../navigation/NavigationSidebar";
import type { MainLayoutProps } from "../../interfaces";

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveItem = () => {
    const [segment] = location.pathname.split("/").filter(Boolean);
    const validItems = new Set([
      "chat",
      "contacts",
      "search",
      "calls",
      "video",
      "notifications",
      "social",
    ]);

    if (segment && validItems.has(segment)) {
      return segment;
    }

    return "chat";
  };

  const handleNavItemClick = (itemId: string) => {
    navigate(`/${itemId}`);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      {/* Navigation Sidebar */}
      <NavigationSidebar
        activeItem={getActiveItem()}
        onItemClick={handleNavItemClick}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
};

export default MainLayout;
