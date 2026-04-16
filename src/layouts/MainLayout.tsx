import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import NavigationSidebar from '../components/navigation/NavigationSidebar';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get active item from current path
  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/social')) return 'social';
    if (path.includes('/call')) return 'call';
    if (path.includes('/select-user')) return 'select-user';
    return 'chat';
  };

  const [activeItem, setActiveItem] = useState(getActiveItem());

  const handleItemClick = (itemId: string) => {
    if (itemId === 'settings' || itemId === 'profile') {
      // Navigate to settings/profile pages outside MainLayout
      navigate(`/${itemId}`);
    } else {
      setActiveItem(itemId);
      navigate(`/${itemId}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Navigation Sidebar */}
      <NavigationSidebar activeItem={activeItem} onItemClick={handleItemClick} />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
