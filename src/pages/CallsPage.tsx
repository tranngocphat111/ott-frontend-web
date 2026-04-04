import React from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';

const CallsPage: React.FC = () => {
  return (
    <div className="flex h-full bg-white">
      {/* Calls Sidebar */}
      <div className="w-96 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Cuộc gọi</h1>
        </div>

        {/* Calls List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Phone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Chưa có cuộc gọi nào</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Detail */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="flex gap-4 justify-center mb-6">
            <div className="p-4 bg-green-50 rounded-full">
              <PhoneIncoming className="w-8 h-8 text-green-600" />
            </div>
            <div className="p-4 bg-blue-50 rounded-full">
              <PhoneOutgoing className="w-8 h-8 text-blue-600" />
            </div>
            <div className="p-4 bg-red-50 rounded-full">
              <PhoneMissed className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lịch sử cuộc gọi</h2>
          <p className="text-gray-500">Tất cả cuộc gọi của bạn sẽ hiển thị ở đây</p>
        </div>
      </div>
    </div>
  );
};

export default CallsPage;
