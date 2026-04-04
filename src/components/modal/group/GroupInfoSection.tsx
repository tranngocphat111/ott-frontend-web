import React from 'react';
import { Camera } from 'lucide-react';
import SearchBar from '../../common/SearchBar';
import type { GroupInfoSectionProps } from '../../../interfaces';

const GroupInfoSection: React.FC<GroupInfoSectionProps> = ({
  groupName,
  groupAvatar,
  searchTerm,
  onGroupNameChange,
  onAvatarChange,
  onSearchChange
}) => {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative group">
          <label className="cursor-pointer">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden group-hover:bg-gray-200 transition-colors">
              {groupAvatar ? (
                <img src={groupAvatar} alt="Group avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <input
          type="text"
          placeholder="Nhập tên nhóm..."
          value={groupName}
          onChange={(e) => onGroupNameChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200
                   focus:border-primary-500 focus:outline-none transition-colors
                   text-gray-900 placeholder-gray-400"
          autoFocus
        />
      </div>

      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Nhập tên, số điện thoại, hoặc danh sách số điện thoại"
      />
    </div>
  );
};

export default GroupInfoSection;
