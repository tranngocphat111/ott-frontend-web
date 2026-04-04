import React from 'react';
import { Users, Search, UserPlus } from 'lucide-react';

const ContactsPage: React.FC = () => {
  return (
    <div className="flex h-full bg-white">
      {/* Contacts Sidebar */}
      <div className="w-96 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Danh bạ</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm danh bạ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Chưa có danh bạ nào</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Detail */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <UserPlus className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Thêm bạn bè mới</h2>
          <p className="text-gray-500 mb-6">Kết nối và trò chuyện với mọi người</p>
          <button className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            Thêm bạn bè
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;
