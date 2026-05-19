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
import { resolveGatewayBaseUrl } from "../config/runtime";

// 1. Khởi tạo Axios Instance
const adminApiClient = axios.create({
  baseURL: resolveGatewayBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 2. Interceptor tự động nhét Token vào Header
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

const unwrapResponseData = <T>(value: unknown): T => {
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

// 3. Hàm gọi API chung cực kỳ gọn nhẹ nhờ Axios (Xóa bỏ hoàn toàn buildUrl thủ công)
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

// 4. Các Service Methods
export const adminService = {
  getOverview: (timeRange: TimeRange = "allTime") =>
    getJson<OverviewResponse>("/v1/admin/analytics/overview", {
      timeRange,
    }),

  getRecentUsers: (timeRange: TimeRange = "allTime") =>
    getPaginatedItems<UserSummary>(
      "/v1/admin/analytics/users/recent",
      timeRange,
    ),

  getMessageTypes: (timeRange: TimeRange = "allTime") =>
    getJson<MessageTypesResponse>("/v1/admin/analytics/messages/types", {
      timeRange,
    }),

  getLoginMethods: (timeRange: TimeRange = "allTime") =>
    getArrayJson<LoginMethodCount>("/v1/admin/analytics/logins/methods", {
      timeRange,
    }),

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

  getUserDailyTrend: (timeRange: TimeRange = "allTime") =>
    getArrayJson<DailyUserTrendPoint>("/v1/admin/analytics/users/daily-trend", {
      timeRange,
    }),

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
