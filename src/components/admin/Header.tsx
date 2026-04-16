import React from "react";
import { ChevronDown, CalendarDays } from "lucide-react";
import { useAdminAnalytics } from "./AdminAnalyticsContext";
import type { TimeRange } from "../../interfaces/admin.interface";

const timeRangeOptions: Array<{ label: string; value: TimeRange }> = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày gần đây", value: "last7Days" },
  { label: "30 ngày gần đây", value: "last30Days" },
  { label: "Tất cả thời gian", value: "allTime" },
];

const Header: React.FC = () => {
  const { timeRange, setTimeRange } = useAdminAnalytics();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg">Bảng điều khiển quản trị</h1>
        </div>
        <p className="text-sm text-slate-500">
          Theo dõi dữ liệu phân tích theo thời gian
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-600">
        <span className="hidden sm:inline font-medium">Khoảng thời gian</span>
        <div className="relative">
          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value as TimeRange)}
            className="min-w-44 appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:bg-white"
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
    </header>
  );
};

export default Header;
