import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "../../components/admin/StatCard";
import Charts from "../../components/admin/Charts";
import { useAdminAnalytics } from "../../components/admin/AdminAnalyticsContext";
import ErrorState from "../../components/admin/ErrorState";
import { adminService } from "../../services/adminService";
import type {
  DailyUserTrendPoint,
  EventReport,
  LoginMethodCount,
  MessageTypesResponse,
  OverviewResponse,
} from "../../interfaces/admin.interface";

const buildCsv = (rows: Array<Array<string | number | null | undefined>>) => {
  const escapeCell = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  return rows.map((row) => row.map(escapeCell).join(",")).join("\n");
};

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = buildCsv(rows);
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const Dashboard: React.FC = () => {
  const { timeRange } = useAdminAnalytics();
  const [overview, setOverview] = useState<OverviewResponse>({
    totalUsers: 0,
    totalLogins: 0,
    totalMessages: 0,
    totalPosts: 0,
    dau: 0,
    mau: 0,
  });
  const [messageTypes, setMessageTypes] = useState<MessageTypesResponse>({
    text: 0,
    image: 0,
    voice: 0,
  });
  const [loginMethods, setLoginMethods] = useState<LoginMethodCount[]>([]);
  const [userTrend, setUserTrend] = useState<DailyUserTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [overviewData, messageTypesData] = await Promise.all([
        adminService.getOverview(timeRange),
        adminService.getMessageTypes(timeRange),
      ]);
      setOverview(overviewData);
      setMessageTypes(messageTypesData);
      const loginMethodsData = await adminService.getLoginMethods(timeRange);
      setLoginMethods(loginMethodsData);
      const trendData = await adminService.getUserDailyTrend(timeRange);
      setUserTrend(trendData);
    } catch (err) {
      console.error("Không thể tải dữ liệu bảng điều khiển quản trị", err);
      setError("Không thể tải dashboard analytics. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const messageChartData: EventReport[] = useMemo(
    () => [
      { title: "Văn bản", value: messageTypes.text, color: "#6366f1" },
      { title: "Hình ảnh", value: messageTypes.image, color: "#22c55e" },
      { title: "Âm thanh", value: messageTypes.voice, color: "#f59e0b" },
    ],
    [messageTypes],
  );

  const loginMethodChartData: EventReport[] = useMemo(() => {
    const labelMap: Record<string, string> = {
      local: "Tài khoản",
      google: "Google",
      qr_code: "QR Code",
      otp: "OTP",
    };

    return loginMethods.map((item) => ({
      title: labelMap[item.method] ?? item.method,
      value: item.count,
    }));
  }, [loginMethods]);

  const userTrendChartData = useMemo(
    () =>
      userTrend.map((item) => ({
        date: item.date,
        registrations: item.registrations,
        logins: item.logins,
      })),
    [userTrend],
  );

  const totalRegistrationsInRange = useMemo(
    () => userTrend.reduce((sum, item) => sum + item.registrations, 0),
    [userTrend],
  );

  const totalLoginEventsInRange = useMemo(
    () => userTrend.reduce((sum, item) => sum + item.logins, 0),
    [userTrend],
  );

  const peakRegistrationDay = useMemo(
    () =>
      userTrend.length > 0
        ? userTrend.reduce((max, item) =>
            item.registrations > max.registrations ? item : max,
          )
        : null,
    [userTrend],
  );

  const peakLoginDay = useMemo(
    () =>
      userTrend.length > 0
        ? userTrend.reduce((max, item) =>
            item.logins > max.logins ? item : max,
          )
        : null,
    [userTrend],
  );

  const avgDailyRegistrations = useMemo(
    () =>
      userTrend.length > 0
        ? Math.round(totalRegistrationsInRange / userTrend.length)
        : 0,
    [userTrend, totalRegistrationsInRange],
  );

  const avgDailyLogins = useMemo(
    () =>
      userTrend.length > 0
        ? Math.round(totalLoginEventsInRange / userTrend.length)
        : 0,
    [userTrend, totalLoginEventsInRange],
  );

  const handleExportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ["Overview"],
      ["Metric", "Value"],
      ["Total Users", overview.totalUsers],
      ["Total Logins", overview.totalLogins],
      ["Total Messages", overview.totalMessages],
      ["Total Posts", overview.totalPosts],
      ["DAU", overview.dau],
      ["MAU", overview.mau],
      ["Registrations (Range)", totalRegistrationsInRange],
      ["Logins (Range)", totalLoginEventsInRange],
      ["Avg Registrations/Day", avgDailyRegistrations],
      ["Avg Logins/Day", avgDailyLogins],
    ];

    if (peakRegistrationDay) {
      rows.push([
        "Peak Registration Day",
        `${peakRegistrationDay.date} (${peakRegistrationDay.registrations})`,
      ]);
    }

    if (peakLoginDay) {
      rows.push([
        "Peak Login Day",
        `${peakLoginDay.date} (${peakLoginDay.logins})`,
      ]);
    }

    rows.push([""], ["Message Types"], ["Type", "Count"]);
    messageChartData.forEach((item) => {
      rows.push([item.title, item.value]);
    });

    rows.push([""], ["Login Methods"], ["Method", "Count"]);
    loginMethodChartData.forEach((item) => {
      rows.push([item.title, item.value]);
    });

    rows.push([""], ["User Trend"], ["Date", "Registrations", "Logins"]);
    userTrendChartData.forEach((item) => {
      rows.push([item.date, item.registrations, item.logins]);
    });

    downloadCsv(`dashboard-analytics-${timeRange}.csv`, rows);
  };

  useEffect(() => {
    void load();
  }, [timeRange]);

  if (error) {
    return (
      <ErrorState
        title="Dashboard không sẵn sàng"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-white border shadow-sm min-h-80 rounded-xl border-slate-200 text-slate-500">
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
      <div className="flex flex-col gap-3 p-4 bg-white border shadow-sm rounded-xl border-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Dashboard Analytics
          </h2>
          <p className="text-sm text-slate-500">
            Xuất dữ liệu hiện tại theo khoảng thời gian đã chọn.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Xuất CSV
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={overview.totalUsers}
          delta={overview.userDelta ?? null}
        />
        <StatCard
          title="Tổng lượt đăng nhập"
          value={overview.totalLogins}
          delta={overview.loginDelta ?? null}
        />
        <StatCard
          title="Tổng tin nhắn"
          value={overview.totalMessages}
          delta={overview.messageDelta ?? null}
        />
        <StatCard
          title="Tổng bài viết"
          value={overview.totalPosts}
          delta={overview.postDelta ?? null}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard title="DAU (Hoạt động/ngày)" value={overview.dau} />
        <StatCard title="MAU (Hoạt động/tháng)" value={overview.mau} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard
          title="Đăng ký trong khoảng này"
          value={totalRegistrationsInRange}
        />
        <StatCard
          title="Đăng nhập trong khoảng này"
          value={totalLoginEventsInRange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard title="TB Đăng ký/ngày" value={avgDailyRegistrations} />
        <StatCard title="TB Đăng nhập/ngày" value={avgDailyLogins} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {peakRegistrationDay && (
          <div className="p-4 bg-white border shadow-sm rounded-xl border-slate-200">
            <p className="text-sm text-slate-500">Ngày cao điểm đăng ký</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {peakRegistrationDay.registrations.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {peakRegistrationDay.date}
            </p>
          </div>
        )}
        {peakLoginDay && (
          <div className="p-4 bg-white border shadow-sm rounded-xl border-slate-200">
            <p className="text-sm text-slate-500">Ngày cao điểm đăng nhập</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {peakLoginDay.logins.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">{peakLoginDay.date}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Charts
          title="Phân bố loại tin nhắn"
          data={messageChartData}
          variant="pie"
        />
        <Charts
          title="Phân bố phương thức đăng nhập"
          data={loginMethodChartData}
          variant="pie"
        />
        <div className="p-4 bg-white border shadow-sm rounded-xl border-slate-200">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Trạng thái hệ thống
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• API phân tích: Đang hoạt động</li>
            <li>• Nguồn dữ liệu: analytic-service :8092</li>
            <li>• Cập nhật: gần thời gian thực (theo sự kiện)</li>
          </ul>
        </div>
      </div>

      <Charts
        title="Xu hướng đăng ký và đăng nhập theo ngày"
        data={userTrendChartData}
        variant="area"
        series={[
          {
            key: "registrations",
            label: "Đăng ký",
            stroke: "#8b5cf6",
            fillId: "fillRegistrations",
            gradientStop: "#8b5cf6",
          },
          {
            key: "logins",
            label: "Đăng nhập",
            stroke: "#06b6d4",
            fillId: "fillLogins",
            gradientStop: "#06b6d4",
          },
        ]}
      />
    </motion.section>
  );
};

export default Dashboard;
