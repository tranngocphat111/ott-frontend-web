import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ErrorStateProps } from '../../interfaces';

const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'Đã xảy ra lỗi khi tải dữ liệu',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`p-6 text-center ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops!</h3>
      <p className="text-gray-600 mb-4 text-sm">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 
                   hover:bg-primary-600 rounded-lg transition-colors duration-200
                   text-white font-medium text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử lại</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;