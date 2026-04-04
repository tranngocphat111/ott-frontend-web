import React from 'react';
import { Search } from 'lucide-react';

const SearchPage: React.FC = () => {
  return (
    <div className="flex h-full bg-white items-center justify-center">
      <div className="text-center max-w-md">
        <Search className="w-20 h-20 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tìm kiếm</h2>
        <p className="text-gray-600 mb-6">Tìm kiếm tin nhắn, người dùng và nội dung</p>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Nhập từ khóa tìm kiếm..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
