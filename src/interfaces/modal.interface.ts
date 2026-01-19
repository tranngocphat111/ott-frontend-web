import type { User, Category } from '../types';

// Modal Props
export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, selectedUsers: User[], avatar?: string) => void;
  availableUsers: User[];
}

export interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId: string) => void;
  currentUserId: string;
  currentCategory?: string;
}

export interface ConversationContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onPin: () => void;
  onSelectCategory: (categoryId: string) => void;
  onManageCategories: () => void;
  onMute: (duration: string) => void;
  onDelete: () => void;
  isPinned?: boolean;
  isMuted?: boolean;
  categories: Category[];
  currentCategoryId?: string;
}

// Modal specific types
export type FilterType = 'all' | 'customer' | 'family' | 'work' | 'friends' | 'later';

// Group Modal Component Props
export interface GroupInfoSectionProps {
  groupName: string;
  groupAvatar: string;
  searchTerm: string;
  onGroupNameChange: (name: string) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchChange: (term: string) => void;
}

export interface UserListSectionProps {
  filteredUsers: User[];
  groupedUsers: Record<string, User[]>;
  sortedGroups: string[];
  recentUsers: User[];
  selectedUserIds: Set<string>;
  searchTerm: string;
  onToggleUser: (userId: string) => void;
}

export interface SelectedUsersPanelProps {
  selectedUsers: User[];
  onRemove: (userId: string) => void;
  maxUsers?: number;
}

export interface FilterButtonsProps {
  filters: Array<{ id: FilterType; label: string }>;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

// User Select Card Props
export interface UserSelectCardProps {
  user: User;
  isSelected: boolean;
  onToggle: (userId: string) => void;
}

export interface SelectedUsersListProps {
  selectedUsers: User[];
  onRemoveUser: (userId: string) => void;
}

// Context Menu Subcomponents
export interface MuteOption {
  id: string;
  label: string;
}

export interface MuteSubmenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  isMuted: boolean;
  onMute: (duration: string) => void;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export interface MenuItemProps {
  icon: any; // LucideIcon type
  label: string;
  onClick: () => void;
  color: string;
  isDanger?: boolean;
  hasSubmenu?: boolean;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: () => void;
}

export interface CategorySubmenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  categories: Category[];
  currentCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
  onManageCategories: () => void;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// Category Modal Component Props
export interface CategoryItemProps {
  category: Category;
  isEditing: boolean;
  editName: string;
  editColor: string;
  onEditStart: (category: Category) => void;
  onEditNameChange: (name: string) => void;
  onEditColorChange: (color: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

export interface AddCategoryFormProps {
  isAdding: boolean;
  newName: string;
  newColor: string;
  defaultColors: string[];
  onStartAdding: () => void;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
  onCancel: () => void;
}
