import React from 'react';
import { Search } from 'lucide-react';
import type { SearchBarProps } from '../../interfaces';

const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Tìm kiếm...', 
  onFocus,
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="text-sm w-full pl-10 pr-4 py-1.5 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
      />
    </div>
  );
};

export default SearchBar;
