import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, profileApi, userApi } from '../services/api';
import type { UserProfileResponse } from '../types';

interface AuthContextType {
  user: UserProfileResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string, otpCode?: string) => Promise<{ requires2FA?: boolean; tempToken?: string; requiresPhoneSetup?: boolean; authenticated?: boolean }>;
  verify2FA: (tempToken: string, otpCode: string, isBackupCode: boolean) => Promise<{ authenticated: boolean }>;
  request2FAOtp: (phone: string) => Promise<void>;
  loginWithToken: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (phone: string, email: string, password: string, fullName: string, otp: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfileResponse>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!localStorage.getItem('accessToken');

  const fetchUser = async () => {
    try {
      console.log('AuthContext: Fetching user profile...');
      const response = await profileApi.getCurrentProfile();

      if (response.result) {
        console.log('AuthContext: User profile fetched:', response.result);
        setUser(response.result);
        return response.result;
      } else {
        console.error('AuthContext: No result in profile response');
        throw new Error('No user data in response');
      }
    } catch (error) {
      console.error('AuthContext: Failed to fetch user:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log('AuthContext: Found token in localStorage, fetching user...');
      fetchUser().catch(() => {
        console.log('AuthContext: Initial fetch failed');
      });
    } else {
      console.log('AuthContext: No token found');
      setIsLoading(false);
    }
  }, []);

  const login = async (phone: string, password: string, otpCode?: string) => {
    console.log('AuthContext: Local login attempt');

    // eslint-disable-next-line no-useless-catch
    try {
      const response = await authApi.localLogin({
        phone,
        password,
        otpCode,
      });

      if (response.result) {

        if (response.result.requires2FA && response.result.tempToken) {
          console.log('AuthContext: 2FA required');
          return {
            requires2FA: true,
            tempToken: response.result.tempToken,
            authenticated: false,
          };
        }


        if (response.result.token && response.result.refreshToken) {
          console.log('AuthContext: Login successful, storing tokens');
          localStorage.setItem('accessToken', response.result.token);
          localStorage.setItem('refreshToken', response.result.refreshToken);

          await fetchUser();
          console.log('AuthContext: User fetched after login');

          return { authenticated: true };
        }
      }

      throw new Error(response.message || 'Login failed');
    } catch (error: unknown) {

      throw error;
    }
  };

  const verify2FA = async (tempToken: string, otpCode: string, isBackupCode: boolean = false) => {
    const response = await authApi.verify2FAOtp({
      tempToken,
      otpCode,
      isBackupCode,
    });

    if (response.result?.token && response.result?.refreshToken) {
      localStorage.setItem('accessToken', response.result.token);
      localStorage.setItem('refreshToken', response.result.refreshToken);
      await fetchUser();
      return { authenticated: true };
    }

    throw new Error(response.message || '2FA verification failed');
  };

  const request2FAOtp = async (phone: string) => {
    console.log('AuthContext: Requesting 2FA OTP resend');

    const response = await authApi.request2FAOtp({
      phone,
    });

    if (!response.result) {
      throw new Error(response.message || 'Failed to send OTP');
    }

    console.log('AuthContext: 2FA OTP sent successfully');
  };

  const loginWithToken = async (token: string, refreshToken: string) => {
    console.log('AuthContext: loginWithToken called');
    console.log('AuthContext: Storing tokens in localStorage');

    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);

    console.log('AuthContext: Fetching user profile');

    try {
      await fetchUser();
      console.log('AuthContext: loginWithToken completed successfully');
    } catch (error) {
      console.error('AuthContext: loginWithToken failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  };

  const register = async (
    phone: string,
    email: string,
    password: string,
    fullName: string,
    otp: string
  ) => {
    console.log('AuthContext: Registration attempt');

    const response = await userApi.register({
      phone,
      email,
      password,
      fullName,
      otp,
    });

    if (response.result) {
      console.log('AuthContext: Registration successful, auto-logging in');
      await login(phone, password);
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logout initiated');

    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await authApi.logout({ token });
        console.log('AuthContext: Logout API call successful');
      }
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      console.log('AuthContext: Logout completed, tokens cleared');
    }
  };

  const updateProfile = (updates: Partial<UserProfileResponse>) => {
    if (user) {
      console.log('AuthContext: Updating profile locally');
      setUser({ ...user, ...updates });
    }
  };

  const refreshUser = async () => {
    console.log('AuthContext: Refreshing user data');
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
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
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};