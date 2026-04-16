import { apiClient } from './client';
import type {
  ApiResponse,
  OtpResponse,
  RequestPhoneOtpRequest,
  RequestEmailOtpRequest,
} from '../../types';

export const otpApi = {

  requestRegisterPhoneOtp: async (phone: string): Promise<ApiResponse<OtpResponse>> => {
    const payload: RequestPhoneOtpRequest = { phone };
    return apiClient.post('/otp/register/phone', payload);
  },

  requestLinkPhoneOtp: async (phone: string): Promise<ApiResponse<OtpResponse>> => {
    const payload: RequestPhoneOtpRequest = { phone };
    return apiClient.post('/otp/link/phone', payload);
  },

  requestLinkEmailOtp: async (email: string): Promise<ApiResponse<OtpResponse>> => {
    const payload: RequestEmailOtpRequest = { email };
    return apiClient.post('/otp/link/email', payload);
  },
};