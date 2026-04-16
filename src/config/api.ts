const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

const buildApiBaseUrl = (): string => {
  const directUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (directUrl) {
    return normalizeBaseUrl(directUrl);
  }

  const gatewayBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (gatewayBase) {
    return `${normalizeBaseUrl(gatewayBase)}/riff/api`;
  }

  return "http://192.168.5.170:8080/riff/api";
};

export const API_CONFIG = {
  BASE_URL: buildApiBaseUrl(),
  TIMEOUT: 30000,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  REDIRECT_URI: `${import.meta.env.VITE_FRONTEND_URL}/auth/google/callback`,
  SCOPE: "openid profile email",
};

export const API_ENDPOINTS = {
  AUTH: {
    LOCAL_LOGIN: "/auth/login/local",

    REQUEST_EMAIL_OTP_LOGIN: "/auth/login/email-otp/request",
    VERIFY_EMAIL_OTP_LOGIN: "/auth/login/email-otp/verify",

    GOOGLE_AUTH: "/auth/login/google",
    GOOGLE_COMPLETE: "/auth/login/google/complete",

    REQUEST_2FA_OTP: "/auth/2fa/otp/request",
    VERIFY_2FA: "/auth/2fa/verify",

    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    INTROSPECT: "/auth/introspect",

    QR_GENERATE: "/auth/qr/generate",
    QR_SCAN: "/auth/qr/scan",
    QR_CONFIRM: "/auth/qr/confirm",
    QR_STATUS: (qrId: string) => `/auth/qr/status/${qrId}`,
    QR_CANCEL: (qrId: string) => `/auth/qr/${qrId}`,

    GOOGLE_AUTH_TOKEN: "/auth/login/google/token",
  },

  USERS: {
    // Registration
    REQUEST_REGISTER_OTP: "/users/register/otp",
    REGISTER: "/users/register",
  },

  PROFILE: {
    GET_ME: "/users/profile/me",
    GET_BY_ID: (userId: string) => `/users/profile/${userId}`,
    UPDATE_ME: "/users/profile/me",
  },

  ACCOUNT: {
    SET_PASSWORD: "/users/account/password/set",
    CHANGE_PASSWORD: "/users/account/password/change",
    FORGOT_PASSWORD_REQUEST: "/users/account/password/forgot/request",
    FORGOT_PASSWORD_VERIFY: "/users/account/password/forgot/verify",

    CHANGE_EMAIL_REQUEST: "/users/account/email/change/request",
    CHANGE_EMAIL: "/users/account/email/change",

    CHANGE_PHONE_REQUEST: "/users/account/phone/change/request",
    CHANGE_PHONE: "/users/account/phone/change",

    DELETE_REQUEST: "/users/account/delete/request",
    DELETE: "/users/account",
  },

  SESSIONS: {
    GET_ALL: "/users/sessions",
    REVOKE: (sessionId: string) => `/users/sessions/${sessionId}`,
    REVOKE_ALL_OTHERS: "/users/sessions/others",
    REVOKE_ALL: "/users/sessions/all",
  },

  LINKING: {
    LINK_PHONE: "/users/linking/phone",
    LINK_EMAIL: "/users/linking/email",
  },

  OTP: {
    LINK_PHONE: "/otp/link/phone",
    LINK_EMAIL: "/otp/link/email",
  },
  TWO_FACTOR: {
    ENABLE_REQUEST: "/users/2fa/enable/request",
    ENABLE: "/users/2fa/enable",
    DISABLE_REQUEST: "/users/2fa/disable/request",
    DISABLE: "/users/2fa/disable",
    GET_STATUS: "/users/2fa/status",
    IS_ENABLED: "/users/2fa/enabled",
  },
} as const;

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
