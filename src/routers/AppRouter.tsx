import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import GoogleCallbackPage from "../pages/GoogleCallbackPage";
import SetupPhonePage from "../pages/SetupPhonePage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";

// Main pages
import SocialPage from "../pages/SocialPage";
import CallPage from "../pages/CallPage";
import ProfilePage from "../pages/ProfilePage";
import Dashboard from "../pages/admin/Dashboard";
import ContentModeration from "../pages/admin/ContentModeration";
import UserManagement from "../pages/admin/UserManagement";

// Account settings pages
import SetPasswordPage from "../pages/SetPasswordPage";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import ChangeEmailPage from "../pages/ChangeEmailPage";
import ChangePhonePage from "../pages/ChangePhonePage";
import TwoFactorAuthPage from "../pages/TwoFactorAuthPage";
import DeleteAccountPage from "../pages/DeleteAccountPage";
import AuditLogs from "../pages/admin/AuditLogs";

// Layout
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../components/admin/AdminLayout";
import { ChatPage, ContactsPage } from "../pages";
import JoinGroupPage from "../pages/JoinGroupPage";
import { RequireAdmin } from "./guards";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  return !isAuthenticated ? <>{children}</> : <Navigate to="/chat" replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />

      {/* Auth callback */}
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
      <Route path="/setup-phone" element={<SetupPhonePage />} />

      {/* Main private routes with navigation */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/social/*" element={<SocialPage />} />
      </Route>

      <Route
        path="/call"
        element={
          <PrivateRoute>
            <CallPage />
          </PrivateRoute>
        }
      />

      {/* Profile & Account settings */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/account/password/set"
        element={
          <PrivateRoute>
            <SetPasswordPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/account/password/change"
        element={
          <PrivateRoute>
            <ChangePasswordPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/account/email/change"
        element={
          <PrivateRoute>
            <ChangeEmailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/account/phone/change"
        element={
          <PrivateRoute>
            <ChangePhonePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/account/delete"
        element={
          <PrivateRoute>
            <DeleteAccountPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/security/2fa"
        element={
          <PrivateRoute>
            <TwoFactorAuthPage />
          </PrivateRoute>
        }
      />

      {/* Join group by invite link – accessible when logged in OR not */}
      <Route path="/join" element={<JoinGroupPage />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="moderation" element={<ContentModeration />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
