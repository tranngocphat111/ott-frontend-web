import { apiClient, getDeviceInfo } from './client';
import type {
  ApiResponse,
  LocalLoginRequest,
  GoogleAuthRequest,
  CompleteGoogleRegistrationRequest,
  Verify2FARequest,
  Request2FAOtpRequest,
  AuthenticationResponse,
  OtpResponse,
  RefreshRequest,
  LogoutRequest,
  IntrospectRequest,
  IntrospectResponse,
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export const authApi = {
  localLogin: async (data: Omit<LocalLoginRequest, 'deviceId' | 'deviceType' | 'deviceName' | 'deviceInfo' | 'ipAddress' | 'location'>): Promise<ApiResponse<AuthenticationResponse>> => {
    const payload: LocalLoginRequest = {
      ...data,
      ...getDeviceInfo(),
    };
    return apiClient.post(API_ENDPOINTS.AUTH.LOCAL_LOGIN, payload);
  },

  googleAuth: async (data: Omit<GoogleAuthRequest, 'deviceId' | 'deviceType' | 'deviceName' | 'deviceInfo' | 'ipAddress' | 'location'>): Promise<ApiResponse<AuthenticationResponse>> => {
    const payload: GoogleAuthRequest = {
      ...data,
      ...getDeviceInfo(),
    };

    console.log('Calling Google Auth API with:', {
      code: payload.code?.substring(0, 20),
      redirectUri: payload.redirectUri,
      deviceType: payload.deviceType
    });

    return apiClient.post(API_ENDPOINTS.AUTH.GOOGLE_AUTH, payload);
  },

  completeGoogleRegistration: async (data: Omit<CompleteGoogleRegistrationRequest, 'deviceId' | 'deviceType' | 'deviceName' | 'deviceInfo' | 'ipAddress' | 'location'>): Promise<ApiResponse<AuthenticationResponse>> => {
    const payload: CompleteGoogleRegistrationRequest = {
      ...data,
      ...getDeviceInfo(),
    };
    return apiClient.post(API_ENDPOINTS.AUTH.GOOGLE_COMPLETE, payload);
  },

  request2FAOtp: async (data: Request2FAOtpRequest): Promise<ApiResponse<OtpResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.REQUEST_2FA_OTP, data);
  },

  verify2FAOtp: async (data: Omit<Verify2FARequest, 'deviceId' | 'deviceType' | 'deviceInfo' | 'ipAddress'>): Promise<ApiResponse<AuthenticationResponse>> => {
    const payload: Verify2FARequest = {
      ...data,
      ...getDeviceInfo(),
    };
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY_2FA, payload);
  },

  introspect: async (data: IntrospectRequest): Promise<ApiResponse<IntrospectResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.INTROSPECT, data);
  },

  refresh: async (data: RefreshRequest): Promise<ApiResponse<AuthenticationResponse>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.REFRESH, data);
  },

  logout: async (data: LogoutRequest): Promise<ApiResponse<void>> => {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, data);
  },

  requestEmailOtpLogin: async (email: string): Promise<ApiResponse<OtpResponse>> => {
    const payload = {
      email,
      ...getDeviceInfo(),
    };
    return apiClient.post(API_ENDPOINTS.AUTH.REQUEST_EMAIL_OTP_LOGIN, payload);
  },

  verifyEmailOtpLogin: async (data: {
    email: string;
    otpCode: string;
  }): Promise<ApiResponse<AuthenticationResponse>> => {
    const payload = {
      ...data,
      ...getDeviceInfo(),
    };
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL_OTP_LOGIN, payload);
  },

  googleAuthWithToken: async (data: {
    idToken?: string;
    accessToken?: string;
  }): Promise<ApiResponse<AuthenticationResponse>> => {
    const deviceInfo = await getDeviceInfo();
    const payload = {
      ...data,
      ...deviceInfo,
    };
    return apiClient.post(API_ENDPOINTS.AUTH.GOOGLE_AUTH_TOKEN, payload);
  },
};