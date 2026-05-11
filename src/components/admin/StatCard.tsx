import React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: number;
  delta?: number | null;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, delta = null }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value.toLocaleString()}
          </p>
        </div>
        {delta !== null && (
          <div className="text-right">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                delta > 0
                  ? "bg-green-50 text-green-700"
                  : delta < 0
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "–"}
              <span className="ml-1">{Math.abs(delta).toFixed(1)}%</span>
            </span>
            <div className="text-xs text-slate-400 mt-1">so với kỳ trước</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
