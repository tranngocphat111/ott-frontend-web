import React from "react";

interface Props {
  isLoading: boolean;
}

const InfiniteScrollIndicator: React.FC<Props> = ({ isLoading }) => {
  if (!isLoading) return null;
  return (
    <div className="flex justify-center items-center py-6">
      <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
};

export default InfiniteScrollIndicator;
