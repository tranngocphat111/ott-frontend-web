import React from "react";
import { CalendarDays, ChevronDown, Shield } from "lucide-react";
import { useAdminAnalytics } from "./AdminAnalyticsContext";
import type { TimeRange } from "../../interfaces/admin.interface";

const timeRangeOptions: Array<{ label: string; value: TimeRange }> = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày qua", value: "last7Days" },
  { label: "30 ngày qua", value: "last30Days" },
  { label: "Tất cả", value: "allTime" },
];

const Header: React.FC = () => {
  const { timeRange, setTimeRange } = useAdminAnalytics();

  return (
    <header className="border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Shield className="h-5 w-5 text-indigo-600" />
            <h1 className="truncate text-lg">Bảng quản trị OTT</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi sức khỏe nền tảng, kiểm duyệt và hoạt động người dùng.
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-600">
          <span className="hidden whitespace-nowrap font-medium sm:inline">
            Khoảng thời gian
          </span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value as TimeRange)}
              className="min-w-44 appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:bg-white"
              aria-label="Chọn khoảng thời gian"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </label>
      </div>
    </header>
  );
};

export default Header;
