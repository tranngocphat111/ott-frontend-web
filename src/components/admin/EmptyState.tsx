import React from "react";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No analytics data for this view",
  description = "Adjust the time range or wait for more events to arrive from the platform services.",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </motion.div>
  );
};

export default EmptyState;
