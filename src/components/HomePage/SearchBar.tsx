import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch,
  placeholder = 'Tìm kiếm tin nhắn...' 
}) => {
  const [search, setSearch] = useState('');

  const handleChange = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};