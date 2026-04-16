import type {
  DailyActivityPoint,
  DailyPostPoint,
  MessageTypesResponse,
  OverviewResponse,
  TimeRange,
  UserSummary,
} from "../interfaces/admin.interface";

const ADMIN_ANALYTIC_BASE_URL = "http://localhost:8090";

class AdminApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AdminApiError";
  }
}

function buildUrl(path: string, timeRange?: TimeRange) {
  const url = new URL(`${ADMIN_ANALYTIC_BASE_URL}${path}`);

  if (timeRange) {
    url.searchParams.set("timeRange", timeRange);
  }

  return url.toString();
}

async function getJson<T>(path: string, timeRange?: TimeRange): Promise<T> {
  const response = await fetch(buildUrl(path, timeRange), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
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
    getJson<OverviewResponse>("/api/v1/admin/analytics/overview", timeRange),

  getRecentUsers: (timeRange: TimeRange = "allTime") =>
    getJson<UserSummary[]>("/api/v1/admin/analytics/users/recent", timeRange),

  getMessageTypes: (timeRange: TimeRange = "allTime") =>
    getJson<MessageTypesResponse>(
      "/api/v1/admin/analytics/messages/types",
      timeRange,
    ),

  getDailyActivity: async (timeRange: TimeRange = "allTime") => {
    try {
      return await getJson<DailyActivityPoint[]>(
        "/api/v1/admin/analytics/social/activity/daily",
        timeRange,
      );
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const legacyPosts = await getJson<DailyPostPoint[]>(
        "/api/v1/admin/analytics/social/posts/daily",
        timeRange,
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
      "/api/v1/admin/analytics/social/posts/daily",
      timeRange,
    ),
};
