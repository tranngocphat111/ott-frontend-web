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
      setError("The dashboard could not load analytics data from the backend.");
    } finally {
      setLoading(false);
    }
  };

  const messageChartData: EventReport[] = useMemo(
    () => [
      { title: "Text", value: messageTypes.text, color: "#6366f1" },
      { title: "Image", value: messageTypes.image, color: "#22c55e" },
      { title: "Voice", value: messageTypes.voice, color: "#f59e0b" },
    ],
    [messageTypes],
  );

  const loginMethodChartData: EventReport[] = useMemo(() => {
    const labelMap: Record<string, string> = {
      local: "Local",
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
      ["Avg Registrations / Day", avgDailyRegistrations],
      ["Avg Logins / Day", avgDailyLogins],
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
        title="Dashboard is unavailable"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        Loading admin dashboard...
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
            Overview
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            OTT Platform Operations
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Monitor growth, engagement, and service health across the analytics
            event pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Source: <span className="font-medium text-slate-900">analytic-service</span>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total users"
          value={overview.totalUsers}
          delta={overview.userDelta ?? null}
          description="Registered accounts in the selected range."
          icon={<Users className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          title="Login events"
          value={overview.totalLogins}
          delta={overview.loginDelta ?? null}
          description="Authentication activity captured by event consumers."
          icon={<LogIn className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          title="Messages"
          value={overview.totalMessages}
          delta={overview.messageDelta ?? null}
          description="Total message throughput ingested for analytics."
          icon={<MessageSquareText className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          title="Posts"
          value={overview.totalPosts}
          delta={overview.postDelta ?? null}
          description="Social content creation volume in the selected range."
          icon={<FileText className="h-5 w-5" />}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Daily active users"
          value={overview.dau}
          description="Distinct users active per day."
          icon={<Activity className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          title="Monthly active users"
          value={overview.mau}
          description="Distinct users active per month."
          icon={<Database className="h-5 w-5" />}
          tone="neutral"
        />
        <StatCard
          title="Registrations in range"
          value={totalRegistrationsInRange}
          description="New accounts aggregated from registration events."
        />
        <StatCard
          title="Logins in range"
          value={totalLoginEventsInRange}
          description="Authentication events inside the selected period."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Avg registrations / day"
          value={avgDailyRegistrations}
          description="Average daily signups in this period."
        />
        <StatCard
          title="Avg logins / day"
          value={avgDailyLogins}
          description="Average daily authentication load."
        />
        {peakRegistrationDay && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Peak registration day</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {peakRegistrationDay.registrations.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">{peakRegistrationDay.date}</p>
          </div>
        )}
        {peakLoginDay && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Peak login day</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {peakLoginDay.logins.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">{peakLoginDay.date}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Charts
          title="Message type distribution"
          data={messageChartData}
          variant="pie"
        />
        <Charts
          title="Login method distribution"
          data={loginMethodChartData}
          variant="pie"
        />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Service posture
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center justify-between">
              <span>Analytics API</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Online
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Data source</span>
              <span className="font-medium text-slate-900">analytic-service :8092</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Ingestion mode</span>
              <span className="font-medium text-slate-900">RabbitMQ events</span>
            </li>
          </ul>
        </div>
      </div>

      <Charts
        title="User registrations and logins by day"
        data={userTrendChartData}
        variant="area"
        series={[
          {
            key: "registrations",
            label: "Registrations",
            stroke: "#8b5cf6",
            fillId: "fillRegistrations",
            gradientStop: "#8b5cf6",
          },
          {
            key: "logins",
            label: "Logins",
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
