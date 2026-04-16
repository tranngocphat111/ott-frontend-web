import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { AdminAnalyticsProvider } from "./AdminAnalyticsContext";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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
