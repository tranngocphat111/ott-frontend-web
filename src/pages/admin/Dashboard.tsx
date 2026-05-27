import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Database,
  FileText,
  LogIn,
  MessageSquareText,
  Users,
} from "lucide-react";
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
      const [overviewData, messageTypesData, loginMethodsData, trendData] =
        await Promise.all([
          adminService.getOverview(timeRange),
          adminService.getMessageTypes(timeRange),
          adminService.getLoginMethods(timeRange),
          adminService.getUserDailyTrend(timeRange),
        ]);

      setOverview(overviewData);
      setMessageTypes(messageTypesData);
      setLoginMethods(loginMethodsData);
      setUserTrend(trendData);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
      setError("Không thể tải dữ liệu phân tích từ backend.");
    } finally {
      setLoading(false);
    }
  };

  const messageChartData: EventReport[] = useMemo(
    () => [
      { title: "Văn bản", value: messageTypes.text, color: "#6366f1" },
      { title: "Hình ảnh", value: messageTypes.image, color: "#22c55e" },
      { title: "Giọng nói", value: messageTypes.voice, color: "#f59e0b" },
    ],
    [messageTypes],
  );

  const loginMethodChartData: EventReport[] = useMemo(() => {
    const labelMap: Record<string, string> = {
      local: "Mật khẩu",
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
      ["Tổng quan"],
      ["Chỉ số", "Giá trị"],
      ["Tổng người dùng", overview.totalUsers],
      ["Lượt đăng nhập", overview.totalLogins],
      ["Tin nhắn", overview.totalMessages],
      ["Bài viết", overview.totalPosts],
      ["DAU", overview.dau],
      ["MAU", overview.mau],
      ["Đăng ký trong kỳ", totalRegistrationsInRange],
      ["Đăng nhập trong kỳ", totalLoginEventsInRange],
      ["Đăng ký trung bình / ngày", avgDailyRegistrations],
      ["Đăng nhập trung bình / ngày", avgDailyLogins],
    ];

    if (peakRegistrationDay) {
      rows.push([
        "Ngày đăng ký cao nhất",
        `${peakRegistrationDay.date} (${peakRegistrationDay.registrations})`,
      ]);
    }

    if (peakLoginDay) {
      rows.push([
        "Ngày đăng nhập cao nhất",
        `${peakLoginDay.date} (${peakLoginDay.logins})`,
      ]);
    }

    rows.push([""], ["Loại tin nhắn"], ["Loại", "Số lượng"]);
    messageChartData.forEach((item) => {
      rows.push([item.title, item.value]);
    });

    rows.push([""], ["Phương thức đăng nhập"], ["Phương thức", "Số lượng"]);
    loginMethodChartData.forEach((item) => {
      rows.push([item.title, item.value]);
    });

    rows.push([""], ["Xu hướng người dùng"], ["Ngày", "Đăng ký", "Đăng nhập"]);
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
        title="Không thể hiển thị tổng quan"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        Đang tải bảng tổng quan...
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
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Tổng quan
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Vận hành nền tảng OTT
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Theo dõi tăng trưởng, tương tác và sức khỏe dịch vụ qua pipeline sự kiện.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Nguồn: <span className="font-medium text-slate-900">analytic-service</span>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Xuất CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={overview.totalUsers}
          delta={overview.userDelta ?? null}
          description="Tài khoản đã đăng ký trong khoảng thời gian đã chọn."
          icon={<Users className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          title="Lượt đăng nhập"
          value={overview.totalLogins}
          delta={overview.loginDelta ?? null}
          description="Hoạt động xác thực được ghi nhận từ sự kiện."
          icon={<LogIn className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          title="Tin nhắn"
          value={overview.totalMessages}
          delta={overview.messageDelta ?? null}
          description="Tổng số tin nhắn đã được ghi nhận."
          icon={<MessageSquareText className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          title="Bài viết"
          value={overview.totalPosts}
          delta={overview.postDelta ?? null}
          description="Số lượng nội dung mạng xã hội trong khoảng đã chọn."
          icon={<FileText className="h-5 w-5" />}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Người dùng hoạt động ngày"
          value={overview.dau}
          description="Số người dùng hoạt động trong ngày."
          icon={<Activity className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          title="Người dùng hoạt động tháng"
          value={overview.mau}
          description="Số người dùng hoạt động trong 30 ngày."
          icon={<Database className="h-5 w-5" />}
          tone="neutral"
        />
        <StatCard
          title="Đăng ký trong kỳ"
          value={totalRegistrationsInRange}
          description="Tài khoản mới từ sự kiện đăng ký."
        />
        <StatCard
          title="Đăng nhập trong kỳ"
          value={totalLoginEventsInRange}
          description="Sự kiện đăng nhập trong khoảng đã chọn."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Đăng ký TB / ngày"
          value={avgDailyRegistrations}
          description="Số đăng ký trung bình mỗi ngày."
        />
        <StatCard
          title="Đăng nhập TB / ngày"
          value={avgDailyLogins}
          description="Số đăng nhập trung bình mỗi ngày."
        />
        {peakRegistrationDay && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Ngày đăng ký cao nhất</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {peakRegistrationDay.registrations.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">{peakRegistrationDay.date}</p>
          </div>
        )}
        {peakLoginDay && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Ngày đăng nhập cao nhất</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {peakLoginDay.logins.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">{peakLoginDay.date}</p>
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Trạng thái dịch vụ
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center justify-between">
              <span>Analytics API</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Đang hoạt động
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Nguồn dữ liệu</span>
              <span className="font-medium text-slate-900">analytic-service :8092</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Chế độ ghi nhận</span>
              <span className="font-medium text-slate-900">Sự kiện RabbitMQ</span>
            </li>
          </ul>
        </div>
      </div>

      <Charts
        title="Đăng ký và đăng nhập theo ngày"
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
