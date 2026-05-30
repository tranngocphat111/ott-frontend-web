import type { RouteObject } from "react-router-dom";
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
import AuditLogs from "../pages/admin/AuditLogs";
import AdminLayout from "../components/admin/AdminLayout";
import { RequireAdmin, RequireAuth } from "./guards";

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
      <RequireAdmin>
        <AdminLayout>
          <Dashboard />
        </AdminLayout>
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/moderation",
    element: (
      <RequireAdmin>
        <AdminLayout>
          <ContentModeration />
        </AdminLayout>
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <RequireAdmin>
        <AdminLayout>
          <UserManagement />
        </AdminLayout>
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/audit-logs",
    element: (
      <AdminLayout>
        <AuditLogs />
      </AdminLayout>
    ),
  },
  {
    path: "/call",
    element: <CallPage />,
  },
];

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
  ADMIN_USERS: "/admin/users",
  ADMIN_AUDIT_LOGS: "/admin/audit-logs",
  CALL: "/call",
  SOCIAL_PROFILE: (userId?: string) =>
    userId ? `/social/profile/${userId}` : "/social/profile/:userId",
  SOCIAL_POST: (postId?: string) =>
    postId ? `/social/post/${postId}` : "/social/post/:postId",
  SOCIAL_STORY: (storyId?: string) =>
    storyId ? `/social/story/${storyId}` : "/social/story/:storyId",
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
