import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AdminTable from "../../components/admin/AdminTable";
import ErrorState from "../../components/admin/ErrorState";
import { adminService } from "../../services/adminService";
import type {
  AuditLog,
  PaginatedAuditLogsResponse,
} from "../../interfaces/admin.interface";

const PAGE_SIZE = 10;

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: PAGE_SIZE,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: PaginatedAuditLogsResponse =
          await adminService.getAuditLogsPage({
            page,
            size: PAGE_SIZE,
          });

        setLogs(response.items);
        setPagination({
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          page: response.page,
          size: response.size,
        });
      } catch (err) {
        console.error("Không thể tải nhật ký hệ thống", err);
        setError("Không thể tải nhật ký hệ thống. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [page, retryNonce]);

  const rows = useMemo(
    () =>
      logs.map((log) => ({
        ...log,
        timestamp: new Date(log.timestamp).toLocaleString("vi-VN"),
      })),
    [logs],
  );

  const goPrev = () => setPage((current) => Math.max(0, current - 1));
  const goNext = () =>
    setPage((current) => Math.min(pagination.totalPages - 1, current + 1));

  if (error) {
    return (
      <ErrorState
        title="Nhật ký hệ thống không sẵn sàng"
        description={error}
        onRetry={() => setRetryNonce((current) => current + 1)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-white border shadow-sm min-h-80 rounded-xl border-slate-200 text-slate-500">
        Đang tải nhật ký hệ thống...
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
            Nhật ký hệ thống
          </h2>
          <p className="text-sm text-slate-500">
            {pagination.totalElements} bản ghi • Trang {pagination.page + 1}/
            {Math.max(pagination.totalPages, 1)}
          </p>
        </div>
      </div>

      <AdminTable
        columns={[
          { key: "id", label: "ID" },
          { key: "adminId", label: "Admin" },
          { key: "actionType", label: "Hành động" },
          { key: "targetId", label: "Đối tượng" },
          { key: "timestamp", label: "Thời gian" },
        ]}
        rows={rows}
      />

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
          Hiển thị {rows.length} / {pagination.totalElements} bản ghi
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

export default AuditLogs;
