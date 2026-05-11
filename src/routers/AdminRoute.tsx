import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { AdminRole } from "../types";

interface AdminRouteProps {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}

/**
 * AdminRoute: Semantic wrapper for admin route protection
 *
 * Ensures that:
 * - User is authenticated (has valid token)
 * - User has ADMIN role
 * - Redirects to home if not authorized
 *
 * This component should wrap all admin routes in AppRouter
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated: go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but role not allowed => render 403
  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    (!userRole || !allowedRoles.includes(userRole))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
          <h1 className="text-4xl font-extrabold text-red-600 mb-2">403</h1>
          <p className="text-lg text-slate-700 mb-4">
            Bạn không có quyền truy cập vào trang này.
          </p>
          <p className="text-sm text-slate-500">
            Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
