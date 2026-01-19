import React from 'react';
import { X } from 'lucide-react';
import Avatar from '../../common/Avatar';
import type { SelectedUsersPanelProps } from '../../../interfaces';

const SelectedUsersPanel: React.FC<SelectedUsersPanelProps> = ({
  selectedUsers,
  onRemove,
  maxUsers = 100
}) => {
  return (
    <div className="w-80 flex flex-col bg-gray-50">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">
          Đã chọn{' '}
          <span className="text-primary-600">
            {selectedUsers.length}/{maxUsers}
          </span>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {selectedUsers.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            Chưa chọn thành viên nào
          </div>
        ) : (
          <div className="space-y-2">
            {selectedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 p-2 bg-white rounded-lg"
              >
                <Avatar name={user.display_name} src={user.avatar_url} size={32} />
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                  {user.display_name}
                </span>
                <button
                  onClick={() => onRemove(user._id)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedUsersPanel;
