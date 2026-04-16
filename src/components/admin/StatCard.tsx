import React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value.toLocaleString()}
      </p>
    </motion.div>
  );
};

export default StatCard;
