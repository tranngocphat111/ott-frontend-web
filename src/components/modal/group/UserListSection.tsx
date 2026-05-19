import React from 'react';
import { Loader2, Search } from 'lucide-react';
import UserSelectCard from './UserSelectCard';
import type { UserListSectionProps } from '../../../interfaces';

const UserListSection: React.FC<UserListSectionProps> = ({
  filteredUsers,
  groupedUsers,
  sortedGroups,
  selectedUserIds,
  searchTerm,
  onToggleUser,
  phoneSearchResult,
  isSearchingPhone
}) => {
  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
      {/* Phone Search Results Section */}
      {searchTerm.trim().length >= 10 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Search size={14} />
            Kết quả tìm kiếm số điện thoại
          </h3>
          {isSearchingPhone ? (
            <div className="flex items-center gap-2 p-3 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tìm kiếm...
            </div>
          ) : phoneSearchResult ? (
            <UserSelectCard
              key={phoneSearchResult.user_id}
              user={phoneSearchResult}
              isSelected={selectedUserIds.has(phoneSearchResult.user_id)}
              onToggle={onToggleUser}
              className="bg-primary-50 border border-primary-100"
            />
          ) : (
            <div className="p-3 text-sm text-gray-500 italic bg-gray-50 rounded-xl border border-gray-100">
              Không tìm thấy người dùng với số điện thoại này
            </div>
          )}
          <div className="mt-6 border-b border-gray-100" />
        </div>
      )}

      {/* Grouped Users */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Không tìm thấy người dùng
        </div>
      ) : (
        sortedGroups.map((letter) => (
          <div key={letter} className="mb-4">
            <h3 className="text-xs font-semibold text-gray-400 mb-2 px-2">
              {letter}
            </h3>
            <div className="space-y-1">
              {groupedUsers[letter].map((user) => (
                <UserSelectCard
                  key={user.user_id}
                  user={user}
                  isSelected={selectedUserIds.has(user.user_id)}
                  onToggle={onToggleUser}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserListSection;
