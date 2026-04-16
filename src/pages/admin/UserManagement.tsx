import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AdminTable from "../../components/admin/AdminTable";
import { useAdminAnalytics } from "../../components/admin/AdminAnalyticsContext";
import { adminService } from "../../services/adminService";
import type { UserSummary } from "../../interfaces/admin.interface";

const UserManagement: React.FC = () => {
  const { timeRange } = useAdminAnalytics();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const response = await adminService.getRecentUsers(timeRange);
        setUsers(response);
      } catch (error) {
        console.error("Không thể tải danh sách người dùng gần đây", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        Đang tải danh sách người dùng...
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-slate-900">
        Quản lý người dùng
      </h2>
      <AdminTable
        columns={[
          { key: "userId", label: "Mã người dùng" },
          { key: "email", label: "Email" },
          { key: "fullName", label: "Họ và tên" },
        ]}
        rows={users}
      />
    </motion.section>
  );
};

export default UserManagement;
