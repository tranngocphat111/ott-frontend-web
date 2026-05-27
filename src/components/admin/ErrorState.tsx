import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Không thể tải dữ liệu phân tích",
  description = "Module quản trị không thể lấy dữ liệu từ backend.",
  onRetry,
}) => {
  return (
    <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
            Lỗi dữ liệu
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
