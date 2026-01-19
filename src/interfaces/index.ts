// Conversation related interfaces
export type {
  ConversationListProps,
  ConversationItemProps,
} from './conversation.interface';

// Chat related interfaces
export type {
  ChatLayoutProps,
  ChatAreaProps,
} from './chat.interface';

// Sidebar interfaces
export type { SidebarProps } from './sidebar.interface';

// Navigation interfaces
export type {
  NavigationSidebarProps,
  NavigationItem,
  NavigationItemProps,
} from './navigation.interface';

// Modal interfaces
export type {
  CreateGroupModalProps,
  CategoryManagementModalProps,
  CategoryModalProps,
  ConversationContextMenuProps,
  FilterType,
  GroupInfoSectionProps,
  UserListSectionProps,
  SelectedUsersPanelProps,
  FilterButtonsProps,
  UserSelectCardProps,
  SelectedUsersListProps,
  MuteOption,
  MuteSubmenuProps,
  MenuItemProps,
  CategorySubmenuProps,
  CategoryItemProps,
  AddCategoryFormProps,
} from './modal.interface';

// Common component interfaces
export type {
  LoadingSkeletonProps,
  ErrorStateProps,
} from './component.interface';

// Layout interfaces
export type { MainLayoutProps } from './layout.interface';

// Common component interfaces
export type {
  AvatarProps,
  LoadingSkeletonProps,
  ErrorStateProps,
  SearchBarProps,
} from './common.interface';

// Service interfaces
export type {
  LoadingState,
  ChatServiceResponse,
} from './service.interface';

// Re-export types
export type { Conversation, Message, Participant, User, MessageAttachment } from '../types';