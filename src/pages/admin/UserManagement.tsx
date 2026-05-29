import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Ban, Check, Copy, RotateCcw, Unlock, UserX, X } from "lucide-react";
import AdminTable from "../../components/admin/AdminTable";
import { useAdminAnalytics } from "../../components/admin/AdminAnalyticsContext";
import ErrorState from "../../components/admin/ErrorState";
import { adminService } from "../../services/adminService";
import type {
  AdminUserStatusAction,
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

const isSelfDeletedUser = (user: UserSummary) =>
  Boolean(user.deletedAt) || Boolean(user.email?.includes("_deleted_"));

const getUserStatusLabel = (user: UserSummary) => {
  if (isSelfDeletedUser(user)) return "Da tu xoa";
  if (user.isBlocked) return "Dang bi khoa";
  if (user.isActive === false) return "Da vo hieu hoa";
  if (user.isActive === true) return "Dang hoat dong";
  return "Chua dong bo";
};

const getUserStatusClassName = (user: UserSummary) => {
  if (isSelfDeletedUser(user)) return "bg-slate-100 text-slate-600";
  if (user.isBlocked) return "bg-red-50 text-red-700";
  if (user.isActive === false) return "bg-amber-50 text-amber-700";
  if (user.isActive === true) return "bg-emerald-50 text-emerald-700";
  return "bg-slate-100 text-slate-500";
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
  const [statusModal, setStatusModal] = useState<{
    user: UserSummary;
    actionType: Extract<AdminUserStatusAction, "BLOCK" | "DEACTIVATE">;
  } | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusDuration, setStatusDuration] = useState("1440");
  const [statusPermanent, setStatusPermanent] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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

  const openStatusModal = (
    user: UserSummary,
    actionType: Extract<AdminUserStatusAction, "BLOCK" | "DEACTIVATE">,
  ) => {
    setStatusModal({ user, actionType });
    setStatusReason("");
    setStatusDuration("1440");
    setStatusPermanent(false);
    setActionError(null);
  };

  const closeStatusModal = () => {
    if (actionUserId) return;
    setStatusModal(null);
    setStatusReason("");
    setStatusDuration("1440");
    setStatusPermanent(false);
    setActionError(null);
  };

  const applyStatusUpdate = async (
    user: UserSummary,
    actionType: AdminUserStatusAction,
    options?: {
      reason?: string | null;
      durationMinutes?: number | null;
      isPermanent?: boolean | null;
    },
  ) => {
    setActionUserId(user.userId);
    setActionError(null);

    try {
      const updated = await adminService.updateUserStatus(user.userId, {
        actionType,
        reason: options?.reason ?? null,
        durationMinutes: options?.durationMinutes ?? null,
        isPermanent: options?.isPermanent ?? null,
      });

      setUsers((current) =>
        current.map((item) =>
          item.userId === user.userId
            ? {
                ...item,
                isActive: updated.isActive,
                isBlocked: updated.isBlocked,
                blockedUntil: updated.blockedUntil,
                blockedReason: updated.blockedReason,
                deletedAt: updated.deletedAt,
              }
            : item,
        ),
      );
      setStatusModal(null);
    } catch (err) {
      console.error("Failed to update user status", err);
      setActionError("Khong the cap nhat trang thai tai khoan.");
    } finally {
      setActionUserId(null);
    }
  };

  const submitStatusModal = async () => {
    if (!statusModal) return;

    const reason = statusReason.trim();
    if (statusModal.actionType === "BLOCK" && !reason) {
      setActionError("Can nhap ly do khoa tai khoan.");
      return;
    }

    const durationMinutes = statusPermanent
      ? null
      : Number.parseInt(statusDuration, 10);
    if (
      statusModal.actionType === "BLOCK" &&
      !statusPermanent &&
      (!Number.isFinite(durationMinutes) || durationMinutes <= 0)
    ) {
      setActionError("Thoi luong khoa phai lon hon 0 phut.");
      return;
    }

    await applyStatusUpdate(statusModal.user, statusModal.actionType, {
      reason,
      durationMinutes:
        statusModal.actionType === "BLOCK" ? durationMinutes : null,
      isPermanent: statusModal.actionType === "BLOCK" ? statusPermanent : null,
    });
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
            {
              key: "blockedUntil",
              label: "Trang thai",
              render: (user) => (
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getUserStatusClassName(user)}`}
                  >
                    {getUserStatusLabel(user)}
                  </span>
                  {user.blockedUntil && (
                    <span className="text-xs text-slate-500">
                      Den {formatDateTime(user.blockedUntil)}
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: "deletedAt",
              label: "Hanh dong",
              render: (user) => {
                const busy = actionUserId === user.userId;
                if (isSelfDeletedUser(user)) {
                  return (
                    <span className="text-xs text-slate-500">
                      Khong kha dung
                    </span>
                  );
                }

                if (user.isBlocked) {
                  return (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void applyStatusUpdate(user, "UNBLOCK")}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      Mo khoa
                    </button>
                  );
                }

                if (user.isActive === false) {
                  return (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void applyStatusUpdate(user, "RESTORE")}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Khoi phuc
                    </button>
                  );
                }

                return (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || user.isActive == null}
                      onClick={() => openStatusModal(user, "BLOCK")}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Khoa
                    </button>
                    <button
                      type="button"
                      disabled={busy || user.isActive == null}
                      onClick={() => openStatusModal(user, "DEACTIVATE")}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Vo hieu hoa
                    </button>
                  </div>
                );
              },
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

      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  {statusModal.actionType === "BLOCK"
                    ? "Khoa tai khoan"
                    : "Vo hieu hoa tai khoan"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {statusModal.user.email ?? statusModal.user.userId}
                </p>
              </div>
              <button
                type="button"
                onClick={closeStatusModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                aria-label="Dong"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">
                  Ly do
                </span>
                <textarea
                  value={statusReason}
                  onChange={(event) => setStatusReason(event.target.value)}
                  rows={3}
                  className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400"
                  placeholder="Nhap ly do de luu vao audit log"
                />
              </label>

              {statusModal.actionType === "BLOCK" && (
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700">
                      Thoi luong khoa (phut)
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={statusDuration}
                      disabled={statusPermanent}
                      onChange={(event) => setStatusDuration(event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={statusPermanent}
                      onChange={(event) => setStatusPermanent(event.target.checked)}
                      className="h-4 w-4"
                    />
                    Vinh vien
                  </label>
                </div>
              )}

              {actionError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {actionError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeStatusModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Huy
              </button>
              <button
                type="button"
                disabled={Boolean(actionUserId)}
                onClick={() => void submitStatusModal()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                Xac nhan
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
};

export default UserManagement;
