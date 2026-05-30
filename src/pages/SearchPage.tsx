import React, { useState, useEffect } from 'react';
import { Search, User as UserIcon, Phone, Mail } from 'lucide-react';
import { UserService } from '../services/user.service';
import type { User } from '../types';
import Avatar from '../components/common/Avatar';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        try {
          const users = await UserService.searchUsers(query);
          setResults(users);
        } catch (error) {
          console.error("Failed to search users", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="flex flex-col h-full bg-white w-full max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center mt-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tìm kiếm Người dùng</h2>
        <p className="text-gray-600 mb-6">Tìm kiếm theo họ tên, email hoặc số điện thoại</p>
        
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên, email, sđt..."
            className="w-full pl-14 pr-4 py-4 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((user) => (
              <div key={user._id || user.user_id} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                <Avatar src={user.avatar_url || user.avatar} alt={user.name} size="lg" />
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{user.name}</h3>
                  {user.email && (
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Mail className="w-4 h-4 mr-2" />
                      {user.email}
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Phone className="w-4 h-4 mr-2" />
                      {user.phone}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="text-center py-10 text-gray-500">
            Không tìm thấy người dùng nào phù hợp với "{query}"
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchPage;
