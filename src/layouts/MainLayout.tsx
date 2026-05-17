import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import NavigationSidebar from '../components/navigation/NavigationSidebar';

const resolveActiveItem = (path: string) => {
  if (path.includes('/chat')) return 'chat';
  if (path.includes('/social')) return 'social';
  if (path.includes('/call')) return 'call';
  return 'chat';
};

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get active item from current path
  const [activeItem, setActiveItem] = useState(() =>
    resolveActiveItem(location.pathname),
  );

  useEffect(() => {
    setActiveItem(resolveActiveItem(location.pathname));
  }, [location.pathname]);

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
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-gray-100">
      {/* Navigation Sidebar */}
      <NavigationSidebar activeItem={activeItem} onItemClick={handleItemClick} />

      {/* Main Content */}
      <div className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
