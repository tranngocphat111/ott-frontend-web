import React from 'react';
import Avatar from '../../common/Avatar';
import type { UserSelectCardProps } from '../../../interfaces';

const UserSelectCard: React.FC<UserSelectCardProps> = ({ user, isSelected, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(user._id)}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-primary-400 border-primary-400'
            : 'border-gray-300'
        }`}
      >
        {isSelected && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <Avatar name={user.display_name || user.name} src={user.avatar} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{user.display_name}</p>
      </div>
    </div>
  );
};

export default UserSelectCard;
