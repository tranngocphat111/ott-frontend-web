import React from 'react';
import { X } from 'lucide-react';
import Avatar from '../../common/Avatar';
import type { SelectedUsersListProps } from '../../../interfaces';

const SelectedUsersList: React.FC<SelectedUsersListProps> = ({ selectedUsers, onRemoveUser }) => {
  if (selectedUsers.length === 0) return null;

  return (
    <div className="border-t pt-4">
      <p className="text-sm font-medium text-gray-700 mb-3">
        Đã chọn {selectedUsers.length} thành viên
      </p>
      <div className="flex flex-wrap gap-2">
        {selectedUsers.map((user) => (
          <div
            key={user._id}
            className="flex items-center gap-2 bg-primary-500/10 rounded-full px-3 py-1.5 group"
          >
            <Avatar name={user.display_name} src={user.avatar_url} size={24} />
            <span className="text-sm font-medium text-gray-900">{user.display_name}</span>
            <button
              onClick={() => onRemoveUser(user._id)}
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedUsersList;
