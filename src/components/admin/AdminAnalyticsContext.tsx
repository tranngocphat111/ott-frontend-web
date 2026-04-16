import React, { createContext, useContext, useMemo, useState } from "react";
import type { TimeRange } from "../../interfaces/admin.interface";

interface AdminAnalyticsContextValue {
  timeRange: TimeRange;
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRange>>;
}

const AdminAnalyticsContext = createContext<AdminAnalyticsContextValue | null>(
  null,
);

export const AdminAnalyticsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("allTime");

  const value = useMemo(() => ({ timeRange, setTimeRange }), [timeRange]);

  return (
    <AdminAnalyticsContext.Provider value={value}>
      {children}
    </AdminAnalyticsContext.Provider>
  );
};

export const useAdminAnalytics = () => {
  const context = useContext(AdminAnalyticsContext);

  if (!context) {
    throw new Error(
      "useAdminAnalytics must be used within AdminAnalyticsProvider",
    );
  }

  return context;
};
