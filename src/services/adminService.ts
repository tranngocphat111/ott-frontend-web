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
  PaginatedRecentUsersResponse,
  TimeRange,
  UserSummary,
} from "../interfaces/admin.interface";

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");
const stripRiffApiSuffix = (url: string) =>
  normalizeBaseUrl(url).replace(/\/riff\/api$/i, "");

const resolveGatewayBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  if (!apiUrl) {
    return "http://localhost:8080";
  }

  return stripRiffApiSuffix(apiUrl);
};

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

// 3. Hàm gọi API chung cực kỳ gọn nhẹ nhờ Axios (Xóa bỏ hoàn toàn buildUrl thủ công)
async function getJson<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  try {
    const response = await adminApiClient.get<T>(path, { params });
    return response.data;
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
  const response = await getJson<PaginatedResponse<T>>(path, { timeRange });
  return response.items;
}

function isNotFoundError(error: unknown): error is AdminApiError {
  return error instanceof AdminApiError && error.status === 404;
}

// 4. Các Service Methods
export const adminService = {
  getOverview: (timeRange: TimeRange = "allTime") =>
    getJson<OverviewResponse>("/api/v1/admin/analytics/overview", {
      timeRange,
    }),

  getRecentUsers: (timeRange: TimeRange = "allTime") =>
    getPaginatedItems<UserSummary>(
      "/api/v1/admin/analytics/users/recent",
      timeRange,
    ),

  getMessageTypes: (timeRange: TimeRange = "allTime") =>
    getJson<MessageTypesResponse>("/api/v1/admin/analytics/messages/types", {
      timeRange,
    }),

  getLoginMethods: (timeRange: TimeRange = "allTime") =>
    getJson<LoginMethodCount[]>("/api/v1/admin/analytics/logins/methods", {
      timeRange,
    }),

  getRecentUsersPage: (
    timeRange: TimeRange = "allTime",
    params?: { query?: string; page?: number; size?: number },
  ) =>
    getJson<PaginatedRecentUsersResponse>(
      "/api/v1/admin/analytics/users/recent",
      {
        timeRange,
        query: params?.query,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    ),

  getUserDailyTrend: (timeRange: TimeRange = "allTime") =>
    getJson<DailyUserTrendPoint[]>(
      "/api/v1/admin/analytics/users/daily-trend",
      { timeRange },
    ),

  getDailyActivity: async (timeRange: TimeRange = "allTime") => {
    try {
      return await getJson<DailyActivityPoint[]>(
        "/api/v1/admin/analytics/social/activity/daily",
        { timeRange },
      );
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const legacyPosts = await getJson<DailyPostPoint[]>(
        "/api/v1/admin/analytics/social/posts/daily",
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
    getJson<DailyPostPoint[]>("/api/v1/admin/analytics/social/posts/daily", {
      timeRange,
    }),

  getAuditLogsPage: (params?: { page?: number; size?: number }) =>
    getJson<PaginatedAuditLogsResponse>("/api/v1/admin/analytics/audit-logs", {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    }),

  getModerationDashboard: () =>
    getJson<ModerationDashboardResponse>(
      "/api/v1/analytics/moderation/dashboard",
    ),
};
