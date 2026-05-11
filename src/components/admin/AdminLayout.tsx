import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { AdminAnalyticsProvider } from "./AdminAnalyticsContext";
import { useAuth } from "../../contexts/AuthContext";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isLoading, isAuthenticated, isAdmin, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
          <h1 className="text-4xl font-extrabold text-red-600 mb-2">403</h1>
          <p className="text-lg text-slate-700 mb-4">
            Bạn không có quyền truy cập khu vực quản trị.
          </p>
          <p className="text-sm text-slate-500">
            Vai trò hiện tại: {userRole ?? "-"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminAnalyticsProvider>
      <div className="h-screen w-screen overflow-hidden bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />

          <motion.main
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto p-6"
          >
            {children ?? <Outlet />}
          </motion.main>
        </div>
      </div>
    </AdminAnalyticsProvider>
  );
};

export default AdminLayout;
