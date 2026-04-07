import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import SetPasswordPage from '../pages/SetPasswordPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ChangeEmailPage from '../pages/ChangeEmailPage';
import ChangePhonePage from '../pages/ChangePhonePage';
import TwoFactorAuthPage from '../pages/TwoFactorAuthPage';
import DeleteAccountPage from '../pages/DeleteAccountPage';
import GoogleCallbackPage from '../pages/GoogleCallbackPage';
import SetupPhonePage from '../pages/SetupPhonePage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  return !isAuthenticated ? <>{children}</> : <Navigate to="/home" replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
      <Route path="/setup-phone" element={<SetupPhonePage />} />

      <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/account/password/set" element={<PrivateRoute><SetPasswordPage /></PrivateRoute>} />
      <Route path="/account/password/change" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
      <Route path="/account/email/change" element={<PrivateRoute><ChangeEmailPage /></PrivateRoute>} />
      <Route path="/account/phone/change" element={<PrivateRoute><ChangePhonePage /></PrivateRoute>} />
      <Route path="/account/delete" element={<PrivateRoute><DeleteAccountPage /></PrivateRoute>} />
      <Route path="/security/2fa" element={<PrivateRoute><TwoFactorAuthPage /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;