import React from 'react';
import UserSelectCard from './UserSelectCard';
import type { UserListSectionProps } from '../../../interfaces';

const UserListSection: React.FC<UserListSectionProps> = ({
  filteredUsers,
  groupedUsers,
  sortedGroups,
  recentUsers,
  selectedUserIds,
  searchTerm,
  onToggleUser
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {/* Recent Conversations */}
      {!searchTerm && recentUsers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Trò chuyện gần đây
          </h3>
          <div className="space-y-1">
            {recentUsers.map((user) => (
              <UserSelectCard
                key={user._id}
                user={user}
                isSelected={selectedUserIds.has(user._id)}
                onToggle={onToggleUser}
              />
            ))}
          </div>
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
                  key={user._id}
                  user={user}
                  isSelected={selectedUserIds.has(user._id)}
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
