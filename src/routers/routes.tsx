import type { RouteObject } from "react-router-dom";
import ChatPage from "../pages/ChatPage";
import ContactsPage from "../pages/ContactsPage";
import SearchPage from "../pages/SearchPage";
import CallsPage from "../pages/CallsPage";
import VideoPage from "../pages/VideoPage";
import NotificationsPage from "../pages/NotificationsPage";
import SettingsPage from "../pages/SettingsPage";
import SocialPage from "../pages/SocialPage";

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
    element: <SocialPage />,
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
  SOCIAL: "social",
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
