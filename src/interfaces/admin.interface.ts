export interface OverviewResponse {
  totalUsers: number;
  totalLogins: number;
  totalMessages: number;
  totalPosts: number;
  dau: number;
  mau: number;
  userDelta?: number | null;
  loginDelta?: number | null;
  messageDelta?: number | null;
  postDelta?: number | null;
}

export type TimeRange = "today" | "last7Days" | "last30Days" | "allTime";

export interface UserSummary {
  userId: string;
  email: string | null;
  fullName: string | null;
}

export interface PaginatedRecentUsersResponse {
  items: UserSummary[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
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

export interface LoginMethodCount {
  method: string;
  count: number;
}

export interface DailyUserTrendPoint {
  date: string;
  registrations: number;
  logins: number;
}

export interface AuditLog {
  id: number;
  adminId: string;
  actionType: string;
  targetId: string | null;
  timestamp: string;
}

export interface PaginatedAuditLogsResponse {
  items: AuditLog[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface AdminNavItem {
  label: string;
  path: string;
}
