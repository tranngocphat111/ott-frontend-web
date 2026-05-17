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
    <div className="shrink-0 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
      <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
        <div className="relative group">
          <label className="cursor-pointer">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gray-100 transition-colors group-hover:bg-gray-200 sm:h-12 sm:w-12">
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
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2
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
