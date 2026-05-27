import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import AdminTable from "../../components/admin/AdminTable";
import { useAdminAnalytics } from "../../components/admin/AdminAnalyticsContext";
import ErrorState from "../../components/admin/ErrorState";
import { adminService } from "../../services/adminService";
import type {
  PaginatedRecentUsersResponse,
  UserSummary,
} from "../../interfaces/admin.interface";

const PAGE_SIZE = 10;

const shortenUserId = (userId: string) => {
  if (userId.length <= 14) return userId;
  return `${userId.slice(0, 8)}...${userId.slice(-6)}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Chưa ghi nhận";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

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
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
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
          setError("Không thể tải danh sách người dùng gần đây.");
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
        ? "Không tìm thấy người dùng phù hợp với từ khóa hiện tại."
        : "Chưa có người dùng nào trong khoảng thời gian đã chọn.",
    [query],
  );

  const goPrev = () => setPage((current) => Math.max(0, current - 1));
  const goNext = () =>
    setPage((current) => Math.min(pagination.totalPages - 1, current + 1));

  const handleExportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ["ID người dùng", "Email", "Họ tên", "Thời gian đăng ký", "Trạng thái đồng bộ"],
      ...users.map((user) => [
        user.userId,
        user.email ?? "",
        user.fullName ?? "",
        user.registeredAt ?? "",
        user.profileSynced ? "Đã đồng bộ" : "Chưa đồng bộ",
      ]),
    ];

    downloadCsv(`recent-users-${timeRange}-page-${page + 1}.csv`, rows);
  };

  const handleCopyUserId = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedUserId(userId);
      window.setTimeout(() => setCopiedUserId(null), 1500);
    } catch (err) {
      console.error("Failed to copy user ID", err);
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Không thể hiển thị danh sách người dùng"
        description={error}
        onRetry={() => setRetryNonce((current) => current + 1)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
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
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Người dùng
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Người dùng gần đây
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {pagination.totalElements} bản ghi - trang {pagination.page + 1}/
            {Math.max(pagination.totalPages, 1)}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:flex-1 md:flex-row md:items-end md:justify-end">
          <label className="flex flex-1 flex-col gap-1 md:max-w-md">
            <span className="text-sm font-medium text-slate-600">Tìm kiếm</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Tìm theo ID, email hoặc họ tên"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
            />
          </label>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Xuất CSV
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
              label: "ID người dùng",
              className: "whitespace-nowrap font-medium text-slate-900",
              render: (user) => (
                <div className="flex items-center gap-2">
                  <span title={user.userId}>{shortenUserId(user.userId)}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopyUserId(user.userId)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                    title="Sao chép ID"
                    aria-label="Sao chép ID người dùng"
                  >
                    {copiedUserId === user.userId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ),
            },
            {
              key: "email",
              label: "Email",
              render: (user) =>
                user.email ? (
                  user.email
                ) : (
                  <span className="text-amber-600">Chưa đồng bộ</span>
                ),
            },
            {
              key: "fullName",
              label: "Họ tên",
              render: (user) =>
                user.fullName ? (
                  user.fullName
                ) : (
                  <span className="text-amber-600">Chưa đồng bộ</span>
                ),
            },
            {
              key: "registeredAt",
              label: "Đăng ký lúc",
              render: (user) => formatDateTime(user.registeredAt),
            },
            {
              key: "profileSynced",
              label: "Đồng bộ",
              render: (user) => (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    user.profileSynced
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {user.profileSynced ? "Đã đồng bộ" : "Thiếu hồ sơ"}
                </span>
              ),
            },
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
          Trước
        </button>

        <span className="text-sm text-slate-500">
          Hiển thị {users.length}/{pagination.totalElements} bản ghi
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={
            page >= pagination.totalPages - 1 || pagination.totalPages === 0
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </motion.section>
  );
};

export default UserManagement;
