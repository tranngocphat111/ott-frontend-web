import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Eye, X } from "lucide-react";
import AdminTable from "../../components/admin/AdminTable";
import ErrorState from "../../components/admin/ErrorState";
import { adminService } from "../../services/adminService";
import type {
  AuditLog,
  PaginatedAuditLogsResponse,
} from "../../interfaces/admin.interface";

const PAGE_SIZE = 10;

type AuditJsonValue = Record<string, unknown>;

type StatusSnapshot = {
  isActive?: boolean | null;
  isBlocked?: boolean | null;
  blockedUntil?: string | null;
  blockedReason?: string | null;
  deletedAt?: string | null;
};

type AuditDisplayRow = AuditLog & {
  actionLabel: string;
  oldStatusLabel: string;
  newStatusLabel: string;
  createdAtLabel: string;
  details: string;
};

const ACTION_LABELS: Record<string, string> = {
  USER_BLOCK: "Khoa tai khoan",
  USER_UNBLOCK: "Mo khoa",
  USER_DEACTIVATE: "Vo hieu hoa",
  USER_RESTORE: "Khoi phuc",
  RULE_CREATE: "Them quy tac",
  RULE_UPDATE: "Cap nhat quy tac",
  RULE_ENABLE: "Bat quy tac",
  RULE_DISABLE: "Tat quy tac",
};

const ACTION_CLASS_NAMES: Record<string, string> = {
  USER_BLOCK: "border-red-200 bg-red-50 text-red-700",
  USER_UNBLOCK: "border-emerald-200 bg-emerald-50 text-emerald-700",
  USER_DEACTIVATE: "border-amber-200 bg-amber-50 text-amber-700",
  USER_RESTORE: "border-indigo-200 bg-indigo-50 text-indigo-700",
  RULE_CREATE: "border-sky-200 bg-sky-50 text-sky-700",
  RULE_UPDATE: "border-slate-200 bg-slate-50 text-slate-700",
  RULE_ENABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RULE_DISABLE: "border-amber-200 bg-amber-50 text-amber-700",
};

const formatJsonPreview = (value?: string | null) => {
  if (!value) return "-";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

const parseAuditJson = (value?: string | null): AuditJsonValue | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is AuditJsonValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const extractStatusSnapshot = (
  value?: string | null,
): StatusSnapshot | null => {
  const parsed = parseAuditJson(value);
  if (!parsed) return null;

  const snapshot = parsed.statusSnapshot;
  if (isRecord(snapshot)) {
    return snapshot as StatusSnapshot;
  }

  if (
    "isActive" in parsed ||
    "isBlocked" in parsed ||
    "deletedAt" in parsed
  ) {
    return parsed as StatusSnapshot;
  }

  return null;
};

const describeStatus = (snapshot: StatusSnapshot | null) => {
  if (!snapshot) return "-";
  if (snapshot.deletedAt) return "Da xoa";
  if (snapshot.isBlocked) return "Dang bi khoa";
  if (snapshot.isActive === false) return "Da vo hieu hoa";
  if (snapshot.isActive === true) return "Dang hoat dong";
  return "Khong ro";
};

const getActionLabel = (actionType: string) =>
  ACTION_LABELS[actionType] ?? actionType;

const getActionClassName = (actionType: string) =>
  ACTION_CLASS_NAMES[actionType] ?? "border-slate-200 bg-slate-50 text-slate-700";

const getStatusClassName = (label: string) => {
  if (label === "Dang hoat dong") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (label === "Dang bi khoa") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (label === "Da vo hieu hoa") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (label === "Da xoa") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-slate-200 bg-white text-slate-500";
};

const ShortValue: React.FC<{ value?: string | null; max?: number }> = ({
  value,
  max = 12,
}) => {
  if (!value) return <span>-</span>;
  const shouldTrim = value.length > max * 2 + 3;
  const displayValue = shouldTrim
    ? `${value.slice(0, max)}...${value.slice(-max)}`
    : value;

  return (
    <span title={value} className="font-mono text-xs font-semibold text-slate-900">
      {displayValue}
    </span>
  );
};

const StatusPill: React.FC<{ label: string }> = ({ label }) => (
  <span
    className={`inline-flex min-w-28 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClassName(label)}`}
  >
    {label}
  </span>
);

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditDisplayRow | null>(null);
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
      logs.map((log): AuditDisplayRow => {
        const oldStatusLabel = describeStatus(
          extractStatusSnapshot(log.oldValue),
        );
        const newStatusLabel = describeStatus(
          extractStatusSnapshot(log.newValue),
        );

        return {
          ...log,
          actionLabel: getActionLabel(log.actionType),
          oldStatusLabel,
          newStatusLabel,
          createdAtLabel: new Date(log.createdAt).toLocaleString("vi-VN"),
          details: "details",
        };
      }),
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
      <div className="flex items-center justify-center bg-white border shadow-sm min-h-80 rounded-xl border-slate-200 text-slate-500">
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
      <div className="flex flex-col gap-4 p-5 bg-white border shadow-sm rounded-xl border-slate-200 md:flex-row md:items-end md:justify-between">
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
          {
            key: "eventId",
            label: "Su kien",
            render: (log) => <ShortValue value={log.eventId || log.id} />,
          },
          {
            key: "adminId",
            label: "Nguoi thuc hien",
            render: (log) => <ShortValue value={log.adminId} />,
          },
          {
            key: "actionType",
            label: "Hanh dong",
            render: (log) => (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionClassName(log.actionType)}`}
              >
                {log.actionLabel}
              </span>
            ),
          },
          {
            key: "targetUserId",
            label: "Doi tuong",
            render: (log) => <ShortValue value={log.targetUserId} />,
          },
          {
            key: "reason",
            label: "Ly do",
            render: (log) => (
              <span className="line-clamp-2 max-w-56 text-slate-600">
                {log.reason || "-"}
              </span>
            ),
          },
          {
            key: "oldStatusLabel",
            label: "Truoc",
            render: (log) => <StatusPill label={log.oldStatusLabel} />,
          },
          {
            key: "newStatusLabel",
            label: "Sau",
            render: (log) => (
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <StatusPill label={log.newStatusLabel} />
              </div>
            ),
          },
          { key: "createdAtLabel", label: "Thoi gian" },
          {
            key: "details",
            label: "",
            render: (log) => (
              <button
                type="button"
                onClick={() => setSelectedLog(log)}
                className="inline-flex items-center justify-center transition border rounded-lg h-9 w-9 border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                title="Xem chi tiet"
                aria-label="Xem chi tiet nhat ky"
              >
                <Eye className="w-4 h-4" />
              </button>
            ),
          },
        ]}
        rows={rows}
        emptyTitle="Chua co nhat ky quan tri"
        emptyDescription="Cac hanh dong cua admin se hien thi sau khi analytic-service ghi nhan event."
      />

      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border shadow-sm rounded-xl border-slate-200">
        <button
          type="button"
          onClick={goPrev}
          disabled={page <= 0}
          className="px-3 py-2 text-sm font-medium transition border rounded-lg border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="px-3 py-2 text-sm font-medium transition border rounded-lg border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-log-detail-title"
          onMouseDown={() => setSelectedLog(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  Chi tiet nhat ky
                </p>
                <h3
                  id="audit-log-detail-title"
                  className="mt-1 text-lg font-semibold text-slate-950"
                >
                  {selectedLog.actionLabel}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="inline-flex items-center justify-center transition border rounded-lg h-9 w-9 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                title="Dong"
                aria-label="Dong chi tiet nhat ky"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-76px)] overflow-y-auto p-5">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-3 border rounded-lg border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Event
                  </p>
                  <p className="mt-2 font-mono text-xs break-all text-slate-900">
                    {selectedLog.eventId || selectedLog.id}
                  </p>
                </div>
                <div className="p-3 border rounded-lg border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Admin
                  </p>
                  <p className="mt-2 font-mono text-xs break-all text-slate-900">
                    {selectedLog.adminId}
                  </p>
                </div>
                <div className="p-3 border rounded-lg border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Doi tuong
                  </p>
                  <p className="mt-2 font-mono text-xs break-all text-slate-900">
                    {selectedLog.targetUserId || "-"}
                  </p>
                </div>
                <div className="p-3 border rounded-lg border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Thoi gian
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {selectedLog.createdAtLabel}
                  </p>
                </div>
              </div>

              <div className="p-4 mt-4 border rounded-lg border-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Ly do
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {selectedLog.reason || "-"}
                </p>
              </div>

              <div className="grid gap-4 mt-4 lg:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Truoc
                    </p>
                    <StatusPill label={selectedLog.oldStatusLabel} />
                  </div>
                  <pre className="p-4 overflow-auto text-xs leading-relaxed border rounded-lg max-h-96 border-slate-200 bg-slate-950 text-slate-100">
                    {formatJsonPreview(selectedLog.oldValue)}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Sau
                    </p>
                    <StatusPill label={selectedLog.newStatusLabel} />
                  </div>
                  <pre className="p-4 overflow-auto text-xs leading-relaxed border rounded-lg max-h-96 border-slate-200 bg-slate-950 text-slate-100">
                    {formatJsonPreview(selectedLog.newValue)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.section>
  );
};

export default AuditLogs;
