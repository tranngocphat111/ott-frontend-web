import React from 'react';
import { X } from 'lucide-react';
import Avatar from '../../common/Avatar';
import { getFullUrl } from '../../../utils';
import type { SelectedUsersPanelProps } from '../../../interfaces';

const SelectedUsersPanel: React.FC<SelectedUsersPanelProps> = ({
  selectedUsers,
  onRemove,
  maxUsers = 100
}) => {
  return (
    <div className="flex max-h-36 shrink-0 flex-col border-t border-gray-200 bg-gray-50 md:max-h-none md:w-80 md:border-t-0">
      <div className="shrink-0 border-b border-gray-200 px-4 py-2.5 md:py-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Đã chọn{' '}
          <span className="text-primary-600">
            {selectedUsers.length}/{maxUsers}
          </span>
        </h3>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-3 md:overflow-y-auto md:p-4">
        {selectedUsers.length === 0 ? (
          <div className="py-3 text-center text-sm text-gray-400 md:py-8">
            Chưa chọn thành viên nào
          </div>
        ) : (
          <div className="flex gap-2 md:block md:space-y-2">
            {selectedUsers.map((user) => (
              <div
                key={user.user_id || user._id}
                className="flex min-w-48 items-center gap-3 rounded-lg bg-white p-2 shadow-sm md:min-w-0"
              >
                <Avatar name={user.display_name || user.name} src={getFullUrl(user.avatar)} size={32} />
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                  {user.display_name || user.name}
                </span>
                <button
                  onClick={() => onRemove(user.user_id)}
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
