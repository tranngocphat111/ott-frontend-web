import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type {
  DailyActivityPoint,
  DailyPostPoint,
  DailyUserTrendPoint,
  LoginMethodCount,
  MessageTypesResponse,
  ModerationDashboardResponse,
  OverviewResponse,
  PaginatedAuditLogsResponse,
  TimeRange,
  UserSummary,
} from "../interfaces/admin.interface";
import { resolveApiBaseUrl } from "../config/runtime";

const adminApiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

adminApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
);

class AdminApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AdminApiError";
  }
}

interface PaginatedResponse<T> {
  items: T[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const toNullableFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = toFiniteNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const unwrapResponseData = <T>(value: unknown): T => {
  if (typeof value === "string") {
    throw new AdminApiError(502, "Analytics API returned a non-JSON response");
  }

  if (!isRecord(value)) {
    return value as T;
  }

  if ("data" in value) {
    return value.data as T;
  }

  if ("result" in value) {
    return value.result as T;
  }

  if ("payload" in value) {
    return value.payload as T;
  }

  return value as T;
};

const normalizeOverviewResponse = (value: unknown): OverviewResponse => {
  const record = isRecord(value) ? value : {};

  return {
    totalUsers: toFiniteNumber(record.totalUsers),
    totalLogins: toFiniteNumber(record.totalLogins),
    totalMessages: toFiniteNumber(record.totalMessages),
    totalPosts: toFiniteNumber(record.totalPosts),
    dau: toFiniteNumber(record.dau),
    mau: toFiniteNumber(record.mau),
    userDelta: toNullableFiniteNumber(record.userDelta),
    loginDelta: toNullableFiniteNumber(record.loginDelta),
    messageDelta: toNullableFiniteNumber(record.messageDelta),
    postDelta: toNullableFiniteNumber(record.postDelta),
  };
};

const normalizeMessageTypesResponse = (value: unknown): MessageTypesResponse => {
  const record = isRecord(value) ? value : {};

  return {
    text: toFiniteNumber(record.text),
    image: toFiniteNumber(record.image),
    voice: toFiniteNumber(record.voice),
  };
};

const normalizeLoginMethodCount = (value: unknown): LoginMethodCount => {
  const record = isRecord(value) ? value : {};

  return {
    method:
      typeof record.method === "string" && record.method.trim() !== ""
        ? record.method
        : "unknown",
    count: toFiniteNumber(record.count),
  };
};

const normalizeDailyUserTrendPoint = (value: unknown): DailyUserTrendPoint => {
  const record = isRecord(value) ? value : {};

  return {
    date: typeof record.date === "string" ? record.date : "",
    registrations: toFiniteNumber(record.registrations),
    logins: toFiniteNumber(record.logins),
  };
};

const asArray = <T>(value: unknown): T[] => {
  const unwrapped = unwrapResponseData<unknown>(value);
  return Array.isArray(unwrapped) ? unwrapped : [];
};

const asPaginatedResponse = <T>(value: unknown): PaginatedResponse<T> => {
  const unwrapped = unwrapResponseData<unknown>(value);
  const record = isRecord(unwrapped) ? unwrapped : {};
  const items = Array.isArray(record.items) ? (record.items as T[]) : [];

  return {
    items,
    totalElements:
      typeof record.totalElements === "number" ? record.totalElements : items.length,
    page: typeof record.page === "number" ? record.page : 0,
    size: typeof record.size === "number" ? record.size : items.length,
    totalPages: typeof record.totalPages === "number" ? record.totalPages : 1,
  };
};

async function getJson<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  try {
    const response = await adminApiClient.get<unknown>(path, { params });
    return unwrapResponseData<T>(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const status = axiosError.response?.status ?? 500;
    throw new AdminApiError(
      status,
      axiosError.response?.data?.message ??
        `Request failed with status ${status}`,
    );
  }
}

async function getPaginatedItems<T>(
  path: string,
  timeRange?: TimeRange,
): Promise<T[]> {
  const response = await getJson<unknown>(path, { timeRange });
  return asPaginatedResponse<T>(response).items;
}

async function getArrayJson<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T[]> {
  const response = await getJson<unknown>(path, params);
  return asArray<T>(response);
}

function isNotFoundError(error: unknown): error is AdminApiError {
  return error instanceof AdminApiError && error.status === 404;
}

export const adminService = {
  getOverview: async (timeRange: TimeRange = "allTime") => {
    const response = await getJson<unknown>("/v1/admin/analytics/overview", {
      timeRange,
    });

    return normalizeOverviewResponse(response);
  },

  getRecentUsers: (timeRange: TimeRange = "allTime") =>
    getPaginatedItems<UserSummary>(
      "/v1/admin/analytics/users/recent",
      timeRange,
    ),

  getMessageTypes: async (timeRange: TimeRange = "allTime") => {
    const response = await getJson<unknown>("/v1/admin/analytics/messages/types", {
      timeRange,
    });

    return normalizeMessageTypesResponse(response);
  },

  getLoginMethods: async (timeRange: TimeRange = "allTime") => {
    const response = await getArrayJson<unknown>("/v1/admin/analytics/logins/methods", {
      timeRange,
    });

    return response.map(normalizeLoginMethodCount);
  },

  getRecentUsersPage: (
    timeRange: TimeRange = "allTime",
    params?: { query?: string; page?: number; size?: number },
  ) =>
    getJson<unknown>("/v1/admin/analytics/users/recent", {
      timeRange,
      query: params?.query,
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    }).then(asPaginatedResponse<UserSummary>),

  getUserDailyTrend: async (timeRange: TimeRange = "allTime") => {
    const response = await getArrayJson<unknown>(
      "/v1/admin/analytics/users/daily-trend",
      {
        timeRange,
      },
    );

    return response.map(normalizeDailyUserTrendPoint);
  },

  getDailyActivity: async (timeRange: TimeRange = "allTime") => {
    try {
      return await getArrayJson<DailyActivityPoint>(
        "/v1/admin/analytics/social/activity/daily",
        { timeRange },
      );
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const legacyPosts = await getArrayJson<DailyPostPoint>(
        "/v1/admin/analytics/social/posts/daily",
        { timeRange },
      );

      return legacyPosts.map((item) => ({
        date: item.date,
        posts: item.count,
        messages: 0,
      }));
    }
  },

  getDailyPosts: (timeRange: TimeRange = "allTime") =>
    getArrayJson<DailyPostPoint>("/v1/admin/analytics/social/posts/daily", {
      timeRange,
    }),

  getAuditLogsPage: (params?: { page?: number; size?: number }) =>
    getJson<unknown>("/v1/admin/analytics/audit-logs", {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    }).then(asPaginatedResponse<PaginatedAuditLogsResponse["items"][number]>),

  getModerationDashboard: async () => {
    const response = await getJson<Partial<ModerationDashboardResponse>>(
      "/v1/analytics/moderation/dashboard",
    );

    return {
      totalBannedUsers:
        typeof response.totalBannedUsers === "number"
          ? response.totalBannedUsers
          : 0,
      recentLogs: Array.isArray(response.recentLogs) ? response.recentLogs : [],
    };
  },
};
