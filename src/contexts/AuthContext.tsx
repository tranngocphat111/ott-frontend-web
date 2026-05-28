import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi, profileApi, userApi } from "../services/api";
import type { UserProfileResponse } from "../types";
import { isAdminAccountType } from "../types/enums/user.enum";
import type { AdminRole } from "../types";
import {
  beginManualLogout,
  clearForcedLogoutNotice,
  emitAuthLogoutSignal,
  endManualLogout,
  isManualLogoutInProgress,
  rememberForcedLogoutNotice,
} from "../utils/authLogoutSignal";

interface AuthContextType {
  user: UserProfileResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userRole: AdminRole | null;
  isLoading: boolean;
  login: (
    identifier: string,
    password: string,
    otpCode?: string,
  ) => Promise<{
    requires2FA?: boolean;
    tempToken?: string;
    requiresPhoneSetup?: boolean;
    authenticated?: boolean;
  }>;
  verify2FA: (
    tempToken: string,
    otpCode: string,
    isBackupCode: boolean,
  ) => Promise<{ authenticated: boolean }>;
  request2FAOtp: (identifier: string) => Promise<void>;
  loginWithToken: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    phone: string,
    email: string,
    password: string,
    fullName: string,
    otp: string,
  ) => Promise<void>;
  updateProfile: (updates: Partial<UserProfileResponse>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getErrorCode = (error: unknown): number | undefined => {
  const candidate = error as {
    code?: unknown;
    status?: unknown;
    details?: { code?: unknown; status?: unknown };
    response?: { status?: unknown; data?: { code?: unknown } };
  };

  const value =
    candidate?.response?.data?.code ??
    candidate?.details?.code ??
    candidate?.response?.status ??
    candidate?.status ??
    candidate?.code;

  return typeof value === "number" ? value : undefined;
};

const isSessionInvalidationError = (error: unknown) => {
  const code = getErrorCode(error);
  return code === 401 || code === 403 || code === 1006 || code === 2005 || code === 2006 || code === 7001;
};

const rememberForcedLogoutNoticeIfNeeded = () => {
  if (!isManualLogoutInProgress()) {
    rememberForcedLogoutNotice();
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!localStorage.getItem("accessToken");
  // Determine admin role if available from profile, else fallback for existing ADMIN accountType
  const inferredRole = (user as any)?.role ?? (user as any)?.adminRole ?? null;
  const userRole: AdminRole | null = inferredRole
    ? (inferredRole as AdminRole)
    : isAdminAccountType(user?.accountType)
      ? "ANALYST"
      : null;
  const isAdmin = userRole !== null;

  const refreshStoredSession = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    const response = await authApi.refresh({
      token: refreshToken,
      deviceId: localStorage.getItem("deviceId") ?? undefined,
    });

    const nextToken = response.result?.token;
    const nextRefreshToken = response.result?.refreshToken;

    if (!nextToken || !nextRefreshToken) {
      throw new Error("Invalid refresh response");
    }

    clearForcedLogoutNotice();
    localStorage.setItem("accessToken", nextToken);
    localStorage.setItem("refreshToken", nextRefreshToken);

    return nextToken;
  };

  const ensureCurrentTokenActive = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      await refreshStoredSession();
      return;
    }

    const response = await authApi.introspect({ token });
    if (response.result?.valid) {
      return;
    }

    await refreshStoredSession();
  };

  const fetchUser = async () => {
    try {
      console.log("AuthContext: Fetching user profile...");
      await ensureCurrentTokenActive();
      const response = await profileApi.getCurrentProfile();

      if (response.result) {
        console.log("AuthContext: User profile fetched:", response.result);
        setUser(response.result);
        return response.result;
      } else {
        console.error("AuthContext: No result in profile response");
        throw new Error("No user data in response");
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch user:", error);
      // Don't clear session here - the interceptor handles 401 with refresh
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (token || refreshToken) {
      console.log("AuthContext: Found token in localStorage, fetching user...");
      fetchUser().catch((error) => {
        console.log("AuthContext: Initial fetch failed");
        console.debug("AuthContext: Clearing expired/invalid stored session", error);
        clearForcedLogoutNotice();
        clearLocalSession();
        emitAuthLogoutSignal();
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      });
    } else {
      console.log("AuthContext: No token found");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let socketServiceRef:
      | typeof import("../services/socket.service").socketService
      | null = null;
    let presenceHeartbeatTimer: ReturnType<typeof window.setInterval> | null =
      null;
    let disposed = false;

    const syncPresence = () => {
      if (!socketServiceRef || !user?.id) return;
      if (document.visibilityState === "hidden") return;

      socketServiceRef.connect();
      socketServiceRef.joinUserRoom(user.id);
      socketServiceRef.refreshPresence?.(user.id);
    };

    let lastTokenCheckAt = 0;
    const checkCurrentSession = () => {
      const now = Date.now();
      if (now - lastTokenCheckAt < 15000) return;
      lastTokenCheckAt = now;

      ensureCurrentTokenActive().catch((error) => {
        console.debug("AuthContext: Current session check failed, clearing local session", error);
        clearForcedLogoutNotice();
        clearLocalSession();
        emitAuthLogoutSignal();
        window.location.href = "/login";
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkCurrentSession();
        syncPresence();
      }
    };

    const handleWindowFocus = () => {
      checkCurrentSession();
      syncPresence();
    };

    const handleUserInfoUpdated = (payload: {
      userId: string;
      fullName?: string;
      avatarUrl?: string;
      coverUrl?: string;
      bio?: string;
      work?: string;
      location?: string;
      relationshipStatus?: string;
      email?: string;
      phone?: string;
    }) => {
      setUser((prevUser) => {
        if (prevUser && prevUser.id === payload.userId) {
          return {
            ...prevUser,
            fullName: payload.fullName ?? prevUser.fullName,
            avatarUrl: payload.avatarUrl ?? prevUser.avatarUrl,
            coverUrl: payload.coverUrl ?? prevUser.coverUrl,
            bio: payload.bio ?? prevUser.bio,
            work: payload.work ?? prevUser.work,
            location: payload.location ?? prevUser.location,
            relationshipStatus:
              payload.relationshipStatus ?? prevUser.relationshipStatus,
            email: payload.email ?? prevUser.email,
            phone: payload.phone ?? prevUser.phone,
          };
        }
        return prevUser;
      });
    };

    const handleForceLogout = (payload: {
      action: string;
      deviceId?: string;
      revokedDeviceIds?: string[];
    }) => {
      console.log("AuthContext: Received buoc_dang_xuat event", payload);
      const { action } = payload;
      const myDeviceId = localStorage.getItem("deviceId");

      if (action === "ALL") {
        rememberForcedLogoutNoticeIfNeeded();
        clearLocalSession();
        emitAuthLogoutSignal();
        window.location.href = "/login";
      } else if (
        action === "SPECIFIC" &&
        payload.deviceId &&
        myDeviceId === payload.deviceId
      ) {
        rememberForcedLogoutNoticeIfNeeded();
        clearLocalSession();
        emitAuthLogoutSignal();
        window.location.href = "/login";
      } else if (
        action === "OTHERS" &&
        myDeviceId &&
        payload.revokedDeviceIds?.includes(myDeviceId)
      ) {
        rememberForcedLogoutNoticeIfNeeded();
        clearLocalSession();
        emitAuthLogoutSignal();
        window.location.href = "/login";
      } else if (action === "SPECIFIC" || action === "OTHERS") {
        fetchUser().catch((error) => {
          if (isSessionInvalidationError(error)) {
            rememberForcedLogoutNoticeIfNeeded();
          }
          clearLocalSession();
          emitAuthLogoutSignal();
          window.location.href = "/login";
        });
      }
    };

    import("../services/socket.service").then(({ socketService }) => {
      if (disposed) return;

      socketServiceRef = socketService;

      socketService.connect();
      socketService.joinUserRoom(user.id);
      socketService.refreshPresence(user.id);
      checkCurrentSession();

      socketService.onUserInfoUpdated(handleUserInfoUpdated);
      socketService.onForceLogout(handleForceLogout);

      presenceHeartbeatTimer = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          checkCurrentSession();
          socketService.refreshPresence(user.id);
        }
      }, 20000);

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleWindowFocus);
      window.addEventListener("online", handleWindowFocus);
    });

    return () => {
      disposed = true;
      if (presenceHeartbeatTimer) {
        window.clearInterval(presenceHeartbeatTimer);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleWindowFocus);

      if (socketServiceRef) {
        socketServiceRef.offUserInfoUpdated(handleUserInfoUpdated);
        socketServiceRef.offForceLogout(handleForceLogout);
      }
    };
  }, [isAuthenticated, user?.id]);

  const clearLocalSession = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const login = async (
    identifier: string,
    password: string,
    otpCode?: string,
  ) => {
    try {
      const response = await authApi.localLogin({
        identifier,
        password,
        otpCode,
      });
      if (response.result) {
        if (response.result.requires2FA && response.result.tempToken) {
          return {
            requires2FA: true,
            tempToken: response.result.tempToken,
            authenticated: false,
          };
        }
        if (response.result.token && response.result.refreshToken) {
          clearForcedLogoutNotice();
          localStorage.setItem("accessToken", response.result.token);
          localStorage.setItem("refreshToken", response.result.refreshToken);
          await fetchUser();
          return { authenticated: true };
        }
      }
      throw new Error(response.message || "Login failed");
    } finally {
      // setIsLoading(false)
    }
  };

  const verify2FA = async (
    tempToken: string,
    otpCode: string,
    isBackupCode = false,
  ) => {
    try {
      const response = await authApi.verify2FAOtp({
        tempToken,
        otpCode,
        isBackupCode,
      });
      if (response.result?.token && response.result?.refreshToken) {
        clearForcedLogoutNotice();
        localStorage.setItem("accessToken", response.result.token);
        localStorage.setItem("refreshToken", response.result.refreshToken);
        await fetchUser();
        return { authenticated: true };
      }
      throw new Error(response.message || "2FA verification failed");
    } catch (err) {
      throw err;
    }
  };

  const request2FAOtp = async (identifier: string) => {
    console.log("AuthContext: Requesting 2FA OTP resend");

    const response = await authApi.request2FAOtp({
      identifier,
    });

    if (!response.result) {
      throw new Error(response.message || "Failed to send OTP");
    }

    console.log("AuthContext: 2FA OTP sent successfully");
  };

  const loginWithToken = async (token: string, refreshToken: string) => {
    try {
      clearForcedLogoutNotice();
      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", refreshToken);
      await fetchUser();
    } catch (error) {
      clearLocalSession();
      throw error;
    }
  };

  const register = async (
    phone: string,
    email: string,
    password: string,
    fullName: string,
    otp: string,
  ) => {
    console.log("AuthContext: Registration attempt");

    const response = await userApi.register({
      phone,
      email,
      password,
      fullName,
      otp,
    });

    if (response.result) {
      console.log("AuthContext: Registration successful, auto-logging in");
      await login(phone, password); // Dùng phone khi đăng ký vì đăng ký yêu cầu phone
    }
  };

  const logout = async () => {
    console.log("AuthContext: Logout initiated");
    beginManualLogout();
    const rawUser = user as {
      id?: string;
      user_id?: string;
      _id?: string;
    } | null;
    const logoutUserId = rawUser?.id || rawUser?.user_id || rawUser?._id || "";
    emitAuthLogoutSignal();

    const socketCleanupPromise = import("../services/socket.service")
      .then(async ({ socketService }) => {
        if (logoutUserId) {
          await socketService.leaveAllCallsForLogout(logoutUserId);
        }
        return socketService;
      })
      .catch((err) => {
        console.error("Could not notify call logout cleanup:", err);
        return null;
      });

    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await authApi.logout({
          token,
          deviceId: localStorage.getItem("deviceId") ?? undefined,
        });
        console.log("AuthContext: Logout API call successful");
      }
    } catch (error) {
      console.error("AuthContext: Logout error:", error);
    } finally {
      // Ngắt kết nối socket ngay lập tức để backend ghi nhận trạng thái offline
      const socketService = await socketCleanupPromise;
      socketService?.disconnect();

      clearLocalSession();
      clearForcedLogoutNotice();
      endManualLogout();
      console.log("AuthContext: Logout completed, tokens cleared");
    }
  };

  const updateProfile = (updates: Partial<UserProfileResponse>) => {
    if (user) {
      console.log("AuthContext: Updating profile locally");
      setUser({ ...user, ...updates });
    }
  };

  const refreshUser = async () => {
    console.log("AuthContext: Refreshing user data");
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        userRole,
        isLoading,
        login,
        verify2FA,
        request2FAOtp,
        loginWithToken,
        logout,
        register,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
