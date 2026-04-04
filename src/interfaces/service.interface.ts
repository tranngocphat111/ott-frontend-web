export interface LoadingState {
  isLoading: boolean;
  error?: string;
  retry?: () => void;
}

export interface ChatServiceResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}
