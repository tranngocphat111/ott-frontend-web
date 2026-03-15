import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterButtons from './FilterButtons';
import GroupInfoSection from './GroupInfoSection';
import UserListSection from './UserListSection';
import SelectedUsersPanel from './SelectedUsersPanel';
import type { CreateGroupModalProps, FilterType } from '../../../interfaces';

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  availableUsers
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filters = [
    { id: 'all' as FilterType, label: 'Tất cả' },
    { id: 'customer' as FilterType, label: 'Khách hàng' },
    { id: 'family' as FilterType, label: 'Gia đình' },
    { id: 'work' as FilterType, label: 'Công việc' },
    { id: 'friends' as FilterType, label: 'Bạn bè' },
    { id: 'later' as FilterType, label: 'Trả lời sau' }
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = availableUsers.filter(user => {
    const name = user.display_name || user.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group users by first letter
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const firstLetter = (user.display_name || user.name || '').charAt(0).toUpperCase();
    const key = /[0-9]/.test(firstLetter) ? '0-9' : firstLetter || '#';
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {} as Record<string, typeof filteredUsers>);

  const sortedGroups = Object.keys(groupedUsers).sort((a, b) => {
    if (a === '0-9') return 1;
    if (b === '0-9') return -1;
    return a.localeCompare(b);
  });

  const recentUsers = filteredUsers.slice(0, 6);

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      if (newSelected.size >= 100) {
        alert('Chỉ có thể chọn tối đa 100 thành viên');
        return;
      }
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const removeSelectedUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    newSelected.delete(userId);
    setSelectedUsers(newSelected);
  };

  const selectedUsersList = availableUsers.filter(u => selectedUsers.has(u._id));

  const handleCreate = () => {
    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedUsers.size === 0) {
      alert('Vui lòng chọn ít nhất một thành viên');
      return;
    }
    const selected = availableUsers.filter(user => selectedUsers.has(user._id));
    onCreateGroup(groupName, selected, groupAvatar);
    handleClose();
  };

  const handleClose = () => {
    setGroupName('');
    setGroupAvatar('');
    setSearchTerm('');
    setSelectedUsers(new Set());
    setActiveFilter('all');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Tạo nhóm</h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - User Selection */}
              <div className="flex-1 flex flex-col border-r border-gray-200">
                <GroupInfoSection
                  groupName={groupName}
                  groupAvatar={groupAvatar}
                  searchTerm={searchTerm}
                  onGroupNameChange={setGroupName}
                  onAvatarChange={handleAvatarChange}
                  onSearchChange={setSearchTerm}
                />

                {/* Filters */}
                <div className="px-6 py-3 border-b border-gray-200">
                  <FilterButtons
                    filters={filters}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                  />
                </div>

                <UserListSection
                  filteredUsers={filteredUsers}
                  groupedUsers={groupedUsers}
                  sortedGroups={sortedGroups}
                  recentUsers={recentUsers}
                  selectedUserIds={selectedUsers}
                  searchTerm={searchTerm}
                  onToggleUser={handleToggleUser}
                />
              </div>

              <SelectedUsersPanel
                selectedUsers={selectedUsersList}
                onRemove={removeSelectedUser}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {selectedUsers.size > 0 && `${selectedUsers.size} thành viên được chọn`}
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={!groupName.trim() || selectedUsers.size === 0}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium
                           hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                           transition-colors"
                >
                  Tạo nhóm
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupModal;



