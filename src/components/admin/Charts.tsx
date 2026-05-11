import React from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "./EmptyState";
import type {
  DailyActivityPoint,
  DailyUserTrendPoint,
  EventReport,
} from "../../interfaces/admin.interface";

type PieChartsProps = {
  title: string;
  data: EventReport[];
  variant: "pie";
};

type AreaChartsProps = {
  title: string;
  data: Array<DailyActivityPoint | DailyUserTrendPoint>;
  variant: "area";
  series?: Array<{
    key: string;
    label: string;
    stroke: string;
    fillId: string;
    gradientStop: string;
  }>;
};

type ChartsProps = PieChartsProps | AreaChartsProps;

const defaultColors = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6"];

const formatNumber = new Intl.NumberFormat("vi-VN");

const Charts: React.FC<ChartsProps> = (props) => {
  const { title, variant, data } = props;
  const areaSeries =
    variant === "area" && props.series
      ? props.series
      : variant === "area"
        ? [
            {
              key: "posts",
              label: "Bài viết",
              stroke: "#6366f1",
              fillId: "fillPosts",
              gradientStop: "#6366f1",
            },
            {
              key: "messages",
              label: "Tin nhắn",
              stroke: "#0ea5e9",
              fillId: "fillMessages",
              gradientStop: "#0ea5e9",
            },
          ]
        : [];

  const isEmpty =
    data.length === 0 ||
    (variant === "pie" &&
      (data as EventReport[]).every((item) => item.value === 0));

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {variant === "pie" ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as EventReport[]}
                dataKey="value"
                nameKey="title"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
              >
                {(data as EventReport[]).map((entry, index) => (
                  <Cell
                    key={entry.title}
                    fill={
                      entry.color ?? defaultColors[index % defaultColors.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  formatNumber.format(Number(value ?? 0)),
                  "Số lượng",
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data as Array<DailyActivityPoint | DailyUserTrendPoint>}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                {areaSeries.map((series) => (
                  <linearGradient
                    key={series.fillId}
                    id={series.fillId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={series.gradientStop}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor={series.gradientStop}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatNumber.format(Number(value ?? 0)),
                  areaSeries.find((series) => series.key === name)?.label ??
                    String(name),
                ]}
                labelFormatter={(label) => `Ngày ${label}`}
              />
              <Legend
                formatter={(value) =>
                  areaSeries.find((series) => series.key === value)?.label ??
                  String(value)
                }
              />
              {areaSeries.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  stroke={series.stroke}
                  fill={`url(#${series.fillId})`}
                  strokeWidth={3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default Charts;
