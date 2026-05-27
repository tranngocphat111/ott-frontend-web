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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Đang kiểm tra quyền quản trị...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <h1 className="mb-2 text-4xl font-extrabold text-red-600">403</h1>
          <p className="mb-4 text-lg text-slate-100">
            Bạn không có quyền truy cập bảng quản trị.
          </p>
          <p className="text-sm text-slate-400">Vai trò hiện tại: {userRole ?? "-"}</p>
        </div>
      </div>
    );
  }

  return (
    <AdminAnalyticsProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />

          <motion.main
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto bg-slate-100 px-6 py-5"
          >
            <div className="mx-auto w-full max-w-[1600px]">
              {children ?? <Outlet />}
            </div>
          </motion.main>
        </div>
      </div>
    </AdminAnalyticsProvider>
  );
};

export default AdminLayout;
