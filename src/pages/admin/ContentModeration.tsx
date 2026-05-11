import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Charts from "../../components/admin/Charts";
import { useAdminAnalytics } from "../../components/admin/AdminAnalyticsContext";
import ErrorState from "../../components/admin/ErrorState";
import { adminService } from "../../services/adminService";
import type { DailyActivityPoint } from "../../interfaces/admin.interface";

const ContentModeration: React.FC = () => {
  const { timeRange } = useAdminAnalytics();
  const [activity, setActivity] = useState<DailyActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.getDailyActivity(timeRange);
      setActivity(response);
    } catch (err) {
      console.error("Không thể tải dữ liệu kiểm duyệt nội dung", err);
      setError("Không thể tải biểu đồ hoạt động nội dung. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [timeRange]);

  if (error) {
    return (
      <ErrorState
        title="Biểu đồ nội dung không sẵn sàng"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
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
