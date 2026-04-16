import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Charts from "../../components/admin/Charts";
import { useAdminAnalytics } from "../../components/admin/AdminAnalyticsContext";
import { adminService } from "../../services/adminService";
import type { DailyActivityPoint } from "../../interfaces/admin.interface";

const ContentModeration: React.FC = () => {
  const { timeRange } = useAdminAnalytics();
  const [activity, setActivity] = useState<DailyActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const response = await adminService.getDailyActivity(timeRange);
        setActivity(response);
      } catch (error) {
        console.error("Không thể tải dữ liệu kiểm duyệt nội dung", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        Đang tải dữ liệu kiểm duyệt nội dung...
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
        Kiểm duyệt nội dung
      </h2>
      <Charts
        title="Bài viết và tin nhắn theo thời gian"
        data={activity}
        variant="area"
      />
    </motion.section>
  );
};

export default ContentModeration;
