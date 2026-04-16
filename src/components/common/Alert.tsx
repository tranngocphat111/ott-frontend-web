import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const styles = {
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles[type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm">{message}</p>
    </div>
  );
};