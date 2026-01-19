// Common component props
export interface LoadingSkeletonProps {
  count?: number;
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}
