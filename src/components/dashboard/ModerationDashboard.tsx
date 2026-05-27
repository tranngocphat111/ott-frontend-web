import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Ban,
  FileText,
  ImageOff,
  MessageSquareWarning,
  ShieldAlert,
} from "lucide-react";
import StatCard from "../admin/StatCard";
import AdminTable from "../admin/AdminTable";
import ErrorState from "../admin/ErrorState";
import ModerationRulesManager from "./ModerationRulesManager";
import { adminService } from "../../services/adminService";
import type {
  AuditLog,
  ContentViolationLog,
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
  if (!value) return "-";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatDuration = (durationMinutes: number | null) => {
  if (durationMinutes == null) {
    return "Vĩnh viễn";
  }

  if (durationMinutes < 60) {
    return `${durationMinutes} phút`;
  }

  if (durationMinutes % 1440 === 0) {
    return `${durationMinutes / 1440} ngày`;
  }

  if (durationMinutes % 60 === 0) {
    return `${durationMinutes / 60} giờ`;
  }

  return `${durationMinutes} phút`;
};

const sourceLabel = (source: string | null) => {
  switch ((source || "").toLowerCase()) {
    case "chat-service":
      return "Tin nhắn";
    case "media-service":
      return "Bài đăng / hồ sơ";
    default:
      return source || "-";
  }
};

const contentTypeLabel = (type: string | null) => {
  switch ((type || "").toUpperCase()) {
    case "TEXT":
      return "Văn bản";
    case "IMAGE":
      return "Hình ảnh";
    default:
      return type || "-";
  }
};

const violationTypeLabel = (type: string | null) => {
  switch ((type || "").toUpperCase()) {
    case "TEXT_PROFANITY":
      return "Từ khóa vi phạm";
    case "IMAGE_UNSAFE_CONTENT":
      return "Hình ảnh không an toàn";
    default:
      return type || "-";
  }
};

const severityClassName = (severity: string | null) => {
  switch ((severity || "").toUpperCase()) {
    case "CRITICAL":
    case "HIGH":
      return "border-red-200 bg-red-50 text-red-700";
    case "MEDIUM":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const severityLabel = (severity: string | null) => {
  switch ((severity || "").toUpperCase()) {
    case "CRITICAL":
      return "Rất cao";
    case "HIGH":
      return "Cao";
    case "MEDIUM":
      return "Trung bình";
    case "LOW":
      return "Thấp";
    default:
      return "Không rõ";
  }
};

const formatLabels = (labels: string | null) => {
  const values = String(labels || "")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);

  return values.length > 0 ? values.join(", ") : "-";
};

const actionLabel = (actionType: string) => {
  switch (actionType.toUpperCase()) {
    case "BLOCK":
      return "Khóa";
    case "UNBLOCK":
      return "Mở khóa";
    case "SOFT_DELETE":
      return "Ẩn mềm";
    case "RESTORE":
      return "Khôi phục";
    default:
      return actionType;
  }
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
      setError("Không thể tải dữ liệu kiểm duyệt từ analytic-service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const recentLogs = data?.recentLogs ?? [];
  const recentContentViolations = data?.recentContentViolations ?? [];

  const imageViolations = useMemo(
    () =>
      recentContentViolations.filter(
        (violation) => violation.contentType?.toUpperCase() === "IMAGE",
      ).length,
    [recentContentViolations],
  );

  const textViolations = useMemo(
    () =>
      recentContentViolations.filter(
        (violation) => violation.contentType?.toUpperCase() === "TEXT",
      ).length,
    [recentContentViolations],
  );

  if (error) {
    return (
      <ErrorState
        title="Không thể tải trang kiểm duyệt"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        Đang tải dữ liệu kiểm duyệt...
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
            Kiểm duyệt
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Thống kê kiểm duyệt nội dung
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Theo dõi nội dung bị hệ thống phát hiện vi phạm và các thao tác
            khóa/mở khóa người dùng được ghi nhận từ analytic-service.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Nguồn dữ liệu:{" "}
          <span className="font-medium text-slate-900">analytic-service</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng vi phạm nội dung"
          value={data?.totalContentViolations ?? 0}
          description="Tổng số sự kiện nội dung bị từ chối đã được ghi nhận."
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          title="Vi phạm hình ảnh gần đây"
          value={imageViolations}
          description="Số vi phạm hình ảnh trong danh sách mới nhất."
          icon={<ImageOff className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          title="Vi phạm văn bản gần đây"
          value={textViolations}
          description="Số tin nhắn hoặc văn bản khớp từ khóa kiểm duyệt."
          icon={<MessageSquareWarning className="h-5 w-5" />}
          tone="neutral"
        />
        <StatCard
          title="Người dùng bị khóa"
          value={data?.totalBannedUsers ?? 0}
          description="Tính theo audit log có hành động khóa tài khoản."
          icon={<Ban className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Nội dung vi phạm
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Các nội dung bị hệ thống từ chối gần đây
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Bảng này lấy từ content_violation_logs, tức các event
            moderation.violation.detected đã được analytic-service lưu lại.
          </p>
        </div>
        <AdminTable<ContentViolationLog>
          columns={[
            {
              key: "detectedAt",
              label: "Thời điểm",
              className: "whitespace-nowrap",
              render: (row) => formatTimestamp(row.detectedAt),
            },
            {
              key: "sourceService",
              label: "Nguồn",
              className: "whitespace-nowrap font-medium text-slate-900",
              render: (row) => sourceLabel(row.sourceService),
            },
            {
              key: "contentType",
              label: "Loại nội dung",
              className: "whitespace-nowrap",
              render: (row) => contentTypeLabel(row.contentType),
            },
            {
              key: "severity",
              label: "Mức độ",
              className: "whitespace-nowrap",
              render: (row) => (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClassName(row.severity)}`}
                >
                  {severityLabel(row.severity)}
                </span>
              ),
            },
            {
              key: "violationType",
              label: "Kiểu vi phạm",
              className: "whitespace-nowrap",
              render: (row) => violationTypeLabel(row.violationType),
            },
            {
              key: "matchedLabels",
              label: "Nhãn phát hiện",
              className: "max-w-md",
              render: (row) => formatLabels(row.matchedLabels),
            },
          ]}
          rows={recentContentViolations}
          emptyTitle="Chưa có nội dung vi phạm"
          emptyDescription="Các tin nhắn hoặc hình ảnh bị từ chối sẽ xuất hiện tại đây."
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Nhật ký xử lý tài khoản
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Các thao tác khóa hoặc mở khóa người dùng
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Phần này chỉ có dữ liệu khi user-service phát event
            user.status.changed.
          </p>
        </div>
        <AdminTable<AuditLog>
          columns={[
            {
              key: "createdAt",
              label: "Thời điểm",
              className: "whitespace-nowrap",
              render: (row) => formatTimestamp(row.createdAt),
            },
            {
              key: "adminId",
              label: "Người thực hiện",
              className: "whitespace-nowrap font-medium text-slate-900",
              render: (row) => (row.adminId === "SYSTEM" ? "Hệ thống" : row.adminId),
            },
            {
              key: "targetUserId",
              label: "Người dùng",
              className: "whitespace-nowrap",
              render: (row) => row.targetUserId || "-",
            },
            {
              key: "actionType",
              label: "Hành động",
              className: "whitespace-nowrap",
              render: (row) => (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${actionBadgeClassName(row.actionType)}`}
                >
                  {actionLabel(row.actionType)}
                </span>
              ),
            },
            {
              key: "reason",
              label: "Lý do",
              className: "max-w-md",
              render: (row) => row.reason?.trim() || "Không có lý do",
            },
            {
              key: "durationMinutes",
              label: "Thời hạn",
              className: "whitespace-nowrap",
              render: (row) => formatDuration(row.durationMinutes),
            },
          ]}
          rows={recentLogs}
          emptyTitle="Chưa có nhật ký xử lý tài khoản"
          emptyDescription="Dữ liệu sẽ xuất hiện khi analytic-service nhận event user.status.changed."
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-950">Cách dữ liệu được ghi nhận</p>
            <p className="mt-1 leading-6">
              Tin nhắn và hình ảnh được gửi qua RabbitMQ để moderation-service kiểm
              tra. Khi nội dung bị từ chối, analytic-service lưu vào
              content_violation_logs. Các thao tác khóa/mở khóa tài khoản được
              lưu riêng trong admin_audit_logs.
            </p>
          </div>
        </div>
      </div>

      <ModerationRulesManager />
    </motion.section>
  );
};

export default ModerationDashboard;
