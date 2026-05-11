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
          console.error("Không thể tải danh sách người dùng gần đây", err);
          setError("Không thể tải danh sách người dùng. Vui lòng thử lại.");
        } finally {
          setLoading(false);
        }
      };

      void load();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [timeRange, query, page, retryNonce]);

  const emptyMessage = useMemo(() => {
    return query.trim()
      ? "Không tìm thấy người dùng phù hợp với từ khóa."
      : "Không có người dùng gần đây trong khoảng thời gian này.";
  }, [query]);

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
        title="Danh sách người dùng không sẵn sàng"
        description={error}
        onRetry={() => setRetryNonce((current) => current + 1)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-white border shadow-sm min-h-80 rounded-xl border-slate-200 text-slate-500">
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
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Quản lý người dùng
          </h2>
          <p className="text-sm text-slate-500">
            {pagination.totalElements} kết quả • Trang {pagination.page + 1}/
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
              placeholder="Tìm theo userId, email, hoặc họ tên"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
            />
          </label>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
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
            { key: "userId", label: "Mã người dùng" },
            { key: "email", label: "Email" },
            { key: "fullName", label: "Họ và tên" },
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
          Trang trước
        </button>

        <span className="text-sm text-slate-500">
          Hiển thị {users.length} / {pagination.totalElements} bản ghi
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={
            page >= pagination.totalPages - 1 || pagination.totalPages === 0
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trang sau
        </button>
      </div>
    </motion.section>
  );
};

export default UserManagement;
