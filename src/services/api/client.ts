import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { type ApiResponse, type ApiError, DeviceType } from '../../types';
import { API_CONFIG } from '../../config/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

apiClient.interceptors.response.use(
  (response) => response.data,

  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const apiError: ApiError = {
      code: error.response?.data?.code ?? error.response?.status ?? 500,
      message: error.response?.data?.message ?? 'An error occurred',
      details: error.response?.data,
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      const publicRoutes = [
        '/password/forgot',
        '/password/forgot/otp/verify',
        '/password/forgot/verify',
        '/auth/login',
        '/auth/register',
      ];

      const isPublicRoute = publicRoutes.some(route =>
        originalRequest.url?.includes(route)
      );

      if (isPublicRoute) {
        return Promise.reject(apiError);
      }

      // Phần còn lại giữ nguyên
      if (!refreshToken) {
        redirectToLogin();
        return Promise.reject(apiError);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient.request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const deviceId = localStorage.getItem('deviceId') ?? undefined;
        const response = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
          `${API_CONFIG.BASE_URL}/auth/refresh`,
          { token: refreshToken, deviceId },
          { headers: API_CONFIG.HEADERS }
        );

        const newToken = response.data.result?.token;
        const newRefreshToken = response.data.result?.refreshToken;

        if (!newToken || !newRefreshToken) {
          throw new Error('Invalid refresh response');
        }

        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        onRefreshed(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        refreshSubscribers = [];
        redirectToLogin();
        return Promise.reject(apiError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(apiError);
  }
);

const redirectToLogin = () => {
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

export const getDeviceType = (): DeviceType => {
  const ua = navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return DeviceType.TABLET;
  }

  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/.test(ua)) {
    return DeviceType.MOBILE;
  }

  return DeviceType.DESKTOP;
};

export const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Edg')) return 'Edge Browser';
  if (ua.includes('Chrome')) return 'Chrome Browser';
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Safari')) return 'Safari Browser';
  return 'Web Browser';
};

export const getDeviceInfo = () => ({
  deviceId: getDeviceId(),
  deviceType: getDeviceType(),
  deviceName: getDeviceName(),
  deviceInfo: navigator.userAgent,
});