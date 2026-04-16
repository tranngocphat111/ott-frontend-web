export interface OverviewResponse {
  totalUsers: number;
  totalMessages: number;
  totalPosts: number;
}

export type TimeRange = "today" | "last7Days" | "last30Days" | "allTime";

export interface UserSummary {
  userId: string;
  email: string | null;
  fullName: string | null;
}

export interface MessageTypesResponse {
  text: number;
  image: number;
  voice: number;
}

export interface DailyPostPoint {
  date: string;
  count: number;
}

export interface DailyActivityPoint {
  date: string;
  posts: number;
  messages: number;
}

export interface EventReport {
  title: string;
  value: number;
  color?: string;
}

export interface AdminNavItem {
  label: string;
  path: string;
}
