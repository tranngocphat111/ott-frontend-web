import React from 'react';
import type { LoadingSkeletonProps } from '../../interfaces';

const ConversationSkeleton: React.FC = () => (
  <div className="p-3 animate-pulse">
    <div className="flex items-center gap-3">
      {/* Avatar skeleton */}
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: count }).map((_, index) => (
        <ConversationSkeleton key={index} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;