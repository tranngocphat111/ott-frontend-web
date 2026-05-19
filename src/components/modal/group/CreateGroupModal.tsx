import React, { useState, useMemo, useCallback } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { UserService } from '../../../services/user.service';
import type { User } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import FilterButtons from './FilterButtons';
import GroupInfoSection from './GroupInfoSection';
import UserListSection from './UserListSection';
import SelectedUsersPanel from './SelectedUsersPanel';
import type { CreateGroupModalProps, FilterType } from '../../../interfaces';

interface Category {
  _id: string;
  name: string;
}

import { useAuth } from '../../../contexts/AuthContext';

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  availableUsers,
  preSelectedUserIds,
  categories = []
}) => {
  const { user: currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [phoneSearchResult, setPhoneSearchResult] = useState<User | null>(null);
  const [foundStrangers, setFoundStrangers] = useState<User[]>([]);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);

  // Initialize selectedUsers with preSelectedUserIds when modal opens
  React.useEffect(() => {
    if (isOpen && preSelectedUserIds?.length) {
      setSelectedUsers(new Set(preSelectedUserIds));
    }
  }, [isOpen, preSelectedUserIds]);

  // Phone search logic
  React.useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 10 || !/^[0-9]+$/.test(searchTerm.trim())) {
      setPhoneSearchResult(null);
      setIsSearchingPhone(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPhone(true);
      try {
        const user = await UserService.getUserByPhone(searchTerm.trim());
        if (user && user.user_id === currentUser?.id) {
          setPhoneSearchResult(null);
        } else if (user) {
          setPhoneSearchResult(user);
          setFoundStrangers(prev => {
            if (!prev.some(u => u.user_id === user.user_id)) {
              return [...prev, user];
            }
            return prev;
          });
        } else {
          setPhoneSearchResult(null);
        }
      } catch (error) {
        console.error('Phone search failed', error);
        setPhoneSearchResult(null);
      } finally {
        setIsSearchingPhone(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build filters from user categories
  const filters = useMemo(() => {
    const baseFilters: Array<{ id: FilterType | string; label: string }> = [
      { id: 'all', label: 'Tất cả' },
    ];

    // Add categories loaded from the same source as conversation category menu
    categories.forEach((cat: Category) => {
      if (!cat?._id || !cat?.name) return;
      baseFilters.push({ id: cat._id, label: cat.name });
    });

    return baseFilters;
  }, [categories]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const allPotentialUsers = useMemo(() => {
    const list = [...availableUsers];
    foundStrangers.forEach(stranger => {
      if (!list.some(u => u.user_id === stranger.user_id)) {
        list.push(stranger);
      }
    });
    return list;
  }, [availableUsers, foundStrangers]);

  const filteredUsers = useMemo(() => {
    return availableUsers.filter(user => {
      const name = user.display_name || user.name || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [availableUsers, searchTerm]);

  // Group users by first letter
  const groupedUsers = useMemo(() => 
    filteredUsers.reduce((acc, user) => {
      const firstLetter = (user.display_name || user.name || '').charAt(0).toUpperCase();
      const key = /[0-9]/.test(firstLetter) ? '0-9' : firstLetter || '#';
      if (!acc[key]) acc[key] = [];
      acc[key].push(user);
      return acc;
    }, {} as Record<string, typeof filteredUsers>),
    [filteredUsers]
  );

  const sortedGroups = useMemo(() => 
    Object.keys(groupedUsers).sort((a, b) => {
      if (a === '0-9') return 1;
      if (b === '0-9') return -1;
      return a.localeCompare(b);
    }),
    [groupedUsers]
  );



  const handleToggleUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        if (newSelected.size >= 100) {
          alert('Chỉ có thể chọn tối đa 100 thành viên');
          return prev;
        }
        newSelected.add(userId);
      }
      return newSelected;
    });
  }, []);

  const removeSelectedUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => {
      const newSelected = new Set(prev);
      newSelected.delete(userId);
      return newSelected;
    });
  }, []);

  const selectedUsersList = allPotentialUsers.filter(u => selectedUsers.has(u.user_id));

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    if (!mime) return null;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCreate = useCallback(async () => {
    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedUsers.size < 2) {
      return;
    }

    let finalAvatarUrl = groupAvatar;

    // If avatar is base64, upload to S3 first
    if (groupAvatar && groupAvatar.startsWith('data:')) {
      try {
        const file = dataURLtoFile(groupAvatar, `group_avatar_${Date.now()}.png`);
        if (file) {
          const { MessageService } = await import('../../../services');
          const presignedData = await MessageService.getPresignedUrl(file.name, file.type);
          console.log("Presigned data in modal:", presignedData);
          const { uploadUrl, fileUrl } = presignedData;
          await MessageService.uploadFileToS3(uploadUrl, file);
          finalAvatarUrl = fileUrl;
        }
      } catch (err) {
        console.error('Failed to upload group avatar:', err);
        // Continue without avatar or alert user? Let's alert.
        alert('Tải ảnh nhóm thất bại. Đang tiếp tục tạo nhóm không có ảnh.');
        finalAvatarUrl = '';
      }
    }

    const selected = allPotentialUsers.filter(user => selectedUsers.has(user.user_id));
    const memberIds = selected.map(u => u.user_id);
    const memberNames = selected.map(u => u.display_name || u.name || "Người dùng");

    console.log("Creating group in modal with avatar URL:", finalAvatarUrl);
    onCreateGroup(groupName, selected, finalAvatarUrl, memberNames);
    
    // Reset state and close
    setGroupName('');
    setGroupAvatar('');
    setSearchTerm('');
    setSelectedUsers(new Set());
    setActiveFilter('all');
    onClose();
  }, [groupName, selectedUsers, groupAvatar, allPotentialUsers, onCreateGroup, onClose]);

  const handleClose = useCallback(() => {
    setGroupName('');
    setGroupAvatar('');
    setSearchTerm('');
    setSelectedUsers(new Set());
    setActiveFilter('all');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-60 flex items-center justify-center overflow-hidden bg-black/50 p-2 sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-auto sm:max-h-[min(86dvh,760px)]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Tạo nhóm</h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
              {/* Left Side - User Selection */}
              <div className="flex min-h-0 flex-1 flex-col md:border-r md:border-gray-200">
                <GroupInfoSection
                  groupName={groupName}
                  groupAvatar={groupAvatar}
                  searchTerm={searchTerm}
                  onGroupNameChange={setGroupName}
                  onAvatarChange={handleAvatarChange}
                  onSearchChange={setSearchTerm}
                />

                {/* Filters */}
                <div className="shrink-0 border-b border-gray-200 px-4 py-2 sm:px-6 sm:py-3">
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
                  selectedUserIds={selectedUsers}
                  searchTerm={searchTerm}
                  onToggleUser={handleToggleUser}
                  phoneSearchResult={phoneSearchResult}
                  isSearchingPhone={isSearchingPhone}
                />
              </div>

              <SelectedUsersPanel
                selectedUsers={selectedUsersList}
                onRemove={removeSelectedUser}
              />
            </div>

            {/* Footer */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
              <div className="min-h-5 text-sm text-gray-500">
                {selectedUsers.size > 0 && (
                  <>
                    {selectedUsers.size} thành viên được chọn
                    {selectedUsers.size < 2 && <span> (cần tối thiểu 2)</span>}
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 sm:gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:px-6"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={!groupName.trim() || selectedUsers.size < 2}
                  className="rounded-lg bg-primary-500 px-4 py-2 font-medium text-white sm:px-6
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



