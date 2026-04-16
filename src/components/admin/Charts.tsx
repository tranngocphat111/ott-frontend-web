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
  EventReport,
} from "../../interfaces/admin.interface";

type PieChartsProps = {
  title: string;
  data: EventReport[];
  variant: "pie";
};

type AreaChartsProps = {
  title: string;
  data: DailyActivityPoint[];
  variant: "area";
};

type ChartsProps = PieChartsProps | AreaChartsProps;

const defaultColors = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6"];

const formatNumber = new Intl.NumberFormat("vi-VN");

const Charts: React.FC<ChartsProps> = (props) => {
  const { title, variant, data } = props;

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
        <div className="h-[320px]">
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
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data as DailyActivityPoint[]}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillPosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                </linearGradient>
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
                  name === "posts" ? "Bài viết" : "Tin nhắn",
                ]}
                labelFormatter={(label) => `Ngày ${label}`}
              />
              <Legend
                formatter={(value) =>
                  value === "posts" ? "Bài viết" : "Tin nhắn"
                }
              />
              <Area
                type="monotone"
                dataKey="posts"
                stroke="#6366f1"
                fill="url(#fillPosts)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#0ea5e9"
                fill="url(#fillMessages)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default Charts;
