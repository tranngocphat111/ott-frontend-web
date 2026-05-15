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
        console.error("Failed to load audit logs", err);
        setError("The audit log feed could not be loaded.");
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
        createdAt: new Date(log.createdAt).toLocaleString("en-GB"),
      })),
    [logs],
  );

  const goPrev = () => setPage((current) => Math.max(0, current - 1));
  const goNext = () =>
    setPage((current) => Math.min(pagination.totalPages - 1, current + 1));

  if (error) {
    return (
      <ErrorState
        title="Audit log view is unavailable"
        description={error}
        onRetry={() => setRetryNonce((current) => current + 1)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        Loading audit logs...
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
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Audit
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Audit Logs
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {pagination.totalElements} records - page {pagination.page + 1} of{" "}
            {Math.max(pagination.totalPages, 1)}
          </p>
        </div>
      </div>

      <AdminTable
        columns={[
          { key: "id", label: "Log ID", className: "font-medium text-slate-900" },
          { key: "adminId", label: "Actor" },
          { key: "actionType", label: "Action" },
          { key: "targetUserId", label: "Target User" },
          { key: "createdAt", label: "Timestamp" },
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
          Previous
        </button>

        <span className="text-sm text-slate-500">
          Showing {rows.length} of {pagination.totalElements} records
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

export default AuditLogs;
