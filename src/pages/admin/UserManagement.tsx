import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AdminTable from "../../components/admin/AdminTable";
import { useAdminAnalytics } from "../../components/admin/AdminAnalyticsContext";
import ErrorState from "../../components/admin/ErrorState";
import { adminService } from "../../services/adminService";
import type {
  PaginatedRecentUsersResponse,
  UserSummary,
} from "../../interfaces/admin.interface";

const PAGE_SIZE = 10;

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

const UserManagement: React.FC = () => {
  const { timeRange } = useAdminAnalytics();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: PAGE_SIZE,
  });

  useEffect(() => {
    setPage(0);
  }, [timeRange]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const load = async () => {
        setLoading(true);
        setError(null);

        try {
          const response: PaginatedRecentUsersResponse =
            await adminService.getRecentUsersPage(timeRange, {
              query,
              page,
              size: PAGE_SIZE,
            });

          setUsers(response.items);
          setPagination({
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            page: response.page,
            size: response.size,
          });
        } catch (err) {
          console.error("Failed to load recent users", err);
          setError("The recent users dataset could not be loaded.");
        } finally {
          setLoading(false);
        }
      };

      void load();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [timeRange, query, page, retryNonce]);

  const emptyMessage = useMemo(
    () =>
      query.trim()
        ? "No users matched the current search query."
        : "No recent users were returned for the selected time range.",
    [query],
  );

  const goPrev = () => setPage((current) => Math.max(0, current - 1));
  const goNext = () =>
    setPage((current) => Math.min(pagination.totalPages - 1, current + 1));

  const handleExportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ["User ID", "Email", "Full Name"],
      ...users.map((user) => [
        user.userId,
        user.email ?? "",
        user.fullName ?? "",
      ]),
    ];

    downloadCsv(`recent-users-${timeRange}-page-${page + 1}.csv`, rows);
  };

  if (error) {
    return (
      <ErrorState
        title="Recent users view is unavailable"
        description={error}
        onRetry={() => setRetryNonce((current) => current + 1)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        Loading recent users...
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
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Users
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Recent User Intake
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {pagination.totalElements} records - page {pagination.page + 1} of{" "}
            {Math.max(pagination.totalPages, 1)}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:flex-1 md:flex-row md:items-end md:justify-end">
          <label className="flex flex-1 flex-col gap-1 md:max-w-md">
            <span className="text-sm font-medium text-slate-600">Search</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Search by user ID, email, or full name"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
            />
          </label>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Export CSV
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500 shadow-sm">
          {emptyMessage}
        </div>
      ) : (
        <AdminTable
          columns={[
            {
              key: "userId",
              label: "User ID",
              className: "whitespace-nowrap font-medium text-slate-900",
            },
            { key: "email", label: "Email" },
            { key: "fullName", label: "Full Name" },
          ]}
          rows={users}
        />
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={goPrev}
          disabled={page <= 0}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm text-slate-500">
          Showing {users.length} of {pagination.totalElements} records
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={
            page >= pagination.totalPages - 1 || pagination.totalPages === 0
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </motion.section>
  );
};

export default UserManagement;
