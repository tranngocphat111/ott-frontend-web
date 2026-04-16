import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "../../components/admin/StatCard";
import Charts from "../../components/admin/Charts";
import { useAdminAnalytics } from "../../components/admin/AdminAnalyticsContext";
import { adminService } from "../../services/adminService";
import type {
  EventReport,
  MessageTypesResponse,
  OverviewResponse,
} from "../../interfaces/admin.interface";

const Dashboard: React.FC = () => {
  const { timeRange } = useAdminAnalytics();
  const [overview, setOverview] = useState<OverviewResponse>({
    totalUsers: 0,
    totalMessages: 0,
    totalPosts: 0,
  });
  const [messageTypes, setMessageTypes] = useState<MessageTypesResponse>({
    text: 0,
    image: 0,
    voice: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const [overviewData, messageTypesData] = await Promise.all([
          adminService.getOverview(timeRange),
          adminService.getMessageTypes(timeRange),
        ]);
        setOverview(overviewData);
        setMessageTypes(messageTypesData);
      } catch (error) {
        console.error("Không thể tải dữ liệu bảng điều khiển quản trị", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [timeRange]);

  const messageChartData: EventReport[] = useMemo(
    () => [
      { title: "Văn bản", value: messageTypes.text, color: "#6366f1" },
      { title: "Hình ảnh", value: messageTypes.image, color: "#22c55e" },
      { title: "Âm thanh", value: messageTypes.voice, color: "#f59e0b" },
    ],
    [messageTypes],
  );

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        Đang tải dữ liệu bảng điều khiển...
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Tổng người dùng" value={overview.totalUsers} />
        <StatCard title="Tổng tin nhắn" value={overview.totalMessages} />
        <StatCard title="Tổng bài viết" value={overview.totalPosts} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Charts
          title="Phân bố loại tin nhắn"
          data={messageChartData}
          variant="pie"
        />
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Trạng thái hệ thống
          </h3>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>• API phân tích: Đang hoạt động</li>
            <li>• Nguồn dữ liệu: analytic-service :8090</li>
            <li>• Cập nhật: gần thời gian thực (theo sự kiện)</li>
          </ul>
        </div>
      </div>
    </motion.section>
  );
};

export default Dashboard;
