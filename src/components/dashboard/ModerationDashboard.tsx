import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Ban,
  Bot,
  Clock3,
  ShieldAlert,
  UserRoundCog,
} from "lucide-react";
import StatCard from "../admin/StatCard";
import AdminTable from "../admin/AdminTable";
import ErrorState from "../admin/ErrorState";
import { adminService } from "../../services/adminService";
import type {
  AuditLog,
  ModerationDashboardResponse,
} from "../../interfaces/admin.interface";

const actionBadgeClassName = (actionType: string) => {
  switch (actionType.toUpperCase()) {
    case "BLOCK":
      return "border border-red-200 bg-red-50 text-red-700";
    case "UNBLOCK":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SOFT_DELETE":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    case "RESTORE":
      return "border border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border border-amber-200 bg-amber-50 text-amber-700";
  }
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatDuration = (durationMinutes: number | null) => {
  if (durationMinutes == null) {
    return "Permanent";
  }

  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  if (durationMinutes % 1440 === 0) {
    return `${durationMinutes / 1440}d`;
  }

  if (durationMinutes % 60 === 0) {
    return `${durationMinutes / 60}h`;
  }

  return `${durationMinutes} min`;
};

const ModerationDashboard: React.FC = () => {
  const [data, setData] = useState<ModerationDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.getModerationDashboard();
      setData(response);
    } catch (err) {
      console.error("Failed to load moderation dashboard", err);
      setError(
        "The moderation dashboard could not load data from analytic-service.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const recentLogs = data?.recentLogs ?? [];

  const autoActions = useMemo(
    () => recentLogs.filter((log) => log.adminId === "SYSTEM").length,
    [recentLogs],
  );

  const temporaryActions = useMemo(
    () => recentLogs.filter((log) => log.durationMinutes !== null).length,
    [recentLogs],
  );

  const uniqueTargets = useMemo(
    () => new Set(recentLogs.map((log) => log.targetUserId).filter(Boolean)).size,
    [recentLogs],
  );

  if (error) {
    return (
      <ErrorState
        title="Moderation dashboard is unavailable"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        Loading moderation analytics...
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
            Moderation
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Moderation Analytics
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Review recent enforcement actions, automated system bans, and actor-level
            moderation activity captured from the event pipeline.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Source: <span className="font-medium text-slate-900">analytic-service</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total banned users"
          value={data?.totalBannedUsers ?? 0}
          description="Current count based on BLOCK audit actions."
          icon={<Ban className="h-5 w-5" />}
          tone="danger"
        />
        <StatCard
          title="Recent log entries"
          value={recentLogs.length}
          description="Latest moderation events returned by the dashboard endpoint."
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          title="System-triggered actions"
          value={autoActions}
          description="Events where the actor was normalized to SYSTEM."
          icon={<Bot className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          title="Temporary actions"
          value={temporaryActions}
          description="Recent actions with a finite moderation duration."
          icon={<Clock3 className="h-5 w-5" />}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AdminTable<AuditLog>
          columns={[
            {
              key: "createdAt",
              label: "Timestamp",
              className: "whitespace-nowrap",
              render: (row) => formatTimestamp(row.createdAt),
            },
            {
              key: "adminId",
              label: "Actor",
              className: "whitespace-nowrap font-medium text-slate-900",
            },
            {
              key: "targetUserId",
              label: "Target User",
              className: "whitespace-nowrap",
            },
            {
              key: "actionType",
              label: "Action",
              className: "whitespace-nowrap",
              render: (row) => (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${actionBadgeClassName(row.actionType)}`}
                >
                  {row.actionType}
                </span>
              ),
            },
            {
              key: "reason",
              label: "Reason",
              className: "max-w-md",
              render: (row) => row.reason?.trim() || "No reason provided",
            },
            {
              key: "durationMinutes",
              label: "Duration",
              className: "whitespace-nowrap",
              render: (row) => formatDuration(row.durationMinutes),
            },
          ]}
          rows={recentLogs}
          emptyTitle="No moderation logs yet"
          emptyDescription="The dashboard will populate after user.status.changed events are consumed."
        />

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Enforcement snapshot
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Unique targets in recent logs</span>
                <span className="text-sm font-semibold text-slate-900">
                  {uniqueTargets}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Manual actions</span>
                <span className="text-sm font-semibold text-slate-900">
                  {recentLogs.length - autoActions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Automated actions</span>
                <span className="text-sm font-semibold text-slate-900">
                  {autoActions}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
                <UserRoundCog className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Moderation feed behavior
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Logs are sourced from the RabbitMQ moderation stream and stored
                  after idempotency checks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ModerationDashboard;
