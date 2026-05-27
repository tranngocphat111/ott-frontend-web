import React from "react";
import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value?: number | string | null;
  delta?: number | null;
  description?: string;
  icon?: ReactNode;
  tone?: "neutral" | "danger" | "success" | "info" | "violet";
}

const toneStyles = {
  neutral: "bg-slate-100 text-slate-700",
  danger: "bg-red-50 text-red-700",
  success: "bg-emerald-50 text-emerald-700",
  info: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
};

const toDisplayNumber = (value: StatCardProps["value"]) => {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : 0;

  return Number.isFinite(numericValue) ? numericValue : 0;
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  delta = null,
  description,
  icon,
  tone = "neutral",
}) => {
  const displayValue = toDisplayNumber(value);
  const displayDelta = typeof delta === "number" && Number.isFinite(delta) ? delta : null;

  const deltaClassName =
    displayDelta === null
      ? "bg-slate-100 text-slate-600"
      : displayDelta > 0
        ? "bg-emerald-50 text-emerald-700"
        : displayDelta < 0
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-600";

  const DeltaIcon =
    displayDelta === null
      ? ArrowRight
      : displayDelta > 0
        ? ArrowUpRight
        : displayDelta < 0
          ? ArrowDownRight
          : ArrowRight;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {displayValue.toLocaleString()}
          </p>
          {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
        </div>
        {icon ? (
          <div className={`rounded-lg p-3 ${toneStyles[tone]}`}>{icon}</div>
        ) : null}
      </div>

      {displayDelta !== null && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${deltaClassName}`}
          >
            <DeltaIcon className="h-3.5 w-3.5" />
            {Math.abs(displayDelta).toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">so với kỳ trước</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
