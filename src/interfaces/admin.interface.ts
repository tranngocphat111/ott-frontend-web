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
  registeredAt?: string | null;
  profileSynced?: boolean;
  isActive?: boolean | null;
  isBlocked?: boolean | null;
  blockedUntil?: string | null;
  blockedReason?: string | null;
  deletedAt?: string | null;
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
  id: string;
  eventId: string;
  adminId: string;
  actionType: string;
  targetUserId: string | null;
  reason: string | null;
  durationMinutes: number | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export type AdminUserStatusAction =
  | "BLOCK"
  | "UNBLOCK"
  | "DEACTIVATE"
  | "RESTORE";

export interface AdminUserStatusRequest {
  actionType: AdminUserStatusAction;
  reason?: string | null;
  durationMinutes?: number | null;
  isPermanent?: boolean | null;
}

export interface AdminUserStatusResponse {
  userId: string;
  accountType: string;
  isActive: boolean;
  isBlocked: boolean;
  blockedUntil: string | null;
  blockedReason: string | null;
  deletedAt: string | null;
  updatedAt: string | null;
}

export interface PaginatedAuditLogsResponse {
  items: AuditLog[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ModerationDashboardResponse {
  totalBannedUsers: number;
  recentLogs: AuditLog[];
  totalContentViolations: number;
  recentContentViolations: ContentViolationLog[];
}

export interface ContentViolationLog {
  id: string;
  violationId: string;
  sourceService: string | null;
  contentType: string | null;
  contentRefId: string | null;
  userId: string | null;
  severity: string | null;
  violationType: string | null;
  matchedLabels: string | null;
  detectedAt: string;
  loggedAt: string;
}

export type ViolationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ModerationRuleCategory =
  | "abuse"
  | "fraud"
  | "security"
  | "profanity"
  | "general";
export type ModerationRuleLanguage = "vi" | "en";

export interface ModerationRule {
  id: string;
  term: string;
  normalizedTerm: string;
  category: ModerationRuleCategory | string;
  language: ModerationRuleLanguage | string;
  severity: ViolationSeverity;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationRuleRequest {
  term: string;
  category: ModerationRuleCategory;
  language: ModerationRuleLanguage;
  severity: ViolationSeverity;
  enabled?: boolean;
}

export interface AdminNavItem {
  label: string;
  path: string;
}
