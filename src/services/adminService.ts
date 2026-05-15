import type {
  DailyActivityPoint,
  DailyPostPoint,
  DailyUserTrendPoint,
  LoginMethodCount,
  MessageTypesResponse,
  ModerationDashboardResponse,
  OverviewResponse,
  PaginatedAuditLogsResponse,
  PaginatedRecentUsersResponse,
  TimeRange,
  UserSummary,
} from "../interfaces/admin.interface";

const ADMIN_ANALYTIC_BASE_URL =
  import.meta.env.VITE_ADMIN_ANALYTIC_BASE_URL || "http://localhost:8092";

class AdminApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AdminApiError";
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function buildUrl(path: string, timeRange?: TimeRange) {
  const url = new URL(`${normalizeBaseUrl(ADMIN_ANALYTIC_BASE_URL)}${path}`);

  if (timeRange) {
    url.searchParams.set("timeRange", timeRange);
  }

  return url.toString();
}

function buildUrlWithParams(
  path: string,
  params?: Record<string, string | number | undefined>,
) {
  const url = new URL(`${normalizeBaseUrl(ADMIN_ANALYTIC_BASE_URL)}${path}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function getJson<T>(url: string): Promise<T> {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new AdminApiError(
      response.status,
      `Request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

function isNotFoundError(error: unknown): error is AdminApiError {
  return error instanceof AdminApiError && error.status === 404;
}

export const adminService = {
  getOverview: (timeRange: TimeRange = "allTime") =>
    getJson<OverviewResponse>(
      buildUrl("/api/v1/admin/analytics/overview", timeRange),
    ),

  getRecentUsers: (timeRange: TimeRange = "allTime") =>
    getJson<UserSummary[]>(
      buildUrl("/api/v1/admin/analytics/users/recent", timeRange),
    ),

  getMessageTypes: (timeRange: TimeRange = "allTime") =>
    getJson<MessageTypesResponse>(
      buildUrl("/api/v1/admin/analytics/messages/types", timeRange),
    ),

  getLoginMethods: (timeRange: TimeRange = "allTime") =>
    getJson<LoginMethodCount[]>(
      buildUrl("/api/v1/admin/analytics/logins/methods", timeRange),
    ),

  getRecentUsersPage: (
    timeRange: TimeRange = "allTime",
    params?: { query?: string; page?: number; size?: number },
  ) =>
    getJson<PaginatedRecentUsersResponse>(
      buildUrlWithParams("/api/v1/admin/analytics/users/recent", {
        timeRange,
        query: params?.query,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      }),
    ),

  getUserDailyTrend: (timeRange: TimeRange = "allTime") =>
    getJson<DailyUserTrendPoint[]>(
      buildUrl("/api/v1/admin/analytics/users/daily-trend", timeRange),
    ),

  getDailyActivity: async (timeRange: TimeRange = "allTime") => {
    try {
      return await getJson<DailyActivityPoint[]>(
        buildUrl("/api/v1/admin/analytics/social/activity/daily", timeRange),
      );
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const legacyPosts = await getJson<DailyPostPoint[]>(
        buildUrl("/api/v1/admin/analytics/social/posts/daily", timeRange),
      );

      return legacyPosts.map((item) => ({
        date: item.date,
        posts: item.count,
        messages: 0,
      }));
    }
  },

  getDailyPosts: (timeRange: TimeRange = "allTime") =>
    getJson<DailyPostPoint[]>(
      buildUrl("/api/v1/admin/analytics/social/posts/daily", timeRange),
    ),

  getAuditLogsPage: (params?: { page?: number; size?: number }) =>
    getJson<PaginatedAuditLogsResponse>(
      buildUrlWithParams("/api/v1/admin/analytics/audit-logs", {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      }),
    ),

  getModerationDashboard: () =>
    getJson<ModerationDashboardResponse>(
      buildUrl("/api/v1/analytics/moderation/dashboard"),
    ),
};
