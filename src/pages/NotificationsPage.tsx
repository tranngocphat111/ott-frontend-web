import React from 'react';
import { Bell, BellOff } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  return (
    <div className="flex h-full bg-white items-center justify-center">
      <div className="text-center max-w-md">
        <div className="flex gap-4 justify-center mb-6">
          <div className="p-6 bg-yellow-50 rounded-full">
            <Bell className="w-12 h-12 text-yellow-600" />
          </div>
          <div className="p-6 bg-gray-50 rounded-full">
            <BellOff className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thông báo</h2>
        <p className="text-gray-600 mb-6">Bạn chưa có thông báo mới nào</p>
        <p className="text-sm text-gray-500">
          Khi có thông báo mới, chúng sẽ xuất hiện ở đây
        </p>
      </div>
    </div>
  );
};

export default NotificationsPage;
