import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import ChatPage from "../pages/ChatPage";
import ContactsPage from "../pages/ContactsPage";
import SearchPage from "../pages/SearchPage";
import CallsPage from "../pages/CallsPage";
import VideoPage from "../pages/VideoPage";
import NotificationsPage from "../pages/NotificationsPage";
import SettingsPage from "../pages/SettingsPage";
import SocialPage from "../pages/SocialPage";
import CallPage from "../pages/CallPage";
import { SocialProfile } from "../pages/social";
import Dashboard from "../pages/admin/Dashboard";
import ContentModeration from "../pages/admin/ContentModeration";
import UserManagement from "../pages/admin/UserManagement";
import AdminLayout from "../components/admin/AdminLayout";
import { useAuth } from "../contexts/AuthContext";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * Application route configuration
 * Centralized route definitions for better maintainability
 */
export const routes: RouteObject[] = [
  {
    path: "/chat",
    element: <ChatPage />,
  },
  {
    path: "/contacts",
    element: <ContactsPage />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
  {
    path: "/calls",
    element: <CallsPage />,
  },
  {
    path: "/video",
    element: <VideoPage />,
  },
  {
    path: "/notifications",
    element: <NotificationsPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/social",
    element: (
      <RequireAuth>
        <SocialPage />
      </RequireAuth>
    ),
  },
  {
    path: "/social/*",
    element: (
      <RequireAuth>
        <SocialPage />
      </RequireAuth>
    ),
  },
  {
    path: "/social/profile/:userId",
    element: (
      <RequireAuth>
        <SocialProfile />
      </RequireAuth>
    ),
  },
  {
    path: "/admin",
    element: (
      <AdminLayout>
        <Dashboard />
      </AdminLayout>
    ),
  },
  {
    path: "/admin/moderation",
    element: (
      <AdminLayout>
        <ContentModeration />
      </AdminLayout>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <AdminLayout>
        <UserManagement />
      </AdminLayout>
    ),
  },
  {
    path: "/call",
    element: <CallPage />,
  },
];

/**
 * Route paths constants for type-safe navigation
 */
export const ROUTE_PATHS = {
  CHAT: "/chat",
  CONTACTS: "/contacts",
  SEARCH: "/search",
  CALLS: "/calls",
  VIDEO: "/video",
  NOTIFICATIONS: "/notifications",
  SETTINGS: "/settings",
  SOCIAL: "/social",
  ADMIN: "/admin",
  ADMIN_MODERATION: "/admin/moderation",
  CALL: "/call",
  SOCIAL_PROFILE: (userId?: string) => userId ? `/social/profile/${userId}` : "/social/profile",
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
