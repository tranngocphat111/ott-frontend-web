export interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  onClick?: () => void;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface LoadingSkeletonProps {
  count?: number;
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}
